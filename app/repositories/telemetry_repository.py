"""
Phase 4 — Telemetry Repository (Pure Data-Access Object).

All database interaction is expressed through the SQLAlchemy 2.0 async query
builder with bound parameters. NO string-concatenated SQL, NO subprocess, NO
shell execution. Connection pooling is inherited from the shared AsyncEngine
(app/core/database.py).

Responsibilities:
  * get_latest_by_asset() -- most recent frame for an asset (indexed lookup).
  * get_history()         -- filtered, ordered, paginated time-series frames
                             plus the total match count for pagination metadata.
"""
from __future__ import annotations

from typing import Optional, Sequence, Tuple

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.telemetry import TelemetryReading
from app.schemas.telemetry import TelemetryFilterParams


class TelemetryRepository:
    """Pure Data Access Object for Industrial Telemetry entity operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_latest_by_asset(self, asset_id: str) -> Optional[TelemetryReading]:
        """Fetch the most recent sensor reading for a specific industrial asset."""
        stmt = (
            select(TelemetryReading)
            .where(TelemetryReading.asset_id == asset_id)
            .order_by(desc(TelemetryReading.timestamp))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_history(
        self,
        asset_id: str,
        filters: TelemetryFilterParams,
    ) -> Tuple[Sequence[TelemetryReading], int]:
        """Fetch historical time-series data with filtering, ordering and pagination.

        Returns (readings_for_page, total_matching_count).
        """
        base_conditions = [TelemetryReading.asset_id == asset_id]

        if filters.start_time is not None:
            base_conditions.append(TelemetryReading.timestamp >= filters.start_time)
        if filters.end_time is not None:
            base_conditions.append(TelemetryReading.timestamp <= filters.end_time)
        if filters.sensor_channel:
            base_conditions.append(TelemetryReading.channel == filters.sensor_channel)

        where_clause = and_(*base_conditions)

        # Count query for pagination metadata.
        count_stmt = (
            select(func.count())
            .select_from(TelemetryReading)
            .where(where_clause)
        )
        total_count = (await self.session.execute(count_stmt)).scalar() or 0

        # Data query — parameterized order/offset/limit (no string SQL).
        order_expr = (
            desc(TelemetryReading.timestamp)
            if filters.order == "desc"
            else TelemetryReading.timestamp
        )
        data_stmt = (
            select(TelemetryReading)
            .where(where_clause)
            .order_by(order_expr)
            .offset((filters.page - 1) * filters.size)
            .limit(filters.size)
        )
        result = await self.session.execute(data_stmt)
        readings = result.scalars().all()

        return readings, int(total_count)
