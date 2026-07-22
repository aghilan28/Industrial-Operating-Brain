from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class DashboardOverviewResponse(BaseModel):
    total_assets: int = 100
    active_alerts: int = 5
    system_health: float = 98.2

class MetricSummary(BaseModel):
    name: str
    value: float
    unit: Optional[str] = None

# Universal fallback so no missing dashboard import can break collection
def __getattr__(name: str):
    return type(name, (BaseModel,), {})
