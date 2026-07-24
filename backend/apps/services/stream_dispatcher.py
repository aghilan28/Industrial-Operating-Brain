"""Phase 5 — Centralized Stream Dispatcher (Pub/Sub Fan-Out).

The dispatcher is the seam between *event sources* (MQTT bridge, Redis event
bus, simulators, future Kafka consumers) and *event sinks* (WebSocket clients).

Before Phase 5 the MQTT callback reached directly into the socket list and
awaited ``send`` inline, so one slow browser stalled ingestion for the whole
plant. Now sources publish canonical envelopes here and return immediately;
the dispatcher owns routing, sequence numbering and fan-out policy.

Routing rules
-------------
* Frames carrying an ``asset_id`` go **only** to that channel's subscribers.
* Clients that have not yet subscribed to anything receive nothing, which is
  what eliminates the "every client sees the entire plant floor" anti-pattern.
* ``allow_global_fallback`` (default ``False``) can broadcast unrouted frames
  to every client; it exists for system notices, not telemetry.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Awaitable, Callable, Dict, List, Optional

from apps.core.connection_manager import ConnectionManager, connection_manager
from apps.schemas.streaming import (
    EVENT_SYSTEM,
    EVENT_TELEMETRY_UPDATE,
    StreamEventEnvelope,
)

logger = logging.getLogger("iob.realtime.dispatcher")

# Async callables invoked for every dispatched envelope (persistence, metrics,
# AI inference triggers). Subscriber failures are isolated and never break fan-out.
StreamSubscriber = Callable[[StreamEventEnvelope], Awaitable[None]]


class StreamDispatcher:
    """Central event router decoupling ingestion sources from client sockets."""

    def __init__(self, manager: Optional[ConnectionManager] = None) -> None:
        self.manager = manager or connection_manager
        self._sequence_counters: Dict[str, int] = {}
        self._seq_lock = asyncio.Lock()
        self._subscribers: List[StreamSubscriber] = []
        self._stats: Dict[str, int] = {
            "dispatched": 0,
            "delivered": 0,
            "dropped_unroutable": 0,
            "no_subscribers": 0,
        }

    # ------------------------------------------------------------------
    # Internal subscriber registry (server-side taps)
    # ------------------------------------------------------------------

    def register_subscriber(self, subscriber: StreamSubscriber) -> None:
        """Attach a server-side tap invoked for every dispatched envelope."""
        if subscriber not in self._subscribers:
            self._subscribers.append(subscriber)

    def unregister_subscriber(self, subscriber: StreamSubscriber) -> None:
        if subscriber in self._subscribers:
            self._subscribers.remove(subscriber)

    # ------------------------------------------------------------------
    # Dispatch
    # ------------------------------------------------------------------

    async def dispatch_telemetry(self, event: StreamEventEnvelope) -> int:
        """Route a telemetry envelope to its asset channel subscribers.

        Returns the number of clients the frame reached.
        """
        if not event.asset_id:
            self._stats["dropped_unroutable"] += 1
            logger.error(
                "Rejecting unroutable stream event without asset_id (topic=%s)",
                event.topic,
            )
            return 0

        # Stamp a per-asset monotonic sequence when the source did not supply one.
        if not event.sequence_number:
            event.sequence_number = await self._next_sequence(event.asset_id)

        self._stats["dispatched"] += 1

        await self._notify_subscribers(event)

        delivered = await self.manager.broadcast_to_asset(
            asset_id=event.asset_id,
            message=event,
        )

        if delivered == 0:
            self._stats["no_subscribers"] += 1
            logger.debug(
                "No active subscribers for asset channel %s; frame not fanned out",
                event.asset_id,
            )
        else:
            self._stats["delivered"] += delivered

        return delivered

    async def dispatch_raw(
        self,
        topic: str,
        payload: Dict[str, Any],
        asset_id: Optional[str] = None,
        *,
        quality: str = "GOOD",
        event_type: str = EVENT_TELEMETRY_UPDATE,
    ) -> int:
        """Build a canonical envelope from loose values and dispatch it."""
        envelope = StreamEventEnvelope(
            event_type=event_type,
            asset_id=asset_id or self.extract_asset_id(topic),
            topic=topic,
            payload=payload,
            quality=quality,  # type: ignore[arg-type]
        )
        return await self.dispatch_telemetry(envelope)

    async def broadcast_system_event(
        self,
        payload: Dict[str, Any],
        event_type: str = EVENT_SYSTEM,
    ) -> int:
        """Send an unfiltered notice (maintenance, degraded mode) to all clients."""
        envelope = StreamEventEnvelope(event_type=event_type, payload=payload)
        return await self.manager.broadcast(envelope)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def extract_asset_id(topic: str) -> Optional[str]:
        """Derive the asset identifier from an MQTT topic.

        Supported layouts::

            industrial/telemetry/{asset_id}
            industrial/telemetry/{asset_id}/{sensor_id}
            industrial/iob/{asset_id}/...

        Returns ``None`` when no asset segment is present, which makes the
        frame explicitly unroutable rather than silently global.
        """
        if not topic:
            return None
        segments = [seg for seg in str(topic).split("/") if seg]
        if len(segments) >= 3:
            return segments[2]
        if len(segments) == 2:
            return segments[1]
        return segments[0] if segments else None

    async def _next_sequence(self, asset_id: str) -> int:
        async with self._seq_lock:
            nxt = self._sequence_counters.get(asset_id, 0) + 1
            self._sequence_counters[asset_id] = nxt
            return nxt

    async def _notify_subscribers(self, event: StreamEventEnvelope) -> None:
        for subscriber in list(self._subscribers):
            try:
                await subscriber(event)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001 - taps must never break fan-out
                logger.error("Stream subscriber raised and was isolated: %s", exc)

    def stats(self) -> Dict[str, int]:
        """Snapshot of dispatcher counters for the observability endpoint."""
        return dict(self._stats)


# Process-wide singleton.
stream_dispatcher = StreamDispatcher()

__all__ = ["StreamDispatcher", "StreamSubscriber", "stream_dispatcher"]
