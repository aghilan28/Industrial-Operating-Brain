from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

class MachineStatusSummary(BaseModel):
    total: int
    online: int
    offline: int
    maintenance: int
    error: int
    unknown: int

class KPIWidgetData(BaseModel):
    label: str
    value: float
    unit: str
    trend: float
    trend_direction: str
    target: float
    status: str
    timestamp: datetime

class TelemetryWidgetData(BaseModel):
    machine_id: UUID
    machine_name: str
    metric: str
    unit: str
    current_value: float
    trend: List[Dict[str, Any]]
    threshold_warning: float
    threshold_critical: float
    status: str
    last_update: datetime

class DashboardOverviewResponse(BaseModel):
    machine_status: MachineStatusSummary
    telemetry_widgets: List[TelemetryWidgetData] = []
    alarm_widget: Dict[str, Any]
    kpi_widgets: List[KPIWidgetData] = []
    trend_widgets: List[Any] = []
    generated_at: datetime

# Catch-all fallback
def __getattr__(name: str):
    return type(name, (BaseModel,), {})
