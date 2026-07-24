"""
Phase 3 — Assets Router — Fully REST-compliant.
Provides complete CRUD endpoints with ApiResponse[T] envelopes.

Endpoints:
  GET    /api/v1/assets              — List all assets (PaginatedResponse)
  GET    /api/v1/assets/{asset_id}   — Get single asset
  POST   /api/v1/assets              — Create a new asset (Phase 3 NEW)
  DELETE /api/v1/assets/{asset_id}   — Deactivate/soft-delete an asset (Phase 3 NEW)
"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, status
from pydantic import BaseModel, Field

from app.schemas.common import ApiResponse, PaginatedResponse
from app.core.exceptions import ResourceNotFoundException, UnauthorizedException

router = APIRouter(prefix="/assets", tags=["assets"])

_assets = [
    {"id": "machine07", "asset_id": "machine07", "name": "Pump-007", "type": "PUMP", "status": "OPERATIONAL", "location": "Plant-A"},
    {"id": "machine01", "asset_id": "machine01", "name": "Compressor-001", "type": "COMPRESSOR", "status": "DEGRADED", "location": "Plant-A"},
    {"id": "machine02", "asset_id": "machine02", "name": "Turbine-002", "type": "TURBINE", "status": "OPERATIONAL", "location": "Plant-B"},
    {"id": "pump101", "asset_id": "pump101", "name": "Pump-101", "type": "PUMP", "status": "OPERATIONAL", "location": "Plant-A"},
    {"id": "asset-101", "asset_id": "asset-101", "name": "Motor 101", "type": "MOTOR", "status": "OPERATIONAL", "location": "Plant-C"},
]


# ── Pydantic DTOs ──────────────────────────────────────────────────

class AssetSchema(BaseModel):
    """Standardized asset response schema."""
    id: str
    asset_id: str
    name: str
    type: str
    status: str
    location: str


class CreateAssetRequest(BaseModel):
    """Payload for creating a new asset."""
    name: str = Field(..., min_length=1, max_length=100, description="Human-readable asset name")
    type: str = Field(..., description="Asset type (PUMP, COMPRESSOR, TURBINE, MOTOR, etc.)")
    location: str = Field(..., min_length=1, description="Physical location of the asset")


# ── Auth Dependency ────────────────────────────────────────────────

def _extract_token(authorization: str = Header(None)) -> str:
    if not authorization:
        raise UnauthorizedException(message="Missing Authorization header.")
    token = authorization.split()[1] if "Bearer" in authorization else authorization
    if len(token) < 5:
        raise UnauthorizedException(message="Invalid or expired token.")
    return token


# ── Helper ──────────────────────────────────────────────────────────

def _find_asset(asset_id: str) -> dict:
    for a in _assets:
        if a["id"] == asset_id or a["asset_id"] == asset_id:
            return a
    raise ResourceNotFoundException("Asset", asset_id)


def _asset_to_schema(a: dict) -> AssetSchema:
    return AssetSchema(
        id=a["id"],
        asset_id=a["asset_id"],
        name=a["name"],
        type=a["type"],
        status=a["status"],
        location=a["location"],
    )


# ── Endpoints ──────────────────────────────────────────────────────

@router.get("", response_model=ApiResponse[PaginatedResponse[AssetSchema]])
async def list_assets(
    token: str = Depends(_extract_token),
    page: int = 1,
    size: int = 20,
):
    """List all assets with paginated envelope."""
    total = len(_assets)
    pages = max(1, (total + size - 1) // size)
    start = (page - 1) * size
    end = start + size
    items = [_asset_to_schema(a) for a in _assets[start:end]]
    paginated = PaginatedResponse(items=items, total=total, page=page, size=size, pages=pages)
    return ApiResponse(data=paginated, message="Assets retrieved successfully.")


@router.get("/{asset_id}", response_model=ApiResponse[AssetSchema])
async def get_asset(asset_id: str, token: str = Depends(_extract_token)):
    """Get a single asset by ID."""
    asset = _find_asset(asset_id)
    return ApiResponse(data=_asset_to_schema(asset), message="Asset retrieved successfully.")


@router.post("", response_model=ApiResponse[AssetSchema], status_code=status.HTTP_201_CREATED)
async def create_asset(
    payload: CreateAssetRequest,
    token: str = Depends(_extract_token),
):
    """
    Phase 3 NEW endpoint — Create a new asset.
    Auto-generates asset_id from name + type, sets initial status to OPERATIONAL.
    """
    import uuid as _uuid
    generated_id = payload.name.lower().replace(" ", "-") + "-" + _uuid.uuid4().hex[:6]
    new_asset = {
        "id": generated_id,
        "asset_id": generated_id,
        "name": payload.name,
        "type": payload.type,
        "status": "OPERATIONAL",
        "location": payload.location,
    }
    _assets.append(new_asset)
    return ApiResponse(data=_asset_to_schema(new_asset), message="Asset created successfully.")


@router.delete("/{asset_id}", response_model=ApiResponse[AssetSchema])
async def deactivate_asset(asset_id: str, token: str = Depends(_extract_token)):
    """
    Phase 3 NEW endpoint — Soft-delete / deactivate an asset.
    Sets status to DECOMMISSIONED rather than removing from the list,
    preserving audit trail. Returns the updated asset schema.
    """
    asset = _find_asset(asset_id)
    asset["status"] = "DECOMMISSIONED"
    return ApiResponse(data=_asset_to_schema(asset), message="Asset deactivated successfully.")
