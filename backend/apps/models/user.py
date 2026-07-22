from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: Optional[str] = "1"
    username: str = "admin"
    role: str = "admin"
    is_active: bool = True
