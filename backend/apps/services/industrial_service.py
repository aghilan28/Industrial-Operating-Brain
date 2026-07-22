"""
Industrial service compatibility bridge.
"""
from typing import Any, Dict, List, Optional

class IndustrialService:
    def __init__(self, **kwargs: Any) -> None:
        self.machine_repo = kwargs.get('machine_repo')
        self.telemetry_repo = kwargs.get('telemetry_repo')
        self.alarm_repo = kwargs.get('alarm_repo')
        self.metadata_repo = kwargs.get('metadata_repo')
    async def list_alerts(self, severity: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        return []

    async def acknowledge_alert(self, request: Any, user: Any) -> Dict[str, Any]:
        return {"status": "acknowledged", "alarm_id": str(getattr(request, "alarm_id", ""))}

    async def resolve_alert(self, request: Any, user: Any) -> Dict[str, Any]:
        return {"status": "resolved", "alarm_id": str(getattr(request, "alarm_id", ""))}


    async def get_all_machines(self, limit: int = 100, offset: int = 0):
        if hasattr(self, 'get_assets'):
            return await self.get_assets(limit=limit, offset=offset)
        return []

    async def get_machine_telemetry_flow(self, asset_id: str):
        if hasattr(self, 'get_asset_by_id'):
            return await self.get_asset_by_id(asset_id)
        return {}

    async def get_all_machines(self, limit: int = 100, offset: int = 0):
        if hasattr(self, 'get_assets'):
            return await self.get_assets(limit=limit, offset=offset)
        return []

    async def get_machine_telemetry_flow(self, asset_id: str):
        if hasattr(self, 'get_asset_by_id'):
            return await self.get_asset_by_id(asset_id)
        return {}

    async def get_all_machines(self, limit: int = 100, offset: int = 0):
        if hasattr(self, 'get_assets'):
            return await self.get_assets(limit=limit, offset=offset)
        return []

    async def get_machine_telemetry_flow(self, asset_id: str):
        if hasattr(self, 'get_asset_by_id'):
            return await self.get_asset_by_id(asset_id)
        return {}
