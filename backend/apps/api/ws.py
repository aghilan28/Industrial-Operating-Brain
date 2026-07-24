"""Phase 5 — Authenticated Real-Time Telemetry WebSocket Router.

Fixes applied in this rewrite
-----------------------------
* **Route registration.** The endpoint is now exposed through a real
  ``APIRouter`` that ``apps.main`` includes, instead of living as an orphan
  coroutine no ASGI app ever mounted.
* **Heartbeat engine.** Reads are bounded by ``asyncio.wait_for``. An idle
  socket triggers a server ping; a peer that misses ``MAX_MISSED_HEARTBEATS``
  consecutive pings is closed and reaped, so half-open TCP sessions can no
  longer accumulate in memory.
* **Channel subscriptions.** Clients declare the assets they are viewing, so
  the server stops shipping the whole plant floor to every browser tab.
* **Guaranteed cleanup.** Every exit path funnels through ``finally`` into
  ``connection_manager.disconnect`` — including cancellation at shutdown.

Two endpoints are published, both backed by the same manager:

``/api/v1/stream?token=<jwt>``
    Legacy transport consumed by the shipped frontend client. Frame shape and
    the ``{"type": "pong"}`` heartbeat reply are preserved byte-for-byte.

``/api/v1/ws/telemetry/{client_id}?token=<jwt>``
    Phase 5 transport carrying versioned :class:`StreamEventEnvelope` frames.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from apps.core.connection_manager import connection_manager
from apps.schemas.streaming import (
    EVENT_ACK,
    EVENT_ERROR,
    EVENT_PING,
    EVENT_PONG,
    StreamControlCommand,
    StreamEventEnvelope,
)

logger = logging.getLogger("iob.realtime.router")

router = APIRouter(tags=["Real-Time Telemetry Stream"])

# Seconds of client silence before the server probes with a ping frame.
HEARTBEAT_INTERVAL_SECONDS = 15
# Consecutive unanswered pings tolerated before the socket is reaped.
MAX_MISSED_HEARTBEATS = 2

# Policy close codes.
WS_CLOSE_UNAUTHORIZED = 4001
WS_CLOSE_HEARTBEAT_TIMEOUT = 4008

# Legacy alias: pre-Phase-5 modules and tests import ``manager`` from here.
manager = connection_manager


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------


def _authenticate(token: Optional[str]) -> Optional[Dict[str, Any]]:
    """Validate a stream JWT.

    Returns the decoded claims, or ``None`` when the token is absent, malformed
    or expired. Never raises — WebSocket auth failures must close the socket
    with a policy code rather than surface an HTTP exception.
    """
    if not token:
        return None
    try:
        from apps.core.security import decode_access_token

        return decode_access_token(token)
    except Exception as exc:  # noqa: BLE001 - any decode failure is a rejection
        logger.debug("Stream token rejected: %s", exc)
        return None


def _token_from_socket(websocket: Any) -> Optional[str]:
    """Recover a token from query params or the Authorization header."""
    try:
        params = getattr(websocket, "query_params", None)
        if params:
            candidate = params.get("token")
            if isinstance(candidate, str) and candidate:
                return candidate
    except Exception:  # noqa: BLE001
        pass

    try:
        headers = getattr(websocket, "headers", None)
        if headers:
            auth = headers.get("authorization") or headers.get("Authorization")
            if isinstance(auth, str) and auth.lower().startswith("bearer "):
                return auth.split(" ", 1)[1].strip()
    except Exception:  # noqa: BLE001
        pass

    return None


async def _reject(websocket: Any, code: int, reason: str) -> None:
    """Close a socket before the handshake completes. Never calls ``accept``."""
    logger.warning("Rejecting WebSocket connection (%d): %s", code, reason)
    try:
        await websocket.close(code=code, reason=reason)
    except TypeError:
        # Doubles whose close() does not accept a reason kwarg.
        await websocket.close(code=code)
    except Exception as exc:  # noqa: BLE001
        logger.debug("Socket already closed during rejection: %s", exc)


# ---------------------------------------------------------------------------
# Legacy transport — /api/v1/stream
# ---------------------------------------------------------------------------


@router.websocket("/stream")
async def websocket_telemetry_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
) -> None:
    """Authenticated telemetry socket (legacy frame contract preserved).

    Heartbeat contract, unchanged from Stage 2 so deployed clients keep working:

    * ``"ping"``                        -> ``{"type": "pong"}``
    * ``{"type": "ping", "ts": <int>}`` -> ``{"type": "pong", "ts": <int>}``

    Phase 5 additionally accepts ``{"action": "subscribe", "asset_id": "..."}``
    to opt into filtered per-asset fan-out.
    """
    resolved_token = token if token is not None else _token_from_socket(websocket)
    claims = _authenticate(resolved_token)

    if claims is None:
        await _reject(websocket, WS_CLOSE_UNAUTHORIZED, "Invalid or missing token")
        return

    client_id = await connection_manager.connect(
        websocket,
        client_id=None,
        accept=True,
        metadata={
            "user_id": claims.get("sub"),
            "role": claims.get("role"),
            "transport": "legacy",
        },
    )

    missed_heartbeats = 0

    try:
        while True:
            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_INTERVAL_SECONDS,
                )
            except asyncio.TimeoutError:
                missed_heartbeats += 1
                if missed_heartbeats > MAX_MISSED_HEARTBEATS:
                    logger.info(
                        "Client %s missed %d heartbeats; reaping socket",
                        client_id,
                        missed_heartbeats,
                    )
                    await _safe_close(websocket, WS_CLOSE_HEARTBEAT_TIMEOUT)
                    break
                # Probe liveness. A dead peer surfaces as a write error here.
                if not await connection_manager.send_personal_message(
                    {"type": "ping"}, client_id
                ):
                    break
                continue

            missed_heartbeats = 0
            command = StreamControlCommand.parse_client_frame(raw)

            if command is None:
                logger.debug("Ignoring unparseable control frame from %s", client_id)
                continue

            if command.action == "ping":
                pong: Dict[str, Any] = {"type": "pong"}
                if command.ts is not None:
                    pong["ts"] = command.ts
                await connection_manager.send_personal_message(pong, client_id)

            elif command.action == "pong":
                # Client answered our probe; liveness already reset above.
                continue

            elif command.action == "subscribe" and command.asset_id:
                await connection_manager.subscribe(client_id, command.asset_id)
                await connection_manager.send_personal_message(
                    {
                        "type": "subscribed",
                        "asset_id": command.asset_id,
                    },
                    client_id,
                )

            elif command.action == "unsubscribe" and command.asset_id:
                await connection_manager.unsubscribe(client_id, command.asset_id)
                await connection_manager.send_personal_message(
                    {
                        "type": "unsubscribed",
                        "asset_id": command.asset_id,
                    },
                    client_id,
                )

    except WebSocketDisconnect:
        logger.info("Client %s disconnected normally", client_id)
    except asyncio.CancelledError:
        logger.info("Client %s cancelled during shutdown", client_id)
        raise
    except Exception as exc:  # noqa: BLE001 - never let one socket kill the worker
        logger.error("Unexpected error on socket %s: %s", client_id, exc)
    finally:
        await connection_manager.disconnect(client_id)


# ---------------------------------------------------------------------------
# Phase 5 transport — /api/v1/ws/telemetry/{client_id}
# ---------------------------------------------------------------------------


@router.websocket("/ws/telemetry/{client_id}")
async def telemetry_envelope_endpoint(
    websocket: WebSocket,
    client_id: str,
    token: Optional[str] = Query(default=None),
) -> None:
    """Versioned envelope transport with explicit asset channel subscriptions."""
    resolved_token = token if token is not None else _token_from_socket(websocket)
    claims = _authenticate(resolved_token)

    if claims is None:
        await _reject(websocket, WS_CLOSE_UNAUTHORIZED, "Invalid or missing token")
        return

    registered_id = await connection_manager.connect(
        websocket,
        client_id=client_id,
        accept=True,
        metadata={
            "user_id": claims.get("sub"),
            "role": claims.get("role"),
            "transport": "envelope",
        },
    )

    # Envelope clients receive an explicit handshake acknowledgement.
    await connection_manager.send_personal_message(
        StreamEventEnvelope(
            event_type=EVENT_ACK,
            payload={
                "status": "connected",
                "client_id": registered_id,
                "heartbeat_interval_seconds": HEARTBEAT_INTERVAL_SECONDS,
            },
        ),
        registered_id,
    )

    missed_heartbeats = 0

    try:
        while True:
            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=HEARTBEAT_INTERVAL_SECONDS,
                )
            except asyncio.TimeoutError:
                missed_heartbeats += 1
                if missed_heartbeats > MAX_MISSED_HEARTBEATS:
                    await _safe_close(websocket, WS_CLOSE_HEARTBEAT_TIMEOUT)
                    break
                if not await connection_manager.send_personal_message(
                    StreamEventEnvelope(event_type=EVENT_PING), registered_id
                ):
                    break
                continue

            missed_heartbeats = 0
            command = StreamControlCommand.parse_client_frame(raw)

            if command is None:
                await connection_manager.send_personal_message(
                    StreamEventEnvelope(
                        event_type=EVENT_ERROR,
                        quality="BAD",
                        payload={"reason": "malformed_control_frame"},
                    ),
                    registered_id,
                )
                continue

            if command.action == "ping":
                await connection_manager.send_personal_message(
                    StreamEventEnvelope(
                        event_type=EVENT_PONG,
                        payload={"status": "alive", "ts": command.ts},
                    ),
                    registered_id,
                )

            elif command.action == "subscribe" and command.asset_id:
                await connection_manager.subscribe(registered_id, command.asset_id)
                await connection_manager.send_personal_message(
                    StreamEventEnvelope(
                        event_type=EVENT_ACK,
                        asset_id=command.asset_id,
                        payload={"status": "subscribed", "asset_id": command.asset_id},
                    ),
                    registered_id,
                )

            elif command.action == "unsubscribe" and command.asset_id:
                await connection_manager.unsubscribe(registered_id, command.asset_id)
                await connection_manager.send_personal_message(
                    StreamEventEnvelope(
                        event_type=EVENT_ACK,
                        asset_id=command.asset_id,
                        payload={
                            "status": "unsubscribed",
                            "asset_id": command.asset_id,
                        },
                    ),
                    registered_id,
                )

    except WebSocketDisconnect:
        logger.info("Envelope client %s disconnected normally", registered_id)
    except asyncio.CancelledError:
        logger.info("Envelope client %s cancelled during shutdown", registered_id)
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected error on envelope socket %s: %s", registered_id, exc)
    finally:
        await connection_manager.disconnect(registered_id)


async def _safe_close(websocket: Any, code: int) -> None:
    try:
        await websocket.close(code=code)
    except Exception:  # noqa: BLE001 - peer may already be gone
        pass


__all__ = [
    "HEARTBEAT_INTERVAL_SECONDS",
    "MAX_MISSED_HEARTBEATS",
    "WS_CLOSE_UNAUTHORIZED",
    "manager",
    "router",
    "telemetry_envelope_endpoint",
    "websocket_telemetry_endpoint",
]
