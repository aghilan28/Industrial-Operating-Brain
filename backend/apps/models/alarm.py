from pydantic import BaseModel
from typing import Optional

class Alarm(BaseModel):
    id: Optional[str] = "1"
    asset_id: str = "asset_1"
    severity: str = "HIGH"
    message: str = "Alarm triggered"
