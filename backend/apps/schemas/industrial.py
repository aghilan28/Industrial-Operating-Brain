"""
Industrial schema compatibility aliases pointing to backend integration contracts.
"""
from backend.integration.backend_contracts import AlarmAcknowledgeRequest, ContractBaseModel
from pydantic import Field
from typing import Optional
from uuid import UUID

class AlarmResolveRequest(ContractBaseModel):
    alarm_id: UUID
    operator_id: UUID
    notes: Optional[str] = Field(None, description="Resolution notes")
