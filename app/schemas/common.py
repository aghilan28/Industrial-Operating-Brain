"""
Phase 3 — Standardized API Response Envelope Models.
Provides ApiResponse[T], PaginatedResponse[T], and ErrorDetail for consistent
REST API payloads across all endpoints. Every router must wrap its responses
with these generic models to guarantee a uniform frontend contract.

Phase 4 modification:
- PaginatedResponse.size upper bound widened from le=100 -> le=500 so the
  high-frequency telemetry pipeline can return up to 500 time-series points
  per page (TelemetryFilterParams also caps at 500). This is fully
  backward-compatible: every pre-existing endpoint passes size <= 100 and
  continues to validate unchanged.
"""
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")

class ErrorDetail(BaseModel):
    """Structured error payload returned inside ApiResponse when success=False."""
    code: str = Field(..., description="Machine-readable error code (e.g. RESOURCE_NOT_FOUND)")
    message: str = Field(..., description="Human-readable summary of the error")
    details: Optional[dict[str, Any]] = Field(None, description="Extra contextual info (validation errors, etc.)")
    path: Optional[str] = Field(None, description="Request URL path where the error occurred")

class ApiResponse(BaseModel, Generic[T]):
    """
    Universal response envelope. Every REST endpoint returns this shape.
    Frontend HttpClient interceptor should extract: response.data.data
    """
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[ErrorDetail] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list envelope for collection endpoints (GET /assets, etc.)."""
    items: list[T]
    total: int = Field(..., description="Total count of records across all pages")
    page: int = Field(1, ge=1, description="Current page number (1-indexed)")
    size: int = Field(20, ge=1, le=500, description="Items per page (Phase 4: widened to 500 for telemetry)")
    pages: int = Field(..., description="Total number of pages")
