"""Shared cross-track Pydantic schemas — Phase 0 Canonical Contract."""

from .asset import AssetShallowResponse, AssetResponse
from .telemetry import TelemetryPayload, TelemetryResponse
from .ai import (
    AIRequestEnvelope,
    AIResponseEnvelope,
    AIInferenceRequest,
    AIInferenceResponse,
)
from .alerts import AlertResponse, AlertShallowResponse

__all__ = [
    "AssetShallowResponse",
    "AssetResponse",
    "TelemetryPayload",
    "TelemetryResponse",
    "AIRequestEnvelope",
    "AIResponseEnvelope",
    "AIInferenceRequest",
    "AIInferenceResponse",
    "AlertResponse",
    "AlertShallowResponse",
]
