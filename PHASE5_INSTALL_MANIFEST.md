# Phase 5 — Real-Time Streaming Architecture & Subsystem Rebuild
## Worked Files Manifest & Installation Guide

Repository: `aghilan28/Industrial-Operating-Brain`
Target branch: `main`
Package layout mirrors the repository root — extract over your clone and the
files land in their correct locations.

---

## 0. IMPORTANT — Path Reconciliation

The Phase 5 design document referenced a `app/…` layout
(`app/routers/websocket.py`, `app/core/connection_manager.py`, …).
**That layout does not exist in this repository.** The live FastAPI backend is:

| Design document path | **Actual repository path** |
|---|---|
| `app/main.py` | `backend/apps/main.py` |
| `app/routers/websocket.py` | `backend/apps/api/ws.py` |
| `app/core/connection_manager.py` | `backend/apps/core/connection_manager.py` |
| `app/services/mqtt_bridge.py` | `backend/apps/services/mqtt_bridge.py` |
| `app/schemas/streaming.py` | `backend/apps/schemas/streaming.py` |
| `app/services/stream_dispatcher.py` | `backend/apps/services/stream_dispatcher.py` |
| `frontend/src/providers/StreamProvider.tsx` | `frontend/src/providers/StreamProvider.tsx` ✔ |

The root-level `app/` package is the **separate AI-platform microservice**
(`app.main` = "IOB AI Intelligence Platform", port 8002) and is intentionally
untouched. All streaming work targets `backend/apps/` — the module that
`docker-compose.yml` builds as the `backend` service on port 8000, and whose
imports are rooted at `apps.*`.

---

## 1. Files In This Package (12)

### New files (6)

| # | Path | Purpose |
|---|---|---|
| 1 | `backend/apps/schemas/streaming.py` | Versioned `StreamEventEnvelope` + `StreamControlCommand`. |
| 2 | `backend/apps/core/connection_manager.py` | Lock-safe connection & subscription registry. |
| 3 | `backend/apps/services/stream_dispatcher.py` | Central pub/sub routing layer. |
| 4 | `backend/apps/mqtt_bridge.py` | Compatibility shim re-exporting the bridge singleton. |
| 5 | `frontend/src/providers/StreamProvider.tsx` | React context: state machine + backoff reconnect. |
| 6 | `frontend/src/components/telemetry/StreamStatusBadge.tsx` | Connection-state UI badge. |

### Modified files (6)

| # | Path | Change |
|---|---|---|
| 7 | `backend/apps/api/ws.py` | Full rewrite: real `APIRouter`, heartbeat, subscriptions. |
| 8 | `backend/apps/services/mqtt_bridge.py` | Full rewrite: async supervised consumer + backoff. |
| 9 | `backend/apps/main.py` | Registers `ws_router`; adds lifespan; stream health endpoint. |
| 10 | `backend/requirements.txt` | Documents `gmqtt` as the Phase 5 async MQTT client. |
| 11 | `frontend/src/app/(dashboard)/layout.tsx` | Mounts `StreamProvider`. |
| 12 | `frontend/.env.example` | Documents `NEXT_PUBLIC_WS_URL`. |

`_diffs/modified_files.patch` contains the unified diff for the 6 modified files.

---

## 2. Installation

```bash
# from your repository root
unzip phase5-realtime-streaming.zip
cp -r phase5-realtime-streaming/backend  ./
cp -r phase5-realtime-streaming/frontend ./

# backend deps (gmqtt was already declared; this makes it explicit)
cd backend && pip install -r requirements.txt
```

No database migration and no frontend package installs are required.

### Verify

```bash
cd backend
pytest tests/test_stage2_realtime.py tests/test_phase5_end_to_end_validation.py -q
# expected: 6 passed

uvicorn apps.main:app --host 0.0.0.0 --port 8000
curl http://localhost:8000/api/v1/stream/health
```

---

## 3. Published Endpoints

| Endpoint | Purpose |
|---|---|
| `WS /api/v1/stream?token=<jwt>` | Legacy transport. Frame contract preserved byte-for-byte. |
| `WS /api/v1/ws/telemetry/{client_id}?token=<jwt>` | Phase 5 versioned envelope transport. |
| `GET /api/v1/stream/health` | Connections, dispatcher counters, ingestion stats. |

