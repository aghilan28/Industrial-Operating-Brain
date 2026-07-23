from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    is_active: bool = True
    roles: List[str] = ["operator"]

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    roles: Optional[List[str]] = None

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    roles: List[str]
    created_at: datetime
    updated_at: datetime

class RoleResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    permissions: List[str] = []
    created_at: datetime
    is_system: bool = False

class UserOut(UserResponse):
    pass

class PermissionResponse(BaseModel):
    id: UUID
    name: str
    resource: str
    action: str
    description: Optional[str] = None
    created_at: datetime

class RoleCreate(BaseModel):
    name: str
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[List[str]] = None

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class PermissionCreate(BaseModel):
    name: str
    resource: str
    action: str
    description: Optional[str] = None

# Catch-all fallback
def __getattr__(name: str):
    return type(name, (BaseModel,), {})
