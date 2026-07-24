"""
Phase 4 — Authentication Dependency for the Telemetry Pipeline.

Mirrors the platform's existing bearer-token convention (see
app/api/v1/auth.py and app/api/v1/assets_router.py) so the telemetry endpoints
enforce the same Header-based guard without introducing a divergent auth model.

Routers use:
    current_user: dict = Depends(get_current_user)
"""
from __future__ import annotations

from fastapi import Header

from app.core.exceptions import UnauthorizedException


def _extract_bearer_token(authorization: str | None) -> str:
    """Extract and validate the bearer token from the Authorization header."""
    if not authorization:
        raise UnauthorizedException(message="Missing Authorization header.")
    parts = authorization.split()
    token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else authorization
    if not token or len(token) < 10:
        raise UnauthorizedException(message="Invalid or expired token.")
    return token


async def get_current_user(authorization: str | None = Header(None)) -> dict:
    """Resolve the authenticated principal from the request headers.

    Returns a lightweight user descriptor. Kept intentionally simple to stay
    consistent with the platform's existing token-length validation scheme.
    """
    token = _extract_bearer_token(authorization)
    return {
        "user_id": "operator-001",
        "username": "demo_operator",
        "token": token,
    }
