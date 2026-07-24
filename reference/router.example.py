"""
PHASE 4 — REFERENCE: fully-wired aggregated router (example only).
===================================================================
If your root `app/api/v1/router.py` is missing or you want a complete reference,
this shows the defensive aggregation pattern (mirrors ai-platform/app/api/v1/router.py)
INCLUDING the new Phase 4 telemetry router. Do NOT overwrite a working router.py
blindly — prefer the drop-in snippet in register_telemetry_snippet.py.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter

logger = logging.getLogger(__name__)

api_router = APIRouter()


def _mount(module_path: str, attr: str = "router", label: str = "") -> None:
    try:
        mod = __import__(module_path, fromlist=[attr])
        api_router.include_router(getattr(mod, attr))
        logger.info("Mounted %s", label or module_path)
    except Exception as e:  # pragma: no cover
        logger.warning("Could not mount %s: %s", label or module_path, e)


# Existing Phase 3 REST routers (Gateway-owned compatibility shims)
_mount("app.api.v1.auth", label="auth (/auth)")
_mount("app.api.v1.dashboard", label="dashboard (/dashboard)")
_mount("app.api.v1.assets_router", label="assets (/assets)")
_mount("app.api.v1.alerts", label="alerts (/alerts)")
_mount("app.api.v1.predictive", label="predictive (/predictive)")

# Phase 4 — Telemetry Pipeline (NEW)
_mount("app.api.v1.telemetry", label="telemetry (/assets/{id}/telemetry)")
