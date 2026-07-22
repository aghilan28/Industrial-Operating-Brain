from pydantic import BaseModel
from typing import Optional, Dict, Any

class Asset(BaseModel):
    id: Optional[str] = "asset_1"
    name: str = "Test Asset"
    type: str = "pump"
    status: str = "ACTIVE"
    metadata: Dict[str, Any] = {}
