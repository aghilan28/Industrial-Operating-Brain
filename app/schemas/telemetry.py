"""
Phase 4 — Strongly-typed Pydantic v2 contracts for the Telemetry Pipeline.

These models power:
  * Query-parameter validation (TelemetryFilterParams) with ISO-8601 time
    bounds, page sizing constraints and asc/desc ordering.
  * Latest-reading response (TelemetryPointResponse).
  * Time-series history response (TelemetrySeriesResponse).

Note:
  The original plan imported `dict` from `typing`, which is invalid in Python
  (dict is a builtin, not a typing export). This is corrected here — we rely on
  PEP 585 builtin generics (dict[...], list[...]) enabled for all annotations
  via `from __future__ import annotations`.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TelemetryFilterParams(BaseModel):
    """Validated query filters for time-series telemetry retrieval."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    size: int = Field(default=50, ge=1, le=500, description="Page size (max 500 points)")
    start_time: Optional[datetime] = Field(default=None, description="ISO-8601 inclusive lower bound")
    end_time: Optional[datetime] = Field(default=None, description="ISO-8601 inclusive upper bound")
    sensor_channel: Optional[str] = Field(default=None, description="Filter a specific sensor channel key")
    order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order by timestamp")


class TelemetryPointResponse(BaseModel):
    """Single most-recent metric frame for an asset."""

    asset_id: str
    timestamp: str = Field(..., description="ISO-8601 Zulu timestamp of the reading")
    metrics: dict[str, float] = Field(default_factory=dict, description="channel -> value map")


class TelemetrySeriesResponse(BaseModel):
    """Columnar time-series payload (aligned arrays for chart rendering)."""

    asset_id: str
    timestamps: list[str] = Field(default_factory=list, description="ISO-8601 Zulu timestamps, ordered")
    series: dict[str, list[float]] = Field(
        default_factory=dict,
        description="channel -> list of values aligned to `timestamps`",
    )
