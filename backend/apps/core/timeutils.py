"""Time utilities compatibility module."""
from datetime import datetime, timezone

def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
