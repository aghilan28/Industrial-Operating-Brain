"""Phase 5 — Async, Non-Blocking MQTT Ingestion Bridge.

Replaces the Phase-4 stub whose ``start()``/``stop()`` were empty coroutines and
whose predecessor ran blocking synchronous callbacks directly on the event loop
while writing to sockets inline.

What this bridge guarantees
---------------------------
* **Never blocks the event loop.** The broker callback performs only cheap,
  synchronous parsing, then hands the frame off via ``create_task``. Socket
  fan-out is owned by the :class:`StreamDispatcher`.
* **Survives broker outages.** ``start()`` runs a supervised reconnect loop
  with exponential backoff and jitter (1s -> 2s -> 4s ... capped at 30s),
  so a Mosquitto/EMQX restart no longer requires a container restart.
* **Never dies on a bad payload.** Malformed JSON is logged and dropped; the
  ingestion loop keeps running.
* **Retains telemetry when Redis is down.** Frames are enqueued on the local
  ``sensor_queue`` *before* the Redis publish is attempted, so an event-bus
  outage cannot lose already-ingested data.

Contract preservation
---------------------
``sensor_queue``, ``MQTTBridge``, the synchronous ``on_message(client, topic,
payload, qos, properties)`` and ``on_connect(client, flags, rc, properties)``
callbacks, and the ``{"topic": ..., "payload": ...}`` queue record shape are all
retained exactly as the Stage-2 / Phase-5 test suites expect.
"""

from __future__ import annotations

import asyncio
import importlib
import json
import logging
import random
from typing import Any, Dict, Optional

from apps.schemas.streaming import EVENT_TELEMETRY_UPDATE, StreamEventEnvelope
from apps.services.stream_dispatcher import StreamDispatcher, stream_dispatcher

logger = logging.getLogger("iob.realtime.mqtt")

# Process-wide ingestion buffer consumed by downstream workers/persistence.
sensor_queue: asyncio.Queue = asyncio.Queue()

DEFAULT_TOPIC_FILTER = "industrial/telemetry/#"
INITIAL_BACKOFF_SECONDS = 1.0
MAX_BACKOFF_SECONDS = 30.0
MAX_QUEUE_DEPTH = 10_000


