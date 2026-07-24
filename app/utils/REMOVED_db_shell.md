# REMOVED: app/utils/db_shell.py  (PURGED in Phase 4)

This directory previously contained `db_shell.py`, which exposed
`execute_psql_cmd()` — a wrapper around:

    subprocess.run(["docker", "exec", "<timeseries_container>", "psql", "-c", <raw_sql>], ...)

## Why it was purged

| Risk | Detail |
|------|--------|
| Process-fork overhead | A fresh `docker exec` + `psql` process per request → 100 ms+ latency, kernel context switches, thread exhaustion under industrial load. |
| SQL injection | Raw SQL strings assembled from client-supplied time bounds / asset ids allowed malicious escape sequences. |
| Container-boundary violation | Assumed local `docker.sock` access from the app container — breaks Kubernetes / AWS ECS / GCP Cloud Run. |
| No connection pooling | Bypassed SQLAlchemy's `QueuePool`, risking DB connection-limit exhaustion. |

## What replaced it

All telemetry data access now flows through a pooled, parameterized async ORM path:

    app/api/v1/telemetry.py  ->  app/services/telemetry_service.py
        ->  app/repositories/telemetry_repository.py  ->  app/core/database.py (AsyncEngine)

Guarantees enforced by static review of the new tree:
- `subprocess` / `os.system` / `docker exec` occurrences in telemetry paths: **0**
- Raw, unparameterized SQL strings in telemetry paths: **0**

> DO NOT reintroduce shell-based database execution. Use `TelemetryRepository`.
