"""
Phase 3 — Domain Exception hierarchy for clean architecture error handling.
These exceptions are caught by the global middleware exception_handler.py
and translated into standardized ApiResponse envelopes.
Routers raise these instead of raw HTTPException for business-rule violations.
"""
from fastapi import status


class AppException(Exception):
    """Base application exception — caught by global handler, rendered as ApiResponse envelope."""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict | None = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class ResourceNotFoundException(AppException):
    """Raised when a requested resource (asset, alert, etc.) does not exist."""
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} with ID '{resource_id}' was not found.",
            code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ValidationException(AppException):
    """Raised when business-rule validation fails (beyond Pydantic schema checks)."""
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class UnauthorizedException(AppException):
    """Raised when authentication or authorization fails."""
    def __init__(self, message: str = "Authentication required or token invalid.", details: dict | None = None):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
        )


class ForbiddenException(AppException):
    """Raised when the authenticated user lacks required permissions."""
    def __init__(self, message: str = "Insufficient permissions for this operation.", details: dict | None = None):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
        )


class StateTransitionException(AppException):
    """Raised when an invalid state transition is attempted (e.g. resolving an already-resolved alert)."""
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(
            message=message,
            code="INVALID_STATE_TRANSITION",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )
