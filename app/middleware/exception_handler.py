"""
Phase 3 — Global REST API Exception Handlers.
Intercepts AppException, RequestValidationError, and StarletteHTTPException
and renders them as standardized ApiResponse[T] envelopes with ErrorDetail.
Registered in app/main.py alongside the existing AI service exception handlers.

(UNCHANGED from the existing repository — included in this Phase 4 bundle only
so the telemetry module set is self-contained and runnable. Do not modify.)
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.schemas.common import ApiResponse, ErrorDetail
from app.core.exceptions import AppException
import logging
from typing import Any

logger = logging.getLogger("iob.backend.rest")

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Catch domain exceptions and render as ApiResponse envelope."""
    payload = ApiResponse[Any](
        success=False,
        error=ErrorDetail(
            code=exc.code,
            message=exc.message,
            details=exc.details,
            path=request.url.path,
        ),
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump(mode="json"))

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Catch Pydantic validation errors and render as ApiResponse envelope."""
    payload = ApiResponse[Any](
        success=False,
        error=ErrorDetail(
            code="INVALID_PAYLOAD",
            message="Request body or parameters failed validation.",
            details={"errors": exc.errors()},
            path=request.url.path,
        ),
    )
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload.model_dump(mode="json"))

async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Catch Starlette/FastAPI HTTPException and render as ApiResponse envelope."""
    payload = ApiResponse[Any](
        success=False,
        error=ErrorDetail(
            code="HTTP_ERROR",
            message=str(exc.detail),
            path=request.url.path,
        ),
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump(mode="json"))

def install_rest_exception_handlers(app) -> None:
    """
    Register REST API exception handlers on the FastAPI app instance.
    Called from app/main.py after existing AI-service handlers are installed.
    """
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    logger.info("REST API exception handlers installed — AppException, RequestValidationError")
