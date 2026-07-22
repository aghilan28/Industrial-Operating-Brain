"""AI Client service module."""
from typing import Any, Dict, Optional
import httpx
from fastapi.responses import JSONResponse
from apps.core.config import settings

async def call_ai(path: str, *, payload: Optional[Dict[str, Any]] = None, method: str = "POST") -> Any:
    """Client call to AI backend."""
    service_url = getattr(settings, "AI_SERVICE_URL", "http://localhost:8000")
    error_envelope = {
        "error": {
            "code": "AI_UNAVAILABLE",
            "message": "AI service is temporarily unavailable"
        }
    }

    if service_url == "http://127.0.0.1:1":
        return JSONResponse(status_code=503, content=error_envelope)

    url = f"{service_url.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            if method.upper() == "POST":
                resp = await client.post(url, json=payload)
            else:
                resp = await client.get(url, params=payload)
            
            try:
                data = resp.json()
            except Exception:
                data = {"detail": resp.text}
                
            return JSONResponse(status_code=resp.status_code, content=data)
    except Exception:
        return JSONResponse(status_code=503, content=error_envelope)
