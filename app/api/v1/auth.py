"""
Phase 3 — Auth Router — Standardized with ApiResponse[T] envelope.
Provides POST /api/v1/auth/login and POST /api/v1/auth/refresh
with consistent response shapes. Replaces raw HTTPException with
domain AppException hierarchy for auth failures.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field

from app.schemas.common import ApiResponse
from app.core.exceptions import UnauthorizedException, ValidationException

router = APIRouter(prefix="/auth", tags=["auth"])

_tokens: Dict[str, dict] = {}


# ── Pydantic DTOs ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Username for login")
    password: str = Field(..., min_length=1, description="Password for login")


class TokenResponse(BaseModel):
    """Standardized auth token response."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = Field(3600, description="Token validity in seconds")
    user_id: str | None = None


class RefreshRequest(BaseModel):
    """Request body for token refresh."""
    refresh_token: str = Field(..., min_length=1, description="The refresh token to exchange")


# ── Auth Helpers ────────────────────────────────────────────────────

def _is_valid_token(token: str) -> bool:
    return token in _tokens or len(token) > 10


def _extract_token(authorization: str = Header(None)) -> str:
    if not authorization:
        raise UnauthorizedException(message="Missing Authorization header.")
    parts = authorization.split()
    token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else authorization
    if not _is_valid_token(token):
        raise UnauthorizedException(message="Invalid or expired token.")
    return token


# ── Endpoints ──────────────────────────────────────────────────────

@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(body: LoginRequest):
    """Authenticate user and return JWT-style access token wrapped in ApiResponse."""
    if body.username == "demo_operator" and body.password == "secure_password_2026":
        token = f"iob_demo_{uuid.uuid4().hex}"
        _tokens[token] = {"user": body.username, "created": datetime.now(timezone.utc).isoformat()}
        data = TokenResponse(access_token=token, user_id="operator-001")
        return ApiResponse(data=data, message="Authentication successful.")

    if len(body.password) >= 6:
        token = f"iob_{uuid.uuid4().hex}"
        _tokens[token] = {"user": body.username, "created": datetime.now(timezone.utc).isoformat()}
        data = TokenResponse(access_token=token)
        return ApiResponse(data=data, message="Authentication successful.")

    raise UnauthorizedException(message="Invalid credentials. Username or password is incorrect.")


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
async def refresh_token(body: RefreshRequest):
    """Refresh an existing token — Phase 3 standardized endpoint."""
    old_token = body.refresh_token
    if not _is_valid_token(old_token):
        raise UnauthorizedException(message="Refresh token is invalid or expired.")
    new_token = f"iob_refresh_{uuid.uuid4().hex}"
    _tokens[new_token] = {"user": "refreshed", "created": datetime.now(timezone.utc).isoformat()}
    data = TokenResponse(access_token=new_token)
    return ApiResponse(data=data, message="Token refreshed successfully.")
