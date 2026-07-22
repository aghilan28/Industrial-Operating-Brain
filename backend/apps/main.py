import json
import logging
import subprocess
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError

from apps.api.ai_proxy import router as ai_router
from apps.core.api.alert import router as alert_router
from apps.core.api.asset import router as asset_router
from apps.core.config import settings
from apps.core.health import router as health_router
from apps.core.middleware import (
    CorrelationIdMiddleware,
    SecurityHeadersMiddleware,
)
from apps.core.exceptions import (
    AppException,
    AuthenticationError,
    NotFoundError,
    ValidationError,
)

logger = logging.getLogger("app.legacy")


def create_app() -> FastAPI:
    """Application factory for test harness and ASGI runners."""
    app_instance = FastAPI(title="Industrial Operating Brain", version="1.0.0")

    # Add Middlewares
    app_instance.add_middleware(SecurityHeadersMiddleware)
    app_instance.add_middleware(CorrelationIdMiddleware)

    # Custom Application Exceptions Handler
    @app_instance.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        status_code = 500
        if isinstance(exc, AuthenticationError):
            status_code = 401
        elif isinstance(exc, NotFoundError):
            status_code = 404
        elif isinstance(exc, ValidationError):
            status_code = 400

        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "detail": str(exc.message if hasattr(exc, 'message') else exc),
                "error_code": exc.__class__.__name__.upper(),
            },
        )

    # Uniform HTTP Exception Handler (handles Starlette and FastAPI HTTP Exceptions, e.g. 404)
    @app_instance.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "detail": exc.detail,
                "error_code": "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR",
            },
        )

    # Uniform Validation Exception Handler
    @app_instance.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "detail": exc.errors(),
                "error_code": "VALIDATION_ERROR",
            },
        )

    # Register Health Check Router
    app_instance.include_router(
        health_router, prefix="/api/v1/health", tags=["Health"]
    )

    # Register Domain Routers
    app_instance.include_router(alert_router, prefix="/api/v1", tags=["alerts"])
    app_instance.include_router(asset_router, prefix="/api/v1/assets", tags=["Assets"])
    app_instance.include_router(ai_router, prefix="/api/v1/ai", tags=["AI"])

    @app_instance.get("/", tags=["Root"])
    def read_root():
        """Root endpoint — basic service status."""
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app_instance.get("/api/telemetry/latest", tags=["Telemetry"])
    def get_latest_telemetry(limit: int = 10):
        """Retrieve latest telemetry records from the database."""
        sql = (
            f"SELECT json_build_object('id', id, 'timestamp', timestamp, "
            f"'machine_id', machine_id, 'measured_value', measured_value) "
            f"FROM industrial.telemetry ORDER BY timestamp DESC LIMIT {limit};"
        )
        cmd = [
            "docker",
            "exec",
            "-i",
            "iob_postgres_db",
            "psql",
            "-U",
            "postgres",
            "-d",
            "iob",
            "-t",
            "-c",
            sql,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            rows = [
                json.loads(line.strip())
                for line in result.stdout.splitlines()
                if line.strip()
            ]
            return {"success": True, "data": rows}
        return {"success": False, "error": result.stderr.strip()}

    @app_instance.get(
        "/api/telemetry/machine/{machine_id}/history", tags=["Telemetry"]
    )
    def get_machine_history(machine_id: str, limit: int = 50):
        """Retrieve time-series telemetry for a specific machine."""
        sql = (
            f"SELECT json_build_object('id', id, 'timestamp', timestamp, "
            f"'machine_id', machine_id, 'measured_value', measured_value) "
            f"FROM industrial.telemetry WHERE machine_id = '{machine_id}' "
            f"ORDER BY timestamp DESC LIMIT {limit};"
        )
        cmd = [
            "docker",
            "exec",
            "-i",
            "iob_postgres_db",
            "psql",
            "-U",
            "postgres",
            "-d",
            "iob",
            "-t",
            "-c",
            sql,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            rows = [
                json.loads(line.strip())
                for line in result.stdout.splitlines()
                if line.strip()
            ]
            return {"success": True, "data": rows}
        return {"success": False, "error": result.stderr.strip()}

    return app_instance


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "apps.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "success": True}

