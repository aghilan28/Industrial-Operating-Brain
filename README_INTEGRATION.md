# Phase 4 — Telemetry Pipeline Rebuild & Layered Architecture

Worked files for the **Industrial Operating Brain** repo
(`github.com/aghilan28/Industrial-Operating-Brain`). This bundle removes all
`subprocess` / `docker exec psql` telemetry access and replaces it with a clean,
pooled, parameterized, layered pipeline that integrates with your existing
`ApiResponse[T]` / `PaginatedResponse[T]` envelopes, `AppException` hierarchy,
and bearer-token auth.

---

## 1. What's in the bundle (paths mirror the repo root)

```
phase4_telemetry_pipeline/
├── app/
│   ├── api/v1/telemetry.py              ← REWRITTEN router  (plan: app/routers/telemetry.py)
│   ├── core/auth.py                     ← NEW  get_current_user dependency
│   ├── core/database.py                 ← NEW  async engine, pooled get_db, init_db
│   ├── core/exceptions.py               ← UNCHANGED (included so bundle is self-contained)
│   ├── middleware/exception_handler.py  ← UNCHANGED (included so bundle is self-contained)
│   ├── models/__init__.py               ← NEW
│   ├── models/telemetry.py              ← NEW/MODIFIED ORM model + composite index
│   ├── repositories/__init__.py         ← NEW
│   ├── repositories/telemetry_repository.py  ← NEW  (plan: create new repository)
│   ├── schemas/common.py                ← MODIFIED  PaginatedResponse.size le 100→500
│   ├── schemas/telemetry.py             ← NEW/UPGRADED  Pydantic v2 contracts
│   ├── services/__init__.py             ← NEW
│   ├── services/telemetry_service.py    ← REFACTORED to clean service layer
│   └── utils/
│       ├── __init__.py                  ← NEW
│       └── REMOVED_db_shell.md          ← PURGE evidence for app/utils/db_shell.py
├── reference/
│   ├── register_telemetry_snippet.py    ← drop-in wiring for app/api/v1/router.py
│   └── router.example.py                ← full reference aggregator
├── requirements-phase4.txt              ← dependencies
├── validate_phase4.py                   ← executable proof (runs all test cases)
└── README_INTEGRATION.md                ← this file
```

> **Deleted:** `app/utils/db_shell.py` (the `execute_psql_cmd()` → `subprocess.run(["docker","exec",...])`
> wrapper). It does not exist in the new tree; `REMOVED_db_shell.md` documents the purge.

---

## 2. Architecture (as implemented)

```
FastAPI Router (app/api/v1/telemetry.py)            HTTP parsing + DI
   └─ TelemetryService (app/services/...)           validation + transforms
        └─ TelemetryRepository (app/repositories/...)  SQLAlchemy async, parameterized
             └─ AsyncEngine pool (app/core/database.py) → PostgreSQL/TimescaleDB (sqlite in dev)
```

Every response is wrapped in `ApiResponse[T]` / `PaginatedResponse[T]`. Domain
errors raise `ResourceNotFoundException` / `ValidationException`, rendered by
your existing global handler into standardized envelopes.

### Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/assets/{asset_id}/telemetry/latest` | Most recent frame |
| GET | `/api/v1/assets/{asset_id}/telemetry` | Paginated/filtered time-series |

Query params (history): `page≥1`, `size∈[1,500]`, `start_time`, `end_time`
(ISO-8601), `sensor_channel`, `order∈{asc,desc}`.

---

## 3. Integration steps (into your repo)

1. **Copy the `app/` tree** from this bundle into the repo root, merging into
   your existing `app/` package. New subpackages (`models/`, `repositories/`,
   `services/`, `utils/`) are additive.
   - `app/schemas/common.py` — the only change is `PaginatedResponse.size`
     `le=100 → le=500` (backward-compatible; all existing endpoints pass ≤100).
   - `app/core/exceptions.py` and `app/middleware/exception_handler.py` are
     byte-identical to your repo — copying is a no-op (included only so the
     bundle runs standalone).

