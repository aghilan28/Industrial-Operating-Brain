"""Phase 5 — Canonical Real-Time Streaming Schema Layer.

This module is the single source of truth for every frame that crosses the
WebSocket boundary. Prior to Phase 5, raw MQTT payloads were forwarded to
browsers as arbitrary, unversioned JSON dictionaries with no timestamp,
no sequence number and no quality flag.

Two envelopes are defined:

``StreamEventEnvelope``
    Server -> Client. Every outbound frame (telemetry, ping, pong, ack,
    error, system notice) is serialized from this model.

``StreamControlCommand``
    Client -> Server. Subscription management and client-initiated
    heartbeats.

Backward compatibility
----------------------
The legacy frontend transport (``frontend/src/services/websocket``) consumes
frames shaped as ``{"topic": str, "payload": dict}``. The envelope therefore
carries an optional ``topic`` field and exposes :meth:`to_legacy_frame` so the
existing ``TelemetryProvider`` / ``useTelemetry`` surface keeps working while
new code migrates to the versioned envelope.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

STREAM_SCHEMA_VERSION = "v1"

QualityFlag = Literal["GOOD", "BAD", "UNCERTAIN"]

# Server -> Client event types
EVENT_TELEMETRY_UPDATE = "telemetry_update"
EVENT_PING = "ping"
EVENT_PONG = "pong"
EVENT_ACK = "ack"
EVENT_ERROR = "error"
EVENT_SYSTEM = "system"


def utc_now_iso() -> str:
    """Return an ISO-8601 UTC timestamp with an explicit ``Z`` designator."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# --------------------------------------------------------------------------
# Server -> Client
# --------------------------------------------------------------------------


class StreamEventEnvelope(BaseModel):
    """Standardized, versioned server-to-client stream frame."""

    model_config = ConfigDict(extra="ignore")

    version: str = Field(
        default=STREAM_SCHEMA_VERSION,
        description="Stream schema version, bumped on breaking frame changes.",
    )
    event_type: str = Field(
        ...,
        description="Frame discriminator, e.g. telemetry_update, ping, pong, ack, error.",
    )
    timestamp: str = Field(
        default_factory=utc_now_iso,
        description="ISO-8601 UTC timestamp of frame emission.",
    )
    asset_id: Optional[str] = Field(
        default=None,
        description="Target asset / channel identifier used for fan-out routing.",
    )
    topic: Optional[str] = Field(
        default=None,
        description="Originating MQTT topic. Retained for legacy frontend consumers.",
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Event body. For telemetry this is the parsed sensor document.",
    )
    quality: QualityFlag = Field(
        default="GOOD",
        description="OPC-UA style data quality flag for the carried measurement.",
    )
    sequence_number: int = Field(
        default=0,
        ge=0,
        description="Per-asset monotonic counter used by clients to detect gaps.",
    )

    def to_legacy_frame(self) -> Dict[str, Any]:
        """Project the envelope into the pre-Phase-5 ``{topic, payload}`` shape."""
        return {
            "topic": self.topic or self.asset_id or self.event_type,
            "payload": self.payload,
        }

    def to_wire(self) -> str:
        """Serialize the envelope to the exact JSON string sent over the socket."""
        return self.model_dump_json()


# --------------------------------------------------------------------------
# Client -> Server
# --------------------------------------------------------------------------


class StreamControlCommand(BaseModel):
    """Client-issued control frame for subscriptions and heartbeats.

    Accepts both the Phase 5 ``action`` key and the legacy ``type`` key so the
    shipped frontend heartbeat (``{"type": "ping"}``) keeps working unchanged.
    """

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    action: Literal["subscribe", "unsubscribe", "ping", "pong"] = Field(
        ...,
        validation_alias="action",
        description="Requested control operation.",
    )
    asset_id: Optional[str] = Field(
        default=None,
        description="Asset channel targeted by a subscribe/unsubscribe action.",
    )
    ts: Optional[int] = Field(
        default=None,
        description="Opaque client heartbeat correlation value, echoed in the pong.",
    )

    @classmethod
    def parse_client_frame(cls, raw: str) -> Optional["StreamControlCommand"]:
        """Best-effort parse of an inbound client frame.

        Tolerates the three shapes emitted by deployed clients:

        * bare string heartbeats  -> ``ping``
        * legacy JSON heartbeats  -> ``{"type": "ping", "ts": 123}``
        * Phase 5 control frames  -> ``{"action": "subscribe", "asset_id": "A"}``

        Returns ``None`` when the frame is unparseable so the caller can reply
        with a structured error instead of tearing down the socket.
        """
        import json

        text = (raw or "").strip()
        if not text:
            return None

        # Bare textual heartbeat, e.g. the literal string "ping".
        if not text.startswith("{"):
            lowered = text.lower()
            if lowered in ("ping", "pong"):
                return cls(action=lowered)  # type: ignore[arg-type]
            return None

        try:
            data = json.loads(text)
        except (ValueError, TypeError):
            return None

        if not isinstance(data, dict):
            return None

        # Normalize the legacy ``type`` discriminator onto ``action``.
        action = data.get("action") or data.get("type")
        if not isinstance(action, str):
            return None

        ts = data.get("ts")
        return cls.model_validate(
            {
                "action": action.lower(),
                "asset_id": data.get("asset_id") or data.get("assetId"),
                "ts": ts if isinstance(ts, int) else None,
            }
        )


__all__ = [
    "EVENT_ACK",
    "EVENT_ERROR",
    "EVENT_PING",
    "EVENT_PONG",
    "EVENT_SYSTEM",
    "EVENT_TELEMETRY_UPDATE",
    "STREAM_SCHEMA_VERSION",
    "QualityFlag",
    "StreamControlCommand",
    "StreamEventEnvelope",
    "utc_now_iso",
]
