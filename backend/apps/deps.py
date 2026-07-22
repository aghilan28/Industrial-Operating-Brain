"""
Dependency injection aliases & compatibility module.
Provides UserContext, get_current_user, and require_role for API routes.
"""
from dataclasses import dataclass
from typing import Any, Dict, Optional, List
from fastapi import Depends
from apps.core.security import get_current_user as _get_current_user, require_roles

@dataclass
class UserContext:
    user_id: str
    username: str
    role: str
    roles: List[str]
    email: Optional[str] = None

async def get_current_user(claims: Dict[str, Any] = Depends(_get_current_user)) -> UserContext:
    roles = claims.get("roles", [])
    role = claims.get("role") or (roles[0] if roles else "operator")
    return UserContext(
        user_id=str(claims.get("sub", "")),
        username=claims.get("username", claims.get("sub", "")),
        role=role,
        roles=roles if isinstance(roles, list) else [role],
        email=claims.get("email")
    )

def require_role(*allowed_roles: str):
    return require_roles(*allowed_roles)
