"""
Phase 3 — Alerts Router — Fully REST-compliant.
Provides standardized CRUD + state-transition endpoints with ApiResponse[T] envelopes.

Endpoints:
  GET  /api/v1/alerts/active           — List active (non-resolved) alerts
  POST /api/v1/alerts/acknowledge/{id}  — Acknowledge an alert (PATCH semantics via POST for compat)
  PATCH /api/v1/alerts/{id}/resolve     — Resolve an alert (Phase 3 NEW endpoint)
  POST /api/v1/alerts/inject            — Inject a test alert
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field

from app.schemas.common import ApiResponse
from app.core.exceptions import ResourceNotFoundException, StateTransitionException, UnauthorizedException

router = APIRouter(prefix="/alerts", tags=["alerts"])

_alerts: List[Dict] = []


# ── Pydantic DTOs ──────────────────────────────────────────────────

class AlarmInject(BaseModel):
    asset_id: str
    metric: str
    value: float
    model_config = {"extra": "allow"}


class AcknowledgeAlertRequest(BaseModel):
    """Payload for acknowledging an alert."""
    operator_id: Optional[str] = None
    model_config = {"extra": "allow"}


class ResolveAlertRequest(BaseModel):
    """Payload for resolving an alert — operator_id and resolution_summary are required."""
    operator_id: str = Field(..., min_length=1, description="ID of the operator resolving the alert")
    resolution_summary: str = Field(..., min_length=1, description="Brief description of the resolution action")


class AlertSchema(BaseModel):
    """Standardized alert response schema."""
    id: str
    asset_id: str
    severity: str
    message: str
    status: str
    acknowledged: Optional[bool] = None
    resolution_summary: Optional[str] = None
    resolved_at: Optional[str] = None
    timestamp: Optional[str] = None


# ── Auth Dependency ────────────────────────────────────────────────

def _extract_token(authorization: str = Header(None)) -> str:
    if not authorization:
        raise UnauthorizedException(message="Missing Authorization header.")
    token = authorization.split()[1] if "Bearer" in authorization else authorization
    if len(token) < 5:
        raise UnauthorizedException(message="Invalid or expired token.")
    return token


# ── Helper ──────────────────────────────────────────────────────────

def _find_alert(alert_id: str) -> Dict:
    for a in _alerts:
        if a.get("id") == alert_id or a.get("alert_id") == alert_id:
            return a
    raise ResourceNotFoundException("Alert", alert_id)


# ── Endpoints ──────────────────────────────────────────────────────

@router.get("/active", response_model=ApiResponse[list[AlertSchema]])
async def active_alerts(token: str = Depends(_extract_token)):
    active = [a for a in _alerts if a.get("status") not in {"RESOLVED", "CLOSED"}]
    mapped = [AlertSchema(
        id=a.get("id") or a.get("alert_id", ""),
        asset_id=a.get("asset_id", ""),
        severity=a.get("severity", "INFO"),
        message=a.get("metric", ""),
        status=a.get("status", "ACTIVE"),
        acknowledged=a.get("acknowledged"),
        resolution_summary=a.get("resolution_summary"),
        resolved_at=a.get("resolved_at"),
        timestamp=a.get("timestamp"),
    ) for a in active]
    return ApiResponse(data=mapped, message=f"{len(mapped)} active alerts retrieved.")


@router.post("/acknowledge/{alert_id}", response_model=ApiResponse[AlertSchema])
async def ack_alert(
    alert_id: str,
    payload: AcknowledgeAlertRequest = AcknowledgeAlertRequest(),
    token: str = Depends(_extract_token),
):
    """Acknowledge an alert — transitions status from ACTIVE to ACKNOWLEDGED."""
    alert = _find_alert(alert_id)
    if alert["status"] == "RESOLVED":
        raise StateTransitionException(
            message=f"Alert '{alert_id}' is already RESOLVED and cannot be acknowledged.",
            details={"current_status": alert["status"]},
        )
    alert["acknowledged"] = True
    alert["status"] = "ACKNOWLEDGED"
    result = AlertSchema(
        id=alert.get("id") or alert.get("alert_id", ""),
        asset_id=alert.get("asset_id", ""),
        severity=alert.get("severity", "INFO"),
        message=alert.get("metric", ""),
        status=alert["status"],
        acknowledged=True,
        timestamp=alert.get("timestamp"),
    )
    return ApiResponse(data=result, message="Alert acknowledged successfully.")


@router.patch("/{alert_id}/resolve", response_model=ApiResponse[AlertSchema])
async def resolve_alert(
    alert_id: str,
    payload: ResolveAlertRequest,
    token: str = Depends(_extract_token),
):
    """
    Phase 3 NEW endpoint — Mark an active or acknowledged alert as resolved.
    Requires operator_id and resolution_summary in the request body.
    Validates state transitions: only ACTIVE or ACKNOWLEDGED alerts can be resolved.
    """
    alert = _find_alert(alert_id)
    if alert["status"] in {"RESOLVED", "CLOSED"}:
        raise StateTransitionException(
            message=f"Alert '{alert_id}' is already {alert['status']} and cannot be resolved again.",
            details={"current_status": alert["status"]},
        )
    now = datetime.now(timezone.utc).isoformat()
    alert["status"] = "RESOLVED"
    alert["resolved"] = True
    alert["resolved_at"] = now
    alert["resolution_summary"] = payload.resolution_summary
    alert["operator_id"] = payload.operator_id
    result = AlertSchema(
        id=alert.get("id") or alert.get("alert_id", ""),
        asset_id=alert.get("asset_id", ""),
        severity=alert.get("severity", "INFO"),
        message=alert.get("metric", ""),
        status="RESOLVED",
        resolution_summary=payload.resolution_summary,
        resolved_at=now,
        timestamp=alert.get("timestamp"),
    )
    return ApiResponse(data=result, message="Alert successfully marked as resolved.")


@router.post("/inject", response_model=ApiResponse[AlertSchema])
async def inject_alert(body: AlarmInject, token: str = Depends(_extract_token)):
    """Inject a test alert for demo / integration testing purposes."""
    alert = {
        "id": str(uuid.uuid4()),
        "asset_id": body.asset_id,
        "metric": body.metric,
        "value": body.value,
        "severity": "CRITICAL",
        "status": "ACTIVE",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _alerts.append(alert)
    result = AlertSchema(
        id=alert["id"],
        asset_id=alert["asset_id"],
        severity=alert["severity"],
        message=alert["metric"],
        status=alert["status"],
        timestamp=alert["timestamp"],
    )
    return ApiResponse(data=result, message="Test alert injected successfully.")
