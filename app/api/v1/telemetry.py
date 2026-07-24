"""
Phase 4 — Telemetry Pipeline Router (REWRITTEN).

REPLACES the legacy handler that:
  * built inline string-concatenated SQL, and
  * invoked subprocess.run(["docker", "exec", ... "psql", ...]) per request.

NOW follows clean layered architecture with dependency injection:

    APIRouter (HTTP parsing + DI)
        -> TelemetryService (business rules + transforms)
            -> TelemetryRepository (SQLAlchemy async, parameterized, pooled)
                -> PostgreSQL / TimescaleDB  (sqlite+aiosqlite in dev)

Mounting:
  This router uses a RELATIVE prefix `/assets` and is registered into the
  aggregated `api_router` (mounted at settings.api_v1_prefix == "/api/v1"),
  yielding the public paths:
      GET /api/v1/assets/{asset_id}/telemetry/latest
      GET /api/v1/assets/{asset_id}/telemetry

  (The plan's literal path `app/routers/telemetry.py` maps to this repo's
   convention `app/api/v1/telemetry.py`.)

Fixes applied vs. the draft plan:
  * Query(order=...) uses `pattern=` (Pydantic v2) instead of removed `regex=`.
  * Timestamps normalized to ISO-8601 Zulu strings via the service.
  * Pagination envelope built from the validated filter (size <= 500, which the
    Phase-4-widened PaginatedResponse now accepts).
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.repositories.telemetry_repository import TelemetryRepository
from app.schemas.common import ApiResponse, PaginatedResponse
from app.schemas.telemetry import (
    TelemetryFilterParams,
    TelemetryPointResponse,
    TelemetrySeriesResponse,
)
from app.services.telemetry_service import TelemetryService

# Relative prefix: aggregated router is mounted at /api/v1.
router = APIRouter(prefix="/assets", tags=["Telemetry Pipeline"])


def get_telemetry_service(db: AsyncSession = Depends(get_db)) -> TelemetryService:
    """Compose the service with its repository over the request-scoped session."""
    repo = TelemetryRepository(db)
    return TelemetryService(repo)


@router.get(
    "/{asset_id}/telemetry/latest",
    response_model=ApiResponse[TelemetryPointResponse],
    status_code=status.HTTP_200_OK,
    summary="Get latest telemetry reading for asset",
)
async def get_latest_telemetry(
    asset_id: str,
    service: TelemetryService = Depends(get_telemetry_service),
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[TelemetryPointResponse]:
    """Return the most recent telemetry frame for the given asset."""
    data = await service.get_latest_telemetry(asset_id)
    return ApiResponse(data=data, message="Latest telemetry reading retrieved.")


@router.get(
    "/{asset_id}/telemetry",
    response_model=ApiResponse[PaginatedResponse[TelemetrySeriesResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get time-series telemetry history for asset",
)
async def get_telemetry_history(
    asset_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(50, ge=1, le=500, description="Page size (max 500)"),
    start_time: Optional[datetime] = Query(None, description="ISO-8601 start bound"),
    end_time: Optional[datetime] = Query(None, description="ISO-8601 end bound"),
    sensor_channel: Optional[str] = Query(None, description="Filter specific sensor channel"),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order by timestamp"),
    service: TelemetryService = Depends(get_telemetry_service),
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[PaginatedResponse[TelemetrySeriesResponse]]:
    """Return the paginated, filtered time-series history for the given asset."""
    filters = TelemetryFilterParams(
        page=page,
        size=size,
        start_time=start_time,
        end_time=end_time,
        sensor_channel=sensor_channel,
        order=order,
    )

    series_data, total_count = await service.get_telemetry_history(asset_id, filters)

    paginated_payload = PaginatedResponse[TelemetrySeriesResponse](
        items=[series_data],
        total=total_count,
        page=page,
        size=size,
        pages=(total_count + size - 1) // size if total_count > 0 else 0,
    )

    return ApiResponse(
        data=paginated_payload,
        message="Historical telemetry time-series retrieved.",
    )
