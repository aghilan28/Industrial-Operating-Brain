"""
Phase 4 — Async Database Engine & Session Management.

PURPOSE
  Replaces the legacy `app/utils/db_shell.py` which forked
  `subprocess.run(["docker", "exec", ... "psql", ...])` per request. That
  approach caused 100ms+ fork latency, SQL-injection risk and broke container
  boundaries. This module provides a single, pooled, parameterized async
  connection layer via SQLAlchemy 2.0.

CONNECTION STRATEGY
  * Reads DATABASE_URL from the environment.
  * Defaults to a local async SQLite engine (sqlite+aiosqlite) so the pipeline
    EXECUTES out-of-the-box in dev/CI with zero external services.
  * In production set DATABASE_URL to a PostgreSQL / TimescaleDB DSN, e.g.
        postgresql+asyncpg://iob:iob@timescaledb:5432/iob_telemetry
    and the identical repository code runs against the pooled cluster.

PUBLIC API
  * Base                 -- declarative base for ORM models
  * engine               -- AsyncEngine (pooled)
  * AsyncSessionLocal    -- async_sessionmaker factory
  * get_db()             -- FastAPI dependency yielding an AsyncSession
  * init_db()            -- creates all tables (idempotent)
"""
from __future__ import annotations

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase


def _resolve_database_url() -> str:
    """Resolve the async DSN. SQLite default keeps local execution dependency-free."""
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    return "sqlite+aiosqlite:///./iob_telemetry.db"


DATABASE_URL = _resolve_database_url()

# SQLite needs check_same_thread disabled for asyncio; harmless for PG.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base shared by all Phase 4 ORM models."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields a pooled AsyncSession and guarantees closure."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables registered on Base.metadata (idempotent).

    Imports the models package so their tables are registered before create_all.
    """
    # Local import registers ORM models on Base.metadata without circular imports.
    from app.models import telemetry  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
