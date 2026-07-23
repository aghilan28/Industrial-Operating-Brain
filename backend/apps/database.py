from apps.core.database.engine import engine, SyncSessionLocal as SessionLocal, Base

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

__all__ = ["engine", "SessionLocal", "Base", "get_db"]
