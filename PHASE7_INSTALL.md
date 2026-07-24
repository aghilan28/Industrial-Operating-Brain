# Phase 7 — Enterprise Infrastructure Orchestration & Container Stabilization

Worked-files package for **Industrial-Operating-Brain**, reconciled against the
actual repository at `github.com/aghilan28/Industrial-Operating-Brain`.

---

## 1. Install

Unzip at the **repository root** (the folder holding `docker-compose.yml`):

```bash
unzip iob_phase7_infrastructure.zip -d /path/to/Industrial-Operating-Brain
cd /path/to/Industrial-Operating-Brain

cp .env.example .env          # then edit secrets
docker compose config          # sanity-check interpolation
docker compose up -d --build
bash scripts/phase7_verify.sh  # 9-section verification
```

Open **http://localhost** (port 80, the edge proxy — not `:3000`).

### File map

| File | Action | Notes |
|---|---|---|
| `docker-compose.yml` | **REPLACE** | Full 3-tier refactor. Back up your original first. |
| `docker-compose.prod.yml` | NEW | Overlay for total data-tier isolation. |
| `.env.example` | NEW | Every compose variable, documented. |
| `infrastructure/nginx/nginx.conf` | NEW | Edge proxy + WebSocket upgrade. |
| `infrastructure/nginx/Dockerfile` | NEW | Edge image. |
| `infrastructure/mqtt/mosquitto.conf` | NEW | Adds `sys_interval` for the health probe. |
| `frontend/Dockerfile` | **REPLACE** | Adds `NEXT_PUBLIC_*` build args + healthcheck. |
| `frontend/next.config.mjs` | **REPLACE** | Fixes the hardcoded-loopback rewrite. |
| `scripts/phase7_verify.sh` | NEW | Runtime verification. |

Untouched: `backend/Dockerfile`, `ai-platform/Dockerfile`, all application source.

---

## 2. Where the plan met reality

The Phase 7 spec was written against an assumed layout. Applying it verbatim
would have broken the stack. Deviations, and why:

| Spec said | Repo actually is | Resolution |
|---|---|---|
| `./ai_platform/` | `./ai-platform/` (hyphen) | Used the real path. |
| backend context `.` + root `Dockerfile` | `./backend/Dockerfile` | Used the real path. |
| Frontend = Nginx + React static bundle on `:80` | **Next.js 15 SSR**, `npm start`, `:3000`, with `middleware.ts` auth guards and server components | Kept Next.js as an SSR container; added a **separate `edge` nginx service** for :80 ingress and WS proxying. A static bundle would have silently disabled route protection. |
| Service `mqtt` | Service `mosquitto` | Kept `mosquitto` — `backend/apps/services/mqtt_bridge.py` resolves that alias. |
| `POSTGRES_HOST` / `REDIS_HOST` / `MQTT_HOST` | Code reads `DATABASE_URL`, `REDIS_URL`, `MQTT_BROKER_HOST`, `AI_SERVICE_URL` | Emitted the names the code reads (both sets, for safety). **No source changes.** |
| ai-platform on `:8001`, `curl` health probe | Listens on **`:8000`**; base image `python:3.11-slim` has **no curl** | Internal `:8000` (published to `127.0.0.1:8001`); probe via `python -c urllib`. |
| `timescale/timescaledb:pg15` | `postgres:16-alpine` + two init-SQL mounts | Kept pg16 (your choice) — pg15 is a downgrade that breaks the existing volume. Init mounts preserved. |
| Qdrant `curl /readyz` | Qdrant image has no curl **or** wget | Bash `/dev/tcp` TCP probe. |
| `NEO4J_dbms_memory_heap_*` | Neo4j 5 **removed** `dbms.memory.*` | `NEO4J_server_memory_heap_*` (5.x namespace). The spec's keys are silently ignored → OOM risk remains. |
| `iob-data-net: internal: true` | Incompatible with loopback debug ports | Base file = bridge + `127.0.0.1` binds; `docker-compose.prod.yml` = true `internal`. |

---

## 3. Real defects found and fixed

1. **Hardcoded loopback (the actual bug).** `frontend/next.config.mjs` rewrote
   `/api/*` to `http://localhost:8000`, which inside the container resolves to
   the *frontend's own* namespace → every proxied API call `ECONNREFUSED`.
   Now `BACKEND_INTERNAL_URL` → `http://backend:8000`.

2. **Next.js rewrites cannot proxy WebSockets.** Even fixed, the rewrite would
   never have carried `/api/v1/ws`. This is why the `edge` nginx tier exists.

