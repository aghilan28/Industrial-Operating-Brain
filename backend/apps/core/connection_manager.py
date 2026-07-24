"""Phase 5 — Lock-Safe WebSocket Connection & Subscription Manager.

Replaces the pre-Phase-5 in-memory ``List[WebSocket]`` that was mutated while
being iterated (``RuntimeError: dictionary changed size during iteration``),
never pruned dead sockets (unbounded memory growth), and had no concept of
per-asset channels — every client received the entire plant floor's telemetry.

Design guarantees
-----------------
1. **Lock-safe.**   All registry mutations happen under a single
   ``asyncio.Lock``. Fan-out iterates over a *snapshot* taken under the lock,
   so a client disconnecting mid-broadcast can never corrupt the iteration.
2. **Leak-free.**   :meth:`disconnect` removes the socket *and* every
   subscription entry referencing it, collapsing empty channels.
3. **Bounded writes.** Every frame write is wrapped in ``asyncio.wait_for``.
   A stalled ("slow consumer") TCP peer can never block the dispatcher: it
   trips the timeout, is marked stale, and is pruned after the fan-out pass.
4. **Serialized writes.** Each connection owns a write lock so concurrent
   telemetry + heartbeat frames can never interleave on the same socket.

Backward compatibility
----------------------
The Stage-2 surface (``manager.active_connections`` as a list of raw sockets,
``await manager.broadcast(dict)`` delivering via ``send_json``) is preserved
verbatim so existing tests and callers keep working.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any, Dict, Iterable, List, Optional, Set, Union

from apps.schemas.streaming import StreamEventEnvelope

logger = logging.getLogger("iob.realtime.connection_manager")

# A single frame write may never block the dispatcher for longer than this.
SEND_TIMEOUT_SECONDS = 5.0


class ClientConnection:
    """Server-side registry record for one live WebSocket session."""

    __slots__ = ("client_id", "websocket", "subscriptions", "metadata", "write_lock")

    def __init__(
        self,
        client_id: str,
        websocket: Any,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.client_id = client_id
        self.websocket = websocket
        self.subscriptions: Set[str] = set()
        self.metadata: Dict[str, Any] = metadata or {}
        # Serializes concurrent writes (telemetry fan-out vs. heartbeat).
        self.write_lock = asyncio.Lock()

    def __repr__(self) -> str:  # pragma: no cover - diagnostics only
        return (
            f"<ClientConnection id={self.client_id} "
            f"subs={sorted(self.subscriptions)}>"
        )


class ConnectionManager:
    """Production-grade, lock-safe WebSocket connection and subscription registry."""

    def __init__(self) -> None:
        # client_id -> ClientConnection
        self._connections: Dict[str, ClientConnection] = {}
        # asset_id -> set of client_id
        self._subscriptions: Dict[str, Set[str]] = {}
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Legacy compatibility surface (Stage 2)
    # ------------------------------------------------------------------

    @property
    def active_connections(self) -> List[Any]:
        """Live WebSocket objects.

        Retained so pre-Phase-5 assertions such as
        ``assert websocket in manager.active_connections`` keep working.
        Returns a *copy*, so callers can never mutate internal state.
        """
        return [conn.websocket for conn in self._connections.values()]

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(
        self,
        websocket: Any,
        client_id: Optional[str] = None,
        *,
        accept: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Accept and register a WebSocket. Returns the assigned ``client_id``.

        ``accept=False`` supports routers that must complete an authentication
        handshake (and therefore call ``websocket.accept()``) before the socket
        is published into the registry.
        """
        if accept:
            await websocket.accept()

        resolved_id = client_id or f"ws-{uuid.uuid4().hex[:12]}"

        async with self._lock:
            # Defensive: a reconnect reusing an id must not orphan the old record.
            existing = self._connections.get(resolved_id)
            if existing is not None and existing.websocket is not websocket:
                self._purge_locked(resolved_id)
            self._connections[resolved_id] = ClientConnection(
                resolved_id, websocket, metadata
            )

        logger.info(
            "WebSocket client connected: %s (total=%d)",
            resolved_id,
            len(self._connections),
        )
        return resolved_id

    async def disconnect(self, target: Union[str, Any]) -> None:
        """Deregister a client by ``client_id`` or by raw WebSocket object.

        Idempotent: disconnecting an unknown or already-removed client is a
        no-op, so ``finally: await manager.disconnect(...)`` is always safe.
        """
        async with self._lock:
            client_id = self._resolve_id_locked(target)
            if client_id is None:
                return
            self._purge_locked(client_id)

        logger.info(
            "WebSocket client disconnected and cleaned up: %s (total=%d)",
            client_id,
            len(self._connections),
        )

    # ------------------------------------------------------------------
    # Subscriptions
    # ------------------------------------------------------------------

    async def subscribe(self, client_id: str, asset_id: str) -> bool:
        """Bind a client to an asset telemetry channel."""
        async with self._lock:
            conn = self._connections.get(client_id)
            if conn is None:
                return False
            conn.subscriptions.add(asset_id)
            self._subscriptions.setdefault(asset_id, set()).add(client_id)

        logger.debug("Client %s subscribed to asset channel: %s", client_id, asset_id)
        return True

    async def unsubscribe(self, client_id: str, asset_id: str) -> bool:
        """Detach a client from an asset telemetry channel."""
        async with self._lock:
            conn = self._connections.get(client_id)
            if conn is not None:
                conn.subscriptions.discard(asset_id)

            subscribers = self._subscriptions.get(asset_id)
            if subscribers is None:
                return False
            subscribers.discard(client_id)
            if not subscribers:
                del self._subscriptions[asset_id]

        logger.debug("Client %s unsubscribed from asset channel: %s", client_id, asset_id)
        return True

    async def subscriptions_for(self, client_id: str) -> Set[str]:
        async with self._lock:
            conn = self._connections.get(client_id)
            return set(conn.subscriptions) if conn else set()

    async def subscriber_count(self, asset_id: str) -> int:
        async with self._lock:
            return len(self._subscriptions.get(asset_id, ()))

    # ------------------------------------------------------------------
    # Delivery
    # ------------------------------------------------------------------

    async def send_personal_message(
        self,
        message: Union[StreamEventEnvelope, Dict[str, Any], str],
        client_id: str,
    ) -> bool:
        """Deliver a single frame to one client. Prunes the client on failure."""
        async with self._lock:
            conn = self._connections.get(client_id)

        if conn is None:
            return False

        if await self._deliver(conn, message):
            return True

        await self.disconnect(client_id)
        return False

    async def broadcast_to_asset(
        self,
        asset_id: str,
        message: Union[StreamEventEnvelope, Dict[str, Any], str],
    ) -> int:
        """Fan a frame out to the subscribers of one asset channel.

        Returns the number of clients the frame was successfully written to.
        Stale sockets are pruned *after* the iteration completes, never during.
        """
        async with self._lock:
            subscriber_ids = list(self._subscriptions.get(asset_id, ()))
            targets = [
                self._connections[cid]
                for cid in subscriber_ids
                if cid in self._connections
            ]

        if not targets:
            return 0

        return await self._fan_out(targets, message)

    async def broadcast(
        self,
        message: Union[StreamEventEnvelope, Dict[str, Any], str],
    ) -> int:
        """Fan a frame out to every connected client (unfiltered).

        Retained for the Stage-2 contract and for system-wide notices.
        Prefer :meth:`broadcast_to_asset` for telemetry.
        """
        async with self._lock:
            targets = list(self._connections.values())

        if not targets:
            return 0

        return await self._fan_out(targets, message)

    async def disconnect_all(self, code: int = 1001) -> None:
        """Close every socket. Used by the application shutdown hook."""
        async with self._lock:
            targets = list(self._connections.values())
            self._connections.clear()
            self._subscriptions.clear()

        for conn in targets:
            try:
                await conn.websocket.close(code=code)
            except Exception:  # noqa: BLE001 - shutdown is best-effort
                pass

        if targets:
            logger.info("Closed %d WebSocket connection(s) on shutdown", len(targets))

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    async def _fan_out(
        self,
        targets: Iterable[ClientConnection],
        message: Union[StreamEventEnvelope, Dict[str, Any], str],
    ) -> int:
        delivered = 0
        stale: List[str] = []

        for conn in targets:
            if await self._deliver(conn, message):
                delivered += 1
            else:
                stale.append(conn.client_id)

        for client_id in stale:
            await self.disconnect(client_id)

        return delivered

    async def _deliver(
        self,
        conn: ClientConnection,
        message: Union[StreamEventEnvelope, Dict[str, Any], str],
    ) -> bool:
        """Write one frame with a bounded deadline. ``False`` marks it stale."""
        try:
            async with conn.write_lock:
                if isinstance(message, StreamEventEnvelope):
                    await asyncio.wait_for(
                        conn.websocket.send_text(message.to_wire()),
                        timeout=SEND_TIMEOUT_SECONDS,
                    )
                elif isinstance(message, str):
                    await asyncio.wait_for(
                        conn.websocket.send_text(message),
                        timeout=SEND_TIMEOUT_SECONDS,
                    )
                else:
                    await asyncio.wait_for(
                        conn.websocket.send_json(message),
                        timeout=SEND_TIMEOUT_SECONDS,
                    )
            return True
        except asyncio.CancelledError:
            raise
        except asyncio.TimeoutError:
            logger.warning(
                "Slow consumer exceeded %.1fs write deadline; pruning client %s",
                SEND_TIMEOUT_SECONDS,
                conn.client_id,
            )
            return False
        except Exception as exc:  # noqa: BLE001 - any write error means stale
            logger.warning("Dropping stale connection %s: %s", conn.client_id, exc)
            return False

    def _resolve_id_locked(self, target: Union[str, Any]) -> Optional[str]:
        """Map a client_id or a raw WebSocket to a registered client_id."""
        if isinstance(target, str):
            return target if target in self._connections else None
        for client_id, conn in self._connections.items():
            if conn.websocket is target:
                return client_id
        return None

    def _purge_locked(self, client_id: str) -> None:
        """Remove a client and all of its channel bindings. Caller holds the lock."""
        conn = self._connections.pop(client_id, None)
        asset_ids = set(conn.subscriptions) if conn else set(self._subscriptions)

        for asset_id in asset_ids:
            subscribers = self._subscriptions.get(asset_id)
            if subscribers is None:
                continue
            subscribers.discard(client_id)
            if not subscribers:
                del self._subscriptions[asset_id]


# Process-wide singleton used by the router, dispatcher and MQTT bridge.
connection_manager = ConnectionManager()

__all__ = [
    "SEND_TIMEOUT_SECONDS",
    "ClientConnection",
    "ConnectionManager",
    "connection_manager",
]
