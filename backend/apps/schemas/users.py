from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: Optional[str] = "operator"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    role: str
    is_active: bool = True

class RoleResponse(BaseModel):
    id: Optional[str] = "1"
    name: str = "operator"
    permissions: list[str] = []

class UserOut(UserResponse):
    pass

class PermissionResponse(BaseModel):
    id: Optional[str] = "1"
    name: str = "read:assets"
    description: Optional[str] = "Permission to read assets"

class RoleCreate(BaseModel):
    name: str
    permissions: list[str] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[list[str]] = None
