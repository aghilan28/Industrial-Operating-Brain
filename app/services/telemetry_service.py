"""
Phase 4 — Telemetry Service (Business Logic Layer).

Sits between the Router and the Repository. Owns:
  * Business validation (e.g. start_time strictly before end_time).
  * Existence checks translated into domain exceptions (ResourceNotFoundException).
  * Transformation of ORM rows into transport schemas:
      - latest reading  -> TelemetryPointResponse
      - history frames  -> TelemetrySeriesResponse (columnar timestamps + series)

Raises the platform's AppException subclasses; the global handler in
app/middleware/exception_handler.py renders them as ApiResponse envelopes.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Tuple

from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.repositories.telemetry_repository import TelemetryRepository
from app.schemas.telemetry import (
    TelemetryFilterParams,
    TelemetryPointResponse,
    TelemetrySeriesResponse,
)


def _iso_z(dt: datetime) -> str:
    """Normalize a datetime to an ISO-8601 Zulu string (e.g. 2026-07-24T09:00:00Z)."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class TelemetryService:
    """Business logic for processing and transforming telemetry streams."""

    def __init__(self, repository: TelemetryRepository):
        self.repository = repository

    async def get_latest_telemetry(self, asset_id: str) -> TelemetryPointResponse:
        """Return the most recent telemetry frame for an asset, or 404."""
        reading = await self.repository.get_latest_by_asset(asset_id)
        if not reading:
            raise ResourceNotFoundException("Telemetry for Asset", asset_id)

        return TelemetryPointResponse(
            asset_id=reading.asset_id,
            timestamp=_iso_z(reading.timestamp),
            metrics=dict(reading.metrics_json or {}),
        )

    async def get_telemetry_history(
        self,
        asset_id: str,
        filters: TelemetryFilterParams,
    ) -> Tuple[TelemetrySeriesResponse, int]:
        """Return the paginated time-series for an asset plus the total match count."""
        if (
            filters.start_time is not None
            and filters.end_time is not None
            and filters.start_time >= filters.end_time
        ):
            raise ValidationException(
                "start_time must be strictly earlier than end_time",
                details={
                    "start_time": filters.start_time.isoformat(),
                    "end_time": filters.end_time.isoformat(),
                },
            )

        readings, total_count = await self.repository.get_history(asset_id, filters)

        timestamps: list[str] = []
        series: dict[str, list[float]] = {}

        for r in readings:
            timestamps.append(_iso_z(r.timestamp))
            for channel, value in (r.metrics_json or {}).items():
                series.setdefault(channel, []).append(float(value))

        payload = TelemetrySeriesResponse(
            asset_id=asset_id,
            timestamps=timestamps,
            series=series,
        )
        return payload, total_count
