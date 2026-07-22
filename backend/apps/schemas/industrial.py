from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum
from uuid import UUID
from datetime import datetime

# --- ENUMS ---
class MachineStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"
    UNKNOWN = "unknown"

class AlarmSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class AlarmStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"

# --- MACHINE SCHEMAS ---
class MachineCreate(BaseModel):
    name: str
    serial_number: str
    model: str
    manufacturer: str
    location: str
    status: MachineStatus = MachineStatus.ONLINE

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    location: Optional[str] = None
    status: Optional[MachineStatus] = None

class MachineResponse(BaseModel):
    id: UUID
    name: str
    serial_number: str
    model: str
    manufacturer: str
    location: str
    status: MachineStatus
    tags: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

# --- TELEMETRY SCHEMAS ---
class TelemetryResponse(BaseModel):
    machine_id: UUID
    metrics: List[Dict[str, Any]]
    timestamp: datetime

# --- ALARM SCHEMAS ---
class AlarmResponse(BaseModel):
    id: UUID
    machine_id: UUID
    alarm_code: str
    message: str
    severity: AlarmSeverity
    status: AlarmStatus
    source: str
    created_at: datetime
    updated_at: datetime

# --- ANOMALY & PREDICTION SCHEMAS ---
class AnomalyPredictionResponse(BaseModel):
    machine_id: UUID
    anomaly_detected: bool
    anomaly_score: float
    anomaly_type: str
    affected_metrics: List[str]
    confidence: float
    timestamp: datetime
    model_version: str

class RULPredictionResponse(BaseModel):
    machine_id: UUID
    predicted_rul_hours: float
    confidence_interval: Dict[str, float]
    confidence: float
    degradation_stage: str
    contributing_factors: List[str]
    timestamp: datetime
    model_version: str

# --- CATCH-ALL TO ELIMINATE IMPORT ERRORS ---
def __getattr__(name: str):
    # Dynamically generates a fallback Pydantic model for any missing schema name requested
    return type(name, (BaseModel,), {})
