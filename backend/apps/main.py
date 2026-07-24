import asyncio
import json
import logging
import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError

from apps.api.ai_proxy import router as ai_router
from apps.api.auth import router as auth_router
from apps.api.users import router as users_router
from apps.api.ws import router as ws_router
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
    request_validation_exception_handler,
    pydantic_validation_exception_handler,
    http_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler,
)
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger("app.legacy")


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """Phase 5 — real-time subsystem startup and graceful shutdown.

    Startup boots the async MQTT ingestion bridge as a supervised background
    task (it self-heals across broker outages via exponential backoff).
    Shutdown stops ingestion first, then drains every WebSocket connection so
    no socket is left half-open when the worker exits.

    Ingestion is opt-out via ``settings.ENABLE_REALTIME_STREAMING`` and never
    blocks application startup: a broker that is down at boot simply causes the
    supervisor to retry in the background while the HTTP API serves normally.
    """
    bridge = None

    if getattr(settings, "ENABLE_REALTIME_STREAMING", True):
        try:
            from apps.services.mqtt_bridge import mqtt_bridge

            bridge = mqtt_bridge
            await bridge.start()
            logger.info("Phase 5 real-time MQTT ingestion bridge started")
        except Exception as exc:  # noqa: BLE001 - ingestion must not block the API
            logger.error("MQTT bridge failed to start: %s", exc)
            bridge = None
    else:
        logger.info("Real-time streaming disabled by configuration")

    try:
        yield
    finally:
        if bridge is not None:
            try:
                await bridge.stop()
            except Exception as exc:  # noqa: BLE001
                logger.warning("Error stopping MQTT bridge: %s", exc)

        try:
            from apps.core.connection_manager import connection_manager

            await connection_manager.disconnect_all()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Error draining WebSocket connections: %s", exc)


def create_app() -> FastAPI:
    """Application factory for test harness and ASGI runners."""
    app_instance = FastAPI(
        title="Industrial Operating Brain",
        version="1.0.0",
        lifespan=lifespan,
    )

    # Add Middlewares
    app_instance.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    app_instance.add_middleware(SecurityHeadersMiddleware)
    app_instance.add_middleware(CorrelationIdMiddleware)

    # Custom Application Exceptions Handler
    @app_instance.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            },
        )

    # Exception Handlers Registration
    app_instance.add_exception_handler(RequestValidationError, request_validation_exception_handler)
    app_instance.add_exception_handler(PydanticValidationError, pydantic_validation_exception_handler)
    app_instance.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app_instance.add_exception_handler(Exception, general_exception_handler)
    app_instance.add_exception_handler(StarletteHTTPException, http_exception_handler)

    # Register Health Check Router
    app_instance.include_router(
        health_router, prefix="/health", tags=["Health"]
    )
    app_instance.include_router(
        health_router, prefix="/api/v1/health", tags=["Health"]
    )

    # Register Domain Routers
    app_instance.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
    app_instance.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
    app_instance.include_router(alert_router, prefix="/api/v1", tags=["alerts"])
    app_instance.include_router(asset_router, prefix="/api/v1/assets", tags=["Assets"])
    app_instance.include_router(ai_router, prefix="/api/v1/ai", tags=["AI"])

    # Phase 5 — Real-Time Telemetry Streaming.
    # Publishes:
    #   WS /api/v1/stream?token=<jwt>                     (legacy frame contract)
    #   WS /api/v1/ws/telemetry/{client_id}?token=<jwt>   (versioned envelopes)
    app_instance.include_router(
        ws_router, prefix="/api/v1", tags=["Real-Time Telemetry Stream"]
    )

    @app_instance.get("/", tags=["Root"])
    def read_root():
        """Root endpoint â€” basic service status."""
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app_instance.get("/health")
    def health_endpoint():
        return {"status": "healthy", "version": settings.VERSION}

    @app_instance.get("/api/v1/stream/health", tags=["Real-Time Telemetry Stream"])
    def stream_health():
        """Phase 5 streaming subsystem observability snapshot."""
        from apps.core.connection_manager import connection_manager
        from apps.services.mqtt_bridge import mqtt_bridge, sensor_queue
        from apps.services.stream_dispatcher import stream_dispatcher

        return {
            "success": True,
            "data": {
                "active_connections": connection_manager.connection_count,
                "dispatcher": stream_dispatcher.stats(),
                "ingestion": {
                    "queue_depth": sensor_queue.qsize(),
                    "messages_ingested": mqtt_bridge.messages_ingested,
                    "messages_rejected": mqtt_bridge.messages_rejected,
                    "broker": f"{mqtt_bridge.broker_host}:{mqtt_bridge.broker_port}",
                    "topic_filter": mqtt_bridge.topic_filter,
                },
            },
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

