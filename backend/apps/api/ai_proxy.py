"""AI Proxy API module."""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Request, HTTPException
from apps.services.ai_client import call_ai

router = APIRouter()


@router.post("/predictive/infer")
async def predictive_infer(request: Request) -> Any:
    if request.headers.get("content-type") != "application/json":
        raise HTTPException(status_code=400, detail="Content-Type must be application/json")
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(body, dict) or "asset_id" not in body or not body["asset_id"]:
        raise HTTPException(status_code=422, detail="Missing or empty required field: asset_id")

    return await call_ai("/api/v1/predictive/infer", payload=body, method="POST")


@router.get("/predictive/{asset_id}/explain")
async def predictive_explain(asset_id: str) -> Any:
    return await call_ai(f"/api/v1/xai/explain?asset_id={asset_id}", method="GET")


@router.post("/graphrag/query")
async def graphrag_query(request: Request) -> Any:
    body = await request.json()
    return await call_ai("/api/v1/graphrag/query", payload=body, method="POST")


@router.post("/chat")
async def chat(request: Request) -> Any:
    body = await request.json()
    return await call_ai("/api/v1/chat", payload=body, method="POST")


@router.get("/knowledge/search")
async def knowledge_search(q: Optional[str] = None) -> Any:
    path = f"/api/v1/knowledge/search?q={q}" if q else "/api/v1/knowledge/search"
    return await call_ai(path, method="GET")


@router.get("/decision/{asset_id}/recommendation")
async def decision_recommendation(asset_id: str) -> Any:
    return await call_ai(f"/api/v1/decision/{asset_id}/recommendation", method="GET")