3. **Env-name mismatch.** Compose set `MQTT_HOST` / `REDIS_HOST`; the backend
   reads `MQTT_BROKER_HOST` / `REDIS_URL`. Values were being **silently
   ignored**, falling back to `localhost` defaults.

4. **`mosquitto` had no healthcheck** and no config mount (Mosquitto 2.x denies
   anonymous connections by default). Gating `backend` on it without
   `sys_interval > 0` would have hung the probe forever.

5. **Redis had no auth and no AOF** — cache wiped on every restart.

6. **Qdrant client/server drift.** `qdrant/qdrant:latest` vs pinned
   `qdrant-client==1.11.3`. Now pinned to `v1.11.3`.

7. **Two real WS contracts, not one.** `backend/apps/api/ws.py` exposes *both*
   `/api/v1/ws/telemetry/{client_id}` **and** legacy `/api/v1/stream`. The
   proxy handles both; `= /api/v1/stream` is an exact match so that
   `/api/v1/stream/health` still routes as ordinary REST.

---

## 4. Verified routing

Location matching simulated against the parsed config (nginx longest-prefix rules):

| Request | Matched block | Upstream | WS upgrade |
|---|---|---|---|
| `/api/v1/ws/telemetry/CLI-1` | `/api/v1/ws/` | backend:8000 | **YES** |
| `/api/v1/stream` | `= /api/v1/stream` | backend:8000 | **YES** |
| `/api/v1/stream/health` | `/api/` | backend:8000 | no (correct) |
| `/api/v1/auth/login` | `/api/` | backend:8000 | no |
| `/dashboard`, `/login` | `/` | frontend:3000 | yes (RSC/HMR) |
| `/_next/static/*` | `/_next/static/` | frontend:3000 | no (cached) |

Startup waves (health-gated, cycle-free):

```
Wave 1: postgres, redis, mosquitto, neo4j, qdrant
Wave 2: ai-platform      (gated on neo4j+qdrant+redis healthy)
Wave 3: backend          (gated on postgres+redis+mosquitto+ai-platform healthy)
Wave 4: frontend         (gated on backend healthy)
Wave 5: edge             (gated on frontend+backend healthy)
```

---

## 5. Before going to production

- **`SECRET_KEY`** — must be ≥32 chars and not the default. Generate with
  `openssl rand -hex 32`.
- **`BACKEND_ENV=production`** activates
  `Settings.validate_production_boundaries()`, which **raises at startup**
  unless `SECRET_KEY`, `MQTT_PASSWORD` **and** `DATABASE_URL` are all explicitly
  set. `MQTT_PASSWORD` is blank in `.env.example` — set it, and switch
  `mosquitto.conf` to `allow_anonymous false` with a `password_file`.
- **`AI_APP_ENV=production`** makes `InternalOnlyGuardMiddleware` enforce
  `X-Internal-Service-Token`. Set a real `INTERNAL_SERVICE_TOKEN` (it currently
  defaults to `development`, which the guard treats as a dev bypass).
- Change `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `NEO4J_PASSWORD`/`NEO4J_AUTH`
  (keep those two in sync — the healthcheck authenticates with them).
- Apply the isolation overlay:
  `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
- Add TLS: terminate 443 at the edge; the `$connection_upgrade` map already
  handles `wss://`, and the frontend derives `wss:` from `window.location`.

### Resource sizing

`deploy.resources.limits` totals **14 GB** across 9 containers. Under
`docker compose up` (non-Swarm) these are enforced as hard `--memory` caps.
On a host with less RAM, lower `neo4j`, `qdrant` and `ai-platform` first —
and keep `NEO4J_HEAP_MAX` + `NEO4J_PAGECACHE` comfortably **below** the neo4j
container limit, or the JVM will be OOM-killed.

> `deploy.resources.limits` is honoured by Compose v2 for memory/CPU; the
> `cpus` value maps to a CPU quota. Swarm-only keys are not used here.

---

## 6. Verification performed

Docker was not available in the authoring environment, so the package was
validated statically rather than by a live `docker compose up`:

- **113/113** static checks pass (`validate_phase7.py`) — build contexts, bind
  sources, health-gate integrity, network/volume declarations, port-exposure
  policy, env-name alignment against the real `config.py` files, probe tooling
  availability per base image, and health paths cross-checked against
  `backend/apps/core/health.py` and the ai-platform guard allowlist.
- **nginx config parsed with `crossplane`** (the official nginx config parser)
  in its real `http{}` include context → `status: ok`.
- **Location matching simulated** per nginx precedence rules (table above).
- **Dependency graph** proven acyclic with deterministic start waves.

`scripts/phase7_verify.sh` performs the live half (container health, DNS
resolution, TCP reachability, HTTP/WS status codes, AOF state) once you run it
against a real daemon.
