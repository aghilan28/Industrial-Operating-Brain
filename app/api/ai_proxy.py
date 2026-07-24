"""AI Proxy API router — routes requests through the resilient AI service layer.

All endpoints now flow through:
    Router → AIService → CircuitBreaker → ResilientAIClient → AI Platform

This eliminates raw ``httpx`` invocations from handler code and guarantees
consistent response envelopes, correlation tracing, and graceful degradation.
"""

from __future__ import annotations

import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from apps.services.ai_service import AIService, ai_service
from shared.schemas.ai import AIResponseEnvelope

router = APIRouter()


def _get_correlation_id(request: Request) -> str:
    """Extract or generate a correlation ID for distributed tracing."""
    return request.headers.get(
        "X-Correlation-ID",
        request.headers.get("X-Request-ID", str(uuid.uuid4())),
    )


# ======================================================================
# Prediction endpoints
# ======================================================================


@router.post("/predictive/infer", response_model=AIResponseEnvelope)
async def predictive_infer(
    request: Request,
    ai_svc: AIService = Depends(lambda: ai_service),
) -> Any:
    """Run anomaly detection inference on telemetry data.

    Expects JSON body with at minimum an ``asset_id`` field.
    Optionally includes ``metrics`` dict for the model features.
    """
    correlation_id = _get_correlation_id(request)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="Request body must be a JSON object")

    asset_id = body.get("asset_id", "unknown")
    metrics = body.get("metrics", {})

    result = await ai_svc.predict_telemetry_anomaly(
        asset_id=asset_id,
        metrics=metrics,
        correlation_id=correlation_id,
    )
    return result


@router.post("/predictive/rul", response_model=AIResponseEnvelope)
async def predictive_rul(
    request: Request,
    ai_svc: AIService = Depends(lambda: ai_service),
) -> Any:
    """Predict Remaining Useful Life (RUL) for an asset."""
    correlation_id = _get_correlation_id(request)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="Request body must be a JSON object")

    asset_id = body.get("asset_id", "unknown")
    telemetry = body.get("telemetry", body.get("metrics", {}))

    result = await ai_svc.predict_rul(
        asset_id=asset_id,
        telemetry=telemetry,
        correlation_id=correlation_id,
    )
    return result


@router.get("/predictive/{asset_id}/explain", response_model=AIResponseEnvelope)
async def predictive_explain(
    asset_id: str,
    request: Request,
    ai_svc: AIService = Depends(lambda: ai_service),
) -> Any:
    """Retrieve SHAP/LIME explainability for a prior prediction."""
    correlation_id = _get_correlation_id(request)
    return await ai_svc.explain_prediction(
        asset_id=asset_id,
        correlation_id=correlation_id,
    )


# ======================================================================
# GraphRAG endpoints
# ======================================================================


@router.post("/graphrag/query", response_model=AIResponseEnvelope)
async def graphrag_query(
    request: Request,
    ai_svc: AIService = Depends(lambda: ai_service),
) -> Any:
    """Execute a GraphRAG query against the industrial knowledge graph."""
    correlation_id = _get_correlation_id(request)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="Request body must be a JSON object")

    query = body.get("query", "")
    asset_id = body.get("asset_id", "global")

    if not query:
        raise HTTPException(status_code=422, detail="Missing required field: query")

    return await ai_svc.query_graph_rag(
        asset_id=asset_id,
        query=query,
        correlation_id=correlation_id,
    )


# ======================================================================
# LLM Chat endpoint
# ======================================================================


@router.post("/chat", response_model=AIResponseEnvelope)
async def chat(
    request: Request,
    ai_svc: AIService = Depends(lambda: ai_service),
) -> Any:
    """Send a chat message to the AI assistant."""
    correlation_id = _get_correlation_id(request)

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="Request body must be a JSON object")

    message = body.get("message", "")
    context = body.get("context")

    if not message:
        raise HTTPException(status_code=422, detail="Missing required field: message")

    return await ai_svc.chat(
        message=message,
        context=context,
        correlation_id=correlation_id,
    )


# ======================================================================
# Knowledge search endpoint
# ======================================================================


@router.get("/knowledge/search", response_model=AIResponseEnvelope)
async def knowledge_search(
    request: Request,
    q: Optional[str] = None,
    ai_svc: AIService = Depends(lambda: ai_service),
) -> Any:
    """Search the industrial knowledge base."""
    correlation_id = _get_correlation_id(request)

    if not q:
        raise HTTPException(status_code=422, detail="Missing required query parameter: q")

    return await ai_svc.search_knowledge(
        query=q,
        correlation_id=correlation_id,
    )


# ======================================================================
# Decision recommendation endpoint
# ======================================================================


@router.get("/decision/{asset_id}/recommendation", response_model=AIResponseEnvelope)
async def decision_recommendation(
    asset_id: str,
    request: Request,
    ai_svc: AIService = Depends(lambda: ai_service),
) -> Any:
    """Get a decision recommendation for the specified asset."""
    correlation_id = _get_correlation_id(request)
    return await ai_svc.get_decision_recommendation(
        asset_id=asset_id,
        correlation_id=correlation_id,
    )


# ======================================================================
# AI Platform health probe
# ======================================================================


@router.get("/health", response_model=dict)
async def ai_health(
    ai_svc: AIService = Depends(lambda: ai_service),
) -> dict:
    """Check the AI platform's health status directly (bypasses circuit breaker)."""
    healthy = await ai_svc.check_ai_platform_health()
    return {
        "success": healthy,
        "service": "AI Platform",
        "status": "healthy" if healthy else "unreachable",
    }
