"""
Industrial service compatibility bridge.
"""
from typing import Any, Dict, List, Optional

class IndustrialService:
    async def list_alerts(self, severity: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        return []

    async def acknowledge_alert(self, request: Any, user: Any) -> Dict[str, Any]:
        return {"status": "acknowledged", "alarm_id": str(getattr(request, "alarm_id", ""))}

    async def resolve_alert(self, request: Any, user: Any) -> Dict[str, Any]:
        return {"status": "resolved", "alarm_id": str(getattr(request, "alarm_id", ""))}
