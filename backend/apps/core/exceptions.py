"""
Custom Exception Hierarchy for IOB Platform
Phase 5: Structured error handling with error codes and details.
"""

from typing import Any, Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class IOBException(Exception):
    """Base exception for all IOB application errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

    def __str__(self) -> str:
        return f"[{self.error_code}] {self.message}"


class ResourceNotFoundError(IOBException):
    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        message = f"{resource_type} with ID '{resource_id}' not found"
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            status_code=404,
            details={**(details or {}), "resource_type": resource_type, "resource_id": resource_id},
        )
        self.resource_type = resource_type
        self.resource_id = resource_id


class ValidationError(IOBException):
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=details or {},
        )


class AuthenticationError(IOBException):
    def __init__(
        self,
        message: str = "Authentication required",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            error_code="UNAUTHORIZED",
            status_code=401,
            details=details or {},
        )


class AuthorizationError(IOBException):
    def __init__(
        self,
        message: str = "Insufficient permissions",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            error_code="FORBIDDEN",
            status_code=403,
            details=details or {},
        )


class RateLimitError(IOBException):
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: int = 60,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details={**(details or {}), "retry_after": retry_after},
        )


class ExternalServiceError(IOBException):
    def __init__(
        self,
        service: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=f"External service '{service}' error: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            status_code=502,
            details={**(details or {}), "service": service},
        )


class ConfigurationError(IOBException):
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=500,
            details=details or {},
        )


class RepositoryError(IOBException):
    def __init__(
        self,
        operation: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=f"Repository operation '{operation}' failed: {message}",
            error_code="REPOSITORY_ERROR",
            status_code=500,
            details={**(details or {}), "operation": operation},
        )


# Backward-compatibility / test harness aliases
AppException = IOBException
NotFoundError = ResourceNotFoundError

def create_error_response(exc: IOBException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": exc.message,
            "error_code": exc.error_code,
            "details": exc.details,
        },
    )

async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "detail": exc.errors(),
            "error_code": "VALIDATION_ERROR",
        },
    )

async def pydantic_validation_exception_handler(request: Request, exc: PydanticValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "detail": exc.errors(),
            "error_code": "VALIDATION_ERROR",
        },
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": exc.detail,
            "error_code": "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR",
        },
    )

async def sqlalchemy_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": "Database error occurred",
            "error_code": "DATABASE_ERROR",
        },
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": "An unexpected error occurred",
            "error_code": "INTERNAL_ERROR",
        },
    )

def sanitize_payload(payload: Any) -> Any:
    if isinstance(payload, dict):
        sanitized = {}
        for key, value in payload.items():
            if "password" in key.lower() or "token" in key.lower() or "secret" in key.lower():
                sanitized[key] = "***REDACTED***"
            else:
                sanitized[key] = sanitize_payload(value)
        return sanitized
    elif isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]
    return payload
