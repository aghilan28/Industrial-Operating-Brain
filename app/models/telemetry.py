"""
Phase 4 — SQLAlchemy ORM Model for Industrial Telemetry.

PURPOSE
  Persistent time-series storage model consumed by TelemetryRepository.
  Replaces the legacy pattern of building raw SQL strings and executing them
  through `docker exec psql` (see app/utils/REMOVED_db_shell.md).

DESIGN
  * One row == one timestamped multi-sensor frame for an asset.
  * `channel`  : optional representative/primary sensor channel for the frame,
                 enabling an indexed single-channel filter path.
  * `metrics_json` : full {channel: value} payload (JSON), so a single frame can
                 carry bearing_temp, vibration_rms, pressure, rpm, load_kw, etc.
  * Composite index on (asset_id, timestamp DESC) guarantees O(log N) point
                 lookups and fast range scans for the latest-reading and
                 history queries (TimescaleDB/Postgres and SQLite alike).

NOTE
  This is a DISTINCT model from the frozen Pydantic ingestion contract
  `ai-platform/app/models/telemetry.py` (TelemetryReading/TelemetryBatch used
  for edge-gateway ingest). That contract is a wire schema; THIS is the ORM
  persistence model living in the REST backend `app` package. The two are kept
  separate by design (ingest contract vs. query/persistence layer).
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TelemetryReading(Base):
    """Persistent time-series telemetry frame for a single industrial asset."""

    __tablename__ = "telemetry_readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(String(64), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    channel: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    metrics_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    __table_args__ = (
        # Composite index: O(log N) latest-point lookup + fast time-range scans.
        Index(
            "ix_telemetry_asset_time",
            "asset_id",
            timestamp.desc(),
        ),
        Index("ix_telemetry_asset_channel", "asset_id", "channel"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<TelemetryReading id={self.id} asset_id={self.asset_id!r} "
            f"timestamp={self.timestamp!r} channel={self.channel!r}>"
        )
