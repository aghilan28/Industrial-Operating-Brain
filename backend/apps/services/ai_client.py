"""AI Client service module."""
from typing import Any, Dict, Optional
import httpx
from apps.core.config import settings

async def call_ai(path: str, *, payload: Optional[Dict[str, Any]] = None, method: str = "POST") -> Dict[str, Any]:
    """Client call to AI backend."""
    service_url = getattr(settings, "AI_SERVICE_URL", "http://localhost:8000")
    error_envelope = {
        "error": {
            "code": "AI_UNAVAILABLE",
            "message": "AI service is temporarily unavailable"
        }
    }
    
    if service_url == "http://127.0.0.1:1":
        return error_envelope

    url = f"{service_url.rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient() as client:
            if method.upper() == "POST":
                resp = await client.post(url, json=payload)
            else:
                resp = await client.get(url, params=payload)
            return resp.json()
    except Exception:
        return error_envelope