### Control frames (client → server)

```jsonc
{"action": "subscribe",   "asset_id": "PUMP-7"}
{"action": "unsubscribe", "asset_id": "PUMP-7"}
{"action": "ping", "ts": 1730000000}
"ping"                                  // legacy bare heartbeat, still supported
{"type": "ping", "ts": 12345}           // legacy JSON heartbeat, still supported
```

### Telemetry envelope (server → client)

```json
{
  "version": "v1",
  "event_type": "telemetry_update",
  "timestamp": "2026-07-24T18:18:24.639955Z",
  "asset_id": "PUMP-7",
  "topic": "industrial/telemetry/PUMP-7/vibration",
  "payload": {"value": 4.21, "unit": "mm/s", "seq": 7},
  "quality": "GOOD",
  "sequence_number": 7
}
```

---

## 4. Backward Compatibility (why nothing breaks)

The rewrite was constrained by contracts asserted in the **existing test
suite**; every one is preserved:

| Existing contract | Where asserted | Status |
|---|---|---|
| `from apps.api.ws import websocket_telemetry_endpoint, manager` | `test_stage2_realtime.py` | Preserved |
| `manager.active_connections` contains raw socket objects | `test_stage2_realtime.py` | Preserved (property) |
| `await manager.broadcast(dict)` → `send_json` | `test_stage2_realtime.py` | Preserved |
| Invalid token → close code **4001**, `accept()` never called | `test_stage2_realtime.py`, `test_phase4_frontend_integration.py` | Preserved |
| `"ping"` → `{"type":"pong"}` | `test_phase4_frontend_integration.py` | Preserved |
| `{"type":"ping","ts":N}` → `{"type":"pong","ts":N}` | `test_phase4_frontend_integration.py` | Preserved |
| `from apps.services.mqtt_bridge import MQTTBridge, sensor_queue` | `test_phase5_end_to_end_validation.py` | Preserved |
| Sync `bridge.on_message(client, topic, payload, qos, props)` | `test_stage2_realtime.py` | Preserved |
| `bridge.on_connect(...)` → `subscribe("industrial/telemetry/#", qos=1)` | `test_stage2_realtime.py` | Preserved |
| Queue record shape `{"topic":…, "payload":…}` | both suites | Preserved |
| Telemetry retained when Redis is down | `test_phase5_end_to_end_validation.py` | Preserved |
| `from apps.mqtt_bridge import MQTTBridge` | `smoke_tests.py` | Fixed via shim |
| `useTelemetry()` / `TelemetryProvider` frontend surface | dashboard pages | Untouched |

`StreamProvider` is mounted **alongside** the existing `TelemetryProvider`, so
current dashboard pages keep working while new views migrate to `useStream()`.

---

## 5. Defects Fixed

| Defect | Resolution |
|---|---|
| WebSocket routes never registered in FastAPI | `app_instance.include_router(ws_router, prefix="/api/v1")`. |
| `RuntimeError: dictionary changed size during iteration` | All mutations under `asyncio.Lock`; fan-out iterates a snapshot; stale sockets pruned *after* the pass. |
| Memory leak on disconnect | `disconnect()` removes the socket and every subscription entry, collapsing empty channels. Verified: registry drains to `(0, 0)`. |
| Slow consumer stalls the event loop | Every write bounded by `asyncio.wait_for` (5 s); stalled peers pruned. Verified: 30 s stall bounded to 0.20 s. |
| No heartbeat → half-open sockets accumulate | 15 s read deadline, server ping probe, reap after 2 missed beats. |
| Broker drop breaks ingestion permanently | Supervised reconnect loop, exponential backoff + jitter (1→2→4→8→16→30 s cap). |
| Blocking MQTT callbacks on the event loop | Callback only decodes; all I/O deferred via `asyncio.ensure_future`. |
| Every client receives all plant telemetry | Per-asset subscription channels; unsubscribed assets are filtered out. |
| Unversioned raw payloads | `StreamEventEnvelope` with version, ISO-8601 UTC timestamp, quality flag, sequence number. |
| Frontend silent drops | 5-state machine (`connecting/connected/reconnecting/offline/error`) + `StreamStatusBadge`. |
| Bad MQTT payload kills the bridge | Malformed frames logged, counted, dropped; loop continues. |

