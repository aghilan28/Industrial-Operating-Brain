"""
Phase 3 — Dashboard Router — Fully REST-compliant.
Provides GET /api/v1/dashboard/overview and GET /api/v1/dashboard/summary
with standardized ApiResponse[T] envelopes.
The /summary endpoint provides operational metrics for the executive dashboard.
"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.schemas.common import ApiResponse
from app.core.exceptions import UnauthorizedException

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_ASSETS = [
    {"id": "machine07", "asset_id": "machine07", "name": "Pump-007", "type": "PUMP", "status": "OPERATIONAL", "location": "Plant-A"},
    {"id": "machine01", "asset_id": "machine01", "name": "Compressor-001", "type": "COMPRESSOR", "status": "DEGRADED", "location": "Plant-A"},
    {"id": "machine02", "asset_id": "machine02", "name": "Turbine-002", "type": "TURBINE", "status": "OPERATIONAL", "location": "Plant-B"},
    {"id": "pump101", "asset_id": "pump101", "name": "Pump-101", "type": "PUMP", "status": "OPERATIONAL", "location": "Plant-A"},
    {"id": "asset-101", "asset_id": "asset-101", "name": "Motor 101", "type": "MOTOR", "status": "OPERATIONAL", "location": "Plant-C"},
]


# ── Pydantic DTOs ──────────────────────────────────────────────────

class DashboardOverviewData(BaseModel):
    total_assets: int
    operational_assets: int
    degraded_assets: int
    critical_alerts: int = 0
    simulator_live: bool = True
    last_updated: str


class DashboardSummaryResponse(BaseModel):
    """Executive dashboard metrics — powers the main dashboard view."""
    total_assets: int = Field(..., description="Total number of registered assets")
    operational_assets: int = Field(..., description="Assets currently in OPERATIONAL status")
    degraded_assets: int = Field(..., description="Assets in DEGRADED status")
    active_critical_alerts: int = Field(..., description="Currently active CRITICAL severity alerts")
    fleet_health_score: float = Field(..., ge=0, le=100, description="Overall fleet health percentage (0–100)")


# ── Auth Dependency ────────────────────────────────────────────────

def _extract_token(authorization: str = Header(None)) -> str:
    if not authorization:
        raise UnauthorizedException(message="Missing Authorization header.")
    token = authorization.split()[1] if "Bearer" in authorization else authorization
    if len(token) < 5:
        raise UnauthorizedException(message="Invalid or expired token.")
    return token


# ── Endpoints ──────────────────────────────────────────────────────

@router.get("/overview", response_model=ApiResponse[DashboardOverviewData])
async def overview(token: str = Depends(_extract_token)):
    operational = [a for a in _ASSETS if a["status"] == "OPERATIONAL"]
    degraded = [a for a in _ASSETS if a["status"] == "DEGRADED"]
    data = DashboardOverviewData(
        total_assets=len(_ASSETS),
        operational_assets=len(operational),
        degraded_assets=len(degraded),
        critical_alerts=0,
        last_updated=datetime.now(timezone.utc).isoformat(),
    )
    return ApiResponse(data=data, message="Dashboard overview retrieved successfully.")


@router.get("/summary", response_model=ApiResponse[DashboardSummaryResponse])
async def get_dashboard_summary(token: str = Depends(_extract_token)):
    """
    Phase 3 NEW endpoint — Provides aggregated operational metrics
    (Total Assets, Operational Count, Active Critical Alerts, Avg Fleet Health)
    to power the main executive dashboard.
    """
    operational = [a for a in _ASSETS if a["status"] == "OPERATIONAL"]
    degraded = [a for a in _ASSETS if a["status"] == "DEGRADED"]
    health = round(len(operational) / len(_ASSETS) * 100, 1) if _ASSETS else 0.0

    metrics = DashboardSummaryResponse(
        total_assets=len(_ASSETS),
        operational_assets=len(operational),
        degraded_assets=len(degraded),
        active_critical_alerts=0,
        fleet_health_score=health,
    )
    return ApiResponse(data=metrics, message="Dashboard metrics retrieved successfully.")