2. **Register the router** — add the drop-in snippet
   (`reference/register_telemetry_snippet.py`) to your `app/api/v1/router.py`.

3. **Install deps**: `pip install -r requirements-phase4.txt`
   - Dev/CI default engine is `sqlite+aiosqlite` (zero external services).
   - For production, set `DATABASE_URL` to a Postgres/TimescaleDB async DSN, e.g.
     `postgresql+asyncpg://iob:iob@timescaledb:5432/iob_telemetry`.

4. **Create tables** on startup (idempotent):
   ```python
   from app.core.database import init_db
   @app.on_event("startup")
   async def _init(): await init_db()
   ```

---

## 4. Verify it executes

```bash
cd phase4_telemetry_pipeline
pip install -r requirements-phase4.txt
python validate_phase4.py
```

Expected output: **ALL TESTS PASSED ✅** covering the plan's matrix —

| # | Test | Input | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Get Latest Reading | `asset_id="AST-9021"` | `200 OK` + envelope | PASS |
| 2 | Invalid Time Bounds | `start=10:00, end=09:00` | `422` VALIDATION_ERROR | PASS |
| 3 | Non-Existent Asset | `asset_id="INVALID-ID"` | `404` RESOURCE_NOT_FOUND | PASS |
| 4 | High Page Size | `size=1000` | `422` (le=500) | PASS |
| 5 | Valid History | `size=500, order=asc` | `200`, 120-pt series | PASS |
| 6 | Missing Auth | (no header) | `401` UNAUTHORIZED | PASS |
| 7 | Time-window filter | `08:00–08:09` | `200`, 10 points | PASS |

---

## 5. Engineering notes / deviations (made so it truly runs & integrates)

| Plan draft | Repo reality | Resolution applied |
|------------|--------------|--------------------|
| Router at `app/routers/telemetry.py` with prefix `/api/v1/assets` | Repo convention is `app/api/v1/` with **relative** prefixes; aggregator already mounts at `/api/v1` | Router placed at `app/api/v1/telemetry.py`, prefix `/assets`, so public path is `/api/v1/assets/{id}/telemetry` (no doubled prefix). |
| `from app.core.database import get_db`, `from app.core.auth import get_current_user` | Neither existed; platform is otherwise in-memory | Created both. `database.py` defaults to async SQLite (env-overridable to Postgres/TimescaleDB) so it executes with no external DB; `auth.py` mirrors the existing bearer-token scheme. |
| `from typing import Optional, dict` in schemas | `dict` is a builtin, not a `typing` export (would ImportError) | Fixed — uses PEP 585 builtin generics (`dict[...]`, `list[...]`). |
| `Query(order=..., regex=...)` | `regex=` removed in Pydantic v2 / modern FastAPI | Uses `pattern=` (also used in the schema). |
| `PaginatedResponse.size` up to 500 | Shared envelope capped `le=100` → runtime `ValidationError` at size>100 | Widened shared cap `100→500` (backward-compatible) so the plan's 500-point pages validate. |
| ORM model named `TelemetryReading` | `ai-platform/app/models/telemetry.py` already defines a **Pydantic ingest** `TelemetryReading` (frozen edge contract) | Kept separate: the ORM persistence model lives in the REST `app` package (`app/models/telemetry.py`); the frozen ingest contract is untouched. |

---

## 6. Risk mitigations (per plan)

- **Write/read contention:** repository reads run on the pooled async engine;
  point `DATABASE_URL` read workers at a read-replica in production.
- **Unbounded ranges:** `size` hard-capped at 500 (schema + Query), mandatory
  `LIMIT` in the repository; pagination metadata (`total`/`pages`) always returned.
- **Security:** 100% parameterized queries; zero shell execution; bearer-token
  guard on every telemetry endpoint.
"""
