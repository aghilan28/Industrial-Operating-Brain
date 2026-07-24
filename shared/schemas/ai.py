"""Canonical AI Integration Schema — Cross-Track Contract.

Standardised request/response envelopes with correlation tracing, model
versioning, and latency tracking for all AI-platform interactions
(prediction, GraphRAG, LLM chat).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


# ======================================================================
# Request envelopes
# ======================================================================


class AIRequestEnvelope(BaseModel):
    """Universal request envelope for all AI-platform endpoints.

    Every outgoing AI call wraps its domain-specific payload inside this
    envelope so the platform receives correlation identifiers alongside
    the business data.
    """

    request_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique request identifier (server-generated if omitted).",
    )
    correlation_id: str = Field(
        ..., description="Distributed tracing correlation string."
    )
    asset_id: Optional[str] = Field(
        None, description="Target asset identifier (if applicable)."
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Domain-specific request payload.",
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="ISO-8601 timestamp of envelope creation.",
    )


# ======================================================================
# Response envelopes
# ======================================================================


class AIResponseEnvelope(BaseModel):
    """Universal response envelope wrapping all AI-platform results.

    Guarantees that every caller — whether the prediction succeeded or the
    service was degraded — receives the same structural contract so API
    clients never have to handle raw ``500`` or unstructured dicts.
    """

    success: bool = Field(
        ..., description="Whether the AI operation completed successfully."
    )
    message: str = Field(
        default="",
        description="Human-readable status or error description.",
    )
    model_name: str = Field(
        default="unknown",
        description="Name of the model that produced the result.",
    )
    model_version: str = Field(
        default="0.0.0",
        description="Semantic version of the model.",
    )
    latency_ms: float = Field(
        default=0.0,
        ge=0.0,
        description="End-to-end request latency in milliseconds.",
    )
    correlation_id: str = Field(
        default="",
        description="Mirrors the correlation ID from the request for tracing.",
    )
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Domain-specific response payload.",
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="ISO-8601 timestamp of response creation.",
    )


# ======================================================================
# Backward-compatible aliases for existing consumers
# ======================================================================

class AIInferenceRequest(AIRequestEnvelope):
    """Legacy alias — maintained for backward compatibility with existing
    import paths.  New code should import ``AIRequestEnvelope`` directly."""


class AIInferenceResponse(AIResponseEnvelope):
    """Legacy alias — maintained for backward compatibility with existing
    import paths.  New code should import ``AIResponseEnvelope`` directly."""


__all__ = [
    "AIRequestEnvelope",
    "AIResponseEnvelope",
    "AIInferenceRequest",
    "AIInferenceResponse",
]