---

## 6. Validation Evidence

### Regression safety (full backend suite, 232 tests)

| | Baseline (upstream `main`) | After Phase 5 |
|---|---|---|
| Failures | **41** | **32** |
| Passed | 191 | 200 |

**Newly broken by these changes: 0.**
**Newly fixed: 9** — the 4 WebSocket integration tests, 2 Phase 5 end-to-end
tests, and 3 Stage 2 real-time tests. The 32 remaining failures are
pre-existing and unrelated (repository adapters, auth fixtures, timestamp
helpers); they fail identically on a clean upstream clone.

### End-to-end against a **real MQTT broker** — 19/19 passed

Full graph exercised: broker → bridge → dispatcher → connection manager → WebSocket.

```
[PASS] Bridge connected + SUBSCRIBE sent      :: ['industrial/telemetry/#']
[PASS] END-TO-END broker -> ... -> WebSocket
[PASS] Envelope versioned v1 / asset routed / ISO-8601 Z / quality / seq preserved
[PASS] SUBSCRIPTION ISOLATION: BOILER-3 client received nothing
[PASS] Malformed payload rejected; bridge STILL ingesting
[PASS] Sensor quality flag propagated (UNCERTAIN)
[PASS] Broker down: supervisor alive (no crash)
[PASS] AUTO-RECONNECT: re-subscribed after broker restart
[PASS] RECOVERY: telemetry flowing again post-restart
```

### Concurrency & leak safety — 11/11 passed

```
[PASS] 200-client concurrent disconnect during 50 broadcasts (no RuntimeError)
[PASS] Registry fully drained after all disconnects :: (0, 0)
[PASS] Slow consumer bounded (<2s, not 30s)        :: 0.20s
[PASS] Stalled/dead consumers auto-pruned
[PASS] Exponential backoff 1->2->4->8->16->30 cap  :: [1,2,4,8,16,30,30]
[PASS] Unroutable frame (no asset_id) rejected
```

### Live server over real TCP — verified

App boots with the broker **down** and keeps serving HTTP while the supervisor
retries (`Reconnecting in 1.2s… 2.3s… 4.2s`), proving ingestion never blocks
startup. Live sockets: heartbeat round-trip, 2 tracked connections,
cross-asset isolation, and reaping to 0 on close.

### Frontend

`tsc --noEmit` under `strict: true` → **0 errors** for both new `.tsx` files.

---

## 7. Operational Notes

* **Auth.** Both sockets require a valid JWT (`?token=` or
  `Authorization: Bearer`). Invalid tokens are refused **before** `accept()`.
  Note: a Starlette `TestClient` surfaces this as close code `4001`, while a
  real browser/`websockets` client sees the handshake refused with **HTTP 403** —
  both are correct; the socket is never upgraded and no telemetry is emitted.
* **Feature flag.** Set `ENABLE_REALTIME_STREAMING=false` to disable MQTT
  ingestion (the WebSocket routes stay mounted).
* **Broker config.** Uses existing settings: `MQTT_BROKER_HOST`,
  `MQTT_BROKER_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_CLIENT_ID`.
  `docker-compose.yml` already provides `mosquitto` on `:1883`.
* **Topic → asset mapping.** `industrial/telemetry/{asset_id}/{sensor_id}`.
  Frames with no derivable `asset_id` are rejected as unroutable and counted
  in `dropped_unroutable` rather than being broadcast to everyone.
* **Redis.** The shared event bus is published to on a best-effort basis and
  imported lazily; a Redis outage degrades to local-queue-only without data loss.
* **Scaling.** The dispatcher is per-process. For multi-worker deployments,
  fan out via the existing Redis `pubsub:telemetry` channel and have each
  worker feed its local dispatcher (`register_subscriber`).
