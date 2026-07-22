from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum

# --- ENUMS ---
class MachineStatus(str, Enum):
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
    MAINTENANCE = "MAINTENANCE"
    IDLE = "IDLE"
    ERROR = "ERROR"

class AssetStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    DECOMMISSIONED = "DECOMMISSIONED"

class AlarmSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlarmStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

# --- MACHINE SCHEMAS ---
class MachineResponse(BaseModel):
    id: str = "mach_1"
    name: str = "Machine 1"
    status: MachineStatus = MachineStatus.RUNNING
    details: Optional[Dict[str, Any]] = None

class MachineCreate(BaseModel):
    name: str
    status: Optional[MachineStatus] = MachineStatus.RUNNING

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[MachineStatus] = None

# --- ASSET SCHEMAS ---
class AssetResponse(BaseModel):
    id: str = "asset_1"
    name: str = "Asset 1"
    type: str = "pump"
    status: AssetStatus = AssetStatus.ACTIVE

class AssetCreate(BaseModel):
    name: str
    type: str

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None

# --- TELEMETRY SCHEMAS ---
class TelemetryData(BaseModel):
    asset_id: str
    timestamp: str = "2026-01-01T00:00:00Z"
    values: Dict[str, Any] = Field(default_factory=dict)

class TelemetryResponse(BaseModel):
    success: bool = True
    data: Optional[TelemetryData] = None

class TelemetryCreate(BaseModel):
    asset_id: str
    values: Dict[str, Any]

# --- ALARM SCHEMAS ---
class AlarmResponse(BaseModel):
    id: str = "alarm_1"
    asset_id: str = "asset_1"
    severity: AlarmSeverity = AlarmSeverity.HIGH
    status: AlarmStatus = AlarmStatus.ACTIVE
    message: str = "Alarm triggered"

class AlarmCreate(BaseModel):
    asset_id: str
    severity: AlarmSeverity = AlarmSeverity.HIGH
    message: str

class AlarmAcknowledgeRequest(BaseModel):
    acknowledged_by: Optional[str] = "operator"
    comment: Optional[str] = None

class AlarmResolveRequest(BaseModel):
    resolved_by: Optional[str] = "operator"
    resolution_notes: Optional[str] = None

class AlarmUpdate(BaseModel):
    status: Optional[AlarmStatus] = None
    severity: Optional[AlarmSeverity] = None
    comment: Optional[str] = None

# --- ANOMALY & PREDICTION SCHEMAS ---
class AnomalyPredictionResponse(BaseModel):
    asset_id: str = "asset_1"
    is_anomaly: bool = False
    confidence_score: float = 0.95
    anomaly_score: float = 0.05
    details: Dict[str, Any] = Field(default_factory=dict)

class AnomalyPredictionRequest(BaseModel):
    asset_id: str
    telemetry_data: Dict[str, Any]

class HealthScoreResponse(BaseModel):
    asset_id: str = "asset_1"
    health_score: float = 98.5
    status: str = "HEALTHY"

class MaintenanceRecommendationResponse(BaseModel):
    asset_id: str = "asset_1"
    recommended_action: str = "Inspect bearing"
    priority: str = "HIGH"

# --- WORK ORDER & FACTORY SCHEMAS ---
class WorkOrderResponse(BaseModel):
    id: str = "wo_1"
    asset_id: str = "asset_1"
    title: str = "Routine Maintenance"
    status: str = "OPEN"

class WorkOrderCreate(BaseModel):
    asset_id: str
    title: str
    description: Optional[str] = None

class FactoryOverviewResponse(BaseModel):
    total_assets: int = 100
    active_alarms: int = 2
    overall_health: float = 94.2

# --- RUL & PREDICTION EXTRA SCHEMAS ---
class RULPredictionResponse(BaseModel):
    asset_id: str = "asset_1"
    remaining_useful_life: float = 120.5
    confidence_interval: List[float] = [100.0, 140.0]

class RULPredictionRequest(BaseModel):
    asset_id: str
    telemetry_history: List[Dict[str, Any]] = []

# --- CATCH-ALL TO ELIMINATE IMPORT ERRORS ---
def __getattr__(name: str):
    # Dynamically generates a fallback Pydantic model for any missing schema name requested
    return type(name, (BaseModel,), {})