class MQTTBridge:
    """Async MQTT consumer bridging the industrial broker into the stream layer."""

    def __init__(
        self,
        broker_host: Optional[str] = None,
        broker_port: Optional[int] = None,
        *,
        topic_filter: str = DEFAULT_TOPIC_FILTER,
        dispatcher: Optional[StreamDispatcher] = None,
        client_id: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
    ) -> None:
        host, port, resolved_client_id, resolved_user, resolved_pass = _load_broker_defaults()

        self.broker_host = broker_host or host
        self.broker_port = int(broker_port or port)
        self.topic_filter = topic_filter
        self.dispatcher = dispatcher or stream_dispatcher
        self.client_id = client_id or resolved_client_id
        self.username = username if username is not None else resolved_user
        self.password = password if password is not None else resolved_pass

        self._running = False
        self._client: Any = None
        self._task: Optional[asyncio.Task] = None
        self._backoff = INITIAL_BACKOFF_SECONDS
        self.messages_ingested = 0
        self.messages_rejected = 0

    # ------------------------------------------------------------------
    # Broker callbacks (synchronous, must stay cheap)
    # ------------------------------------------------------------------

    def on_connect(self, client: Any, flags: Any = None, rc: Any = None, properties: Any = None) -> None:
        """Subscribe to the telemetry topic filter once the broker session is up."""
        logger.info(
            "MQTT connected to %s:%s — subscribing to %s",
            self.broker_host,
            self.broker_port,
            self.topic_filter,
        )
        self._backoff = INITIAL_BACKOFF_SECONDS
        if client is not None:
            client.subscribe(self.topic_filter, qos=1)

    def on_disconnect(self, client: Any = None, packet: Any = None, exc: Any = None) -> None:
        logger.warning("MQTT broker disconnected; supervisor will reconnect")

    def on_message(
        self,
        client: Any,
        topic: Any,
        payload: Any,
        qos: Any = 0,
        properties: Any = None,
    ) -> Any:
        """Handle one inbound broker frame.

        Runs synchronously on the client's callback path, so it only decodes and
        validates, then defers all I/O (Redis publish, socket fan-out) to a task.
        """
        topic_str = str(topic)

        parsed = self._decode_payload(payload)
        if parsed is None:
            self.messages_rejected += 1
            logger.error("Dropping malformed MQTT payload on topic %s", topic_str)
            return None

        record: Dict[str, Any] = {"topic": topic_str, "payload": parsed}

        # Enqueue first: ingestion durability must not depend on Redis health.
        try:
            sensor_queue.put_nowait(record)
            self.messages_ingested += 1
        except asyncio.QueueFull:
            self.messages_rejected += 1
            logger.error("Ingestion buffer saturated; dropping frame from %s", topic_str)
            return None

        # Defer outbound I/O so the broker callback never blocks.
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            # No loop (pure synchronous unit test): queueing alone is sufficient.
            return None

        return asyncio.ensure_future(self._forward(topic_str, parsed))

    # ------------------------------------------------------------------
    # Outbound propagation
    # ------------------------------------------------------------------

    async def _forward(self, topic: str, payload: Dict[str, Any]) -> None:
        """Publish to the shared event bus, then fan out to subscribed sockets."""
        await self._publish_to_event_bus({"topic": topic, "payload": payload})
        await self._dispatch(topic, payload)

    async def _publish_to_event_bus(self, event: Dict[str, Any]) -> None:
        """Best-effort Redis publish. A bus outage must not drop telemetry."""
        try:
            event_bus = importlib.import_module("shared.event_bus")
        except Exception as exc:  # noqa: BLE001 - bus is optional infrastructure
            logger.debug("Shared event bus unavailable: %s", exc)
            return

        publish = getattr(event_bus, "publish_telemetry", None)
        if publish is None:
            return

        try:
            await publish(event)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001 - retained in sensor_queue regardless
            logger.warning(
                "Event bus publish failed (%s); telemetry retained in local queue",
                exc,
            )

    async def _dispatch(self, topic: str, payload: Dict[str, Any]) -> None:
        """Route the frame to asset-channel subscribers through the dispatcher."""
        try:
            asset_id = self.dispatcher.extract_asset_id(topic)
            envelope = StreamEventEnvelope(
                event_type=EVENT_TELEMETRY_UPDATE,
                asset_id=asset_id,
                topic=topic,
                payload=payload,
                quality=_quality_of(payload),
                sequence_number=_sequence_of(payload),
            )
            await self.dispatcher.dispatch_telemetry(envelope)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001 - one bad frame must not kill ingestion
            logger.error("Failed to dispatch telemetry frame from %s: %s", topic, exc)

    # ------------------------------------------------------------------
    # Supervised lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Launch the supervised ingestion loop as a background task."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_supervised(), name="mqtt-bridge")
        logger.info("MQTT ingestion bridge started")

    async def _run_supervised(self) -> None:
        """Connect, consume, and reconnect with exponential backoff forever."""
        while self._running:
            try:
                await self._connect_and_consume()
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001 - broker errors are expected
                if not self._running:
                    break
                delay = self._next_backoff()
                logger.error(
                    "MQTT connection error (%s). Reconnecting in %.1fs...", exc, delay
                )
                try:
                    await asyncio.sleep(delay)
                except asyncio.CancelledError:
                    raise

    async def _connect_and_consume(self) -> None:
        """Establish a broker session and stay connected until it drops."""
        try:
            gmqtt = importlib.import_module("gmqtt")
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"MQTT client library unavailable: {exc}") from exc

        client = gmqtt.Client(self.client_id)
        client.on_connect = self.on_connect
        client.on_message = self.on_message
        client.on_disconnect = self.on_disconnect

        if self.username:
            client.set_auth_credentials(self.username, self.password or "")

        self._client = client

        logger.info(
            "Connecting to MQTT broker at %s:%s...", self.broker_host, self.broker_port
        )
        await client.connect(self.broker_host, self.broker_port)
        self._backoff = INITIAL_BACKOFF_SECONDS

        try:
            # Hold the session open; callbacks drive ingestion.
            while self._running:
                await asyncio.sleep(1.0)
        finally:
            try:
                await client.disconnect()
            except Exception:  # noqa: BLE001 - shutdown is best-effort
                pass
            self._client = None

    def _next_backoff(self) -> float:
        """Exponential backoff with jitter, capped at ``MAX_BACKOFF_SECONDS``."""
        delay = min(self._backoff, MAX_BACKOFF_SECONDS)
        self._backoff = min(self._backoff * 2, MAX_BACKOFF_SECONDS)
        return delay + random.uniform(0, 0.3)

    async def stop(self) -> None:
        """Stop the supervisor and close the broker session."""
        self._running = False

        client = self._client
        if client is not None:
            try:
                await client.disconnect()
            except Exception:  # noqa: BLE001
                pass
            self._client = None

        task = self._task
        if task is not None and not task.done():
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
        self._task = None

        logger.info("MQTT ingestion bridge stopped")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _decode_payload(payload: Any) -> Optional[Dict[str, Any]]:
        """Decode an MQTT payload into a JSON object, or ``None`` if invalid."""
        try:
            if isinstance(payload, (bytes, bytearray)):
                text = payload.decode("utf-8")
            elif isinstance(payload, str):
                text = payload
            elif isinstance(payload, dict):
                return payload
            else:
                return None

            parsed = json.loads(text)
        except (UnicodeDecodeError, ValueError, TypeError):
            return None

        return parsed if isinstance(parsed, dict) else None


def _quality_of(payload: Dict[str, Any]) -> str:
    """Extract an OPC-UA style quality flag, defaulting to ``GOOD``."""
    raw = payload.get("quality")
    if isinstance(raw, str) and raw.upper() in ("GOOD", "BAD", "UNCERTAIN"):
        return raw.upper()
    return "GOOD"


def _sequence_of(payload: Dict[str, Any]) -> int:
    """Extract a source-provided sequence number, defaulting to ``0``."""
    for key in ("seq", "sequence", "sequence_number"):
        value = payload.get(key)
        if isinstance(value, int) and value >= 0:
            return value
    return 0


def _load_broker_defaults() -> tuple:
    """Read broker coordinates from settings, tolerating a missing config."""
    try:
        from apps.core.config import settings

        return (
            getattr(settings, "MQTT_BROKER_HOST", "localhost"),
            getattr(settings, "MQTT_BROKER_PORT", 1883),
            getattr(settings, "MQTT_CLIENT_ID", "iob-backend"),
            getattr(settings, "MQTT_USERNAME", None),
            getattr(settings, "MQTT_PASSWORD", None),
        )
    except Exception:  # noqa: BLE001 - settings must never break import
        return ("localhost", 1883, "iob-backend", None, None)


# Shared instance used by the FastAPI lifespan hook.
mqtt_bridge = MQTTBridge()

# Phase 5 naming alias.
AsyncMQTTBridge = MQTTBridge

__all__ = [
    "AsyncMQTTBridge",
    "DEFAULT_TOPIC_FILTER",
    "MQTTBridge",
    "mqtt_bridge",
    "sensor_queue",
]
