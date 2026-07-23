"""
Dependency injection aliases & compatibility module.
Provides UserContext, get_current_user, and require_role for API routes.
"""
from typing import Any, Dict, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from apps.core.security import decode_token as _decode_token
from apps.database import get_db

# R-4.2.2/Issue B Requirements
class UserContext:
    __slots__ = ('user_id', 'email', 'role', 'roles', 'permissions')

    def __init__(
        self,
        user_id: str,
        role: str = "operator",
        email: str = None,
        roles: list = None,
        permissions: list = None,
        username: str = None,
    ):
        self.user_id = user_id
        self.role = role
        self.email = email or username or ""
        self.roles = roles or [role]
        self.permissions = permissions or []

    @property
    def username(self) -> str:
        return self.email or self.user_id

    @username.setter
    def username(self, value: str):
        self.email = value

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, UserContext):
            return False
        return (self.user_id, self.email, self.role) == (other.user_id, other.email, other.role)

    def __hash__(self) -> int:
        return hash((self.user_id, self.email, self.role))

    def __repr__(self) -> str:
        return f"<UserContext user_id={self.user_id} role={self.role}>"


# oauth2_scheme must point to /api/v1/auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def decode_token(token: str) -> Dict[str, Any]:
    return _decode_token(token)


def get_current_user(token: str = Depends(oauth2_scheme), db: Any = Depends(get_db)) -> UserContext:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    claims = decode_token(token)
    
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required claims: sub",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    roles = claims.get("roles", [])
    role = claims.get("role")
    
    if not role and not roles:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required claims: role",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not role and roles:
        role = roles[0]
        
    if not roles:
        roles = [role] if role else []
        
    email = claims.get("email")
    
    # Database enrichment for minimal/legacy tokens
    if db and sub:
        try:
            from apps.models.user import User
            user = db.query(User).filter(getattr(User, "user_id", None) == sub).first()
            if not user:
                user = db.query(User).filter(getattr(User, "id", None) == sub).first()
            if user:
                email = getattr(user, "email", email)
                role = getattr(user, "role", role)
                if getattr(user, "roles", None):
                    roles = user.roles
        except Exception:
            pass
            
    return UserContext(
        user_id=str(sub),
        role=role,
        roles=roles,
        permissions=claims.get("permissions", []),
        email=email,
        username=claims.get("username", str(sub))
    )


def require_role(*allowed_roles: str):
    def role_checker(user: UserContext = Depends(get_current_user)) -> UserContext:
        user_roles = user.roles or []
        if not user_roles and user.role:
            user_roles = [user.role]
        if not any(role in user_roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"insufficient role. Required: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker


DBSession = Any


__all__ = [
    "UserContext",
    "get_current_user",
    "require_role",
    "decode_token",
    "DBSession",
    "get_db",
    "oauth2_scheme",
]
