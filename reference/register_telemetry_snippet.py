"""
PHASE 4 — DROP-IN WIRING SNIPPET
================================
Add this block to your existing aggregated router (app/api/v1/router.py),
alongside the other `api_router.include_router(...)` calls. It is written in
the same defensive try/except style the repo already uses, so a missing module
will never crash app startup.

    # Phase 4 — Telemetry Pipeline (Repository -> Service -> Router)
    try:
        from app.api.v1.telemetry import router as telemetry_router
        api_router.include_router(telemetry_router)
        logger.info("Phase 4 Telemetry pipeline router mounted at /assets/{id}/telemetry")
    except Exception as e:  # pragma: no cover
        logger.warning("telemetry router not mounted: %s", e)

Resulting public endpoints (api_router is mounted at settings.api_v1_prefix == "/api/v1"):
    GET /api/v1/assets/{asset_id}/telemetry/latest
    GET /api/v1/assets/{asset_id}/telemetry
"""
