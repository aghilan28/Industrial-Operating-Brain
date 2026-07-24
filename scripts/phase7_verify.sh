#!/usr/bin/env bash
# =============================================================================
# IOB PHASE 7 — Deployment verification
# Usage:  bash scripts/phase7_verify.sh
# Run from the repository root, after: docker compose up -d --build
# =============================================================================
set -uo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YEL='\033[0;33m'; NC='\033[0m'
PASS=0; FAIL=0

ok()   { echo -e "  ${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
bad()  { echo -e "  ${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YEL}[WARN]${NC} $1"; }
hdr()  { echo; echo "════════════════════════════════════════════════════════════════"; echo " $1"; echo "════════════════════════════════════════════════════════════════"; }

EDGE_PORT="${EDGE_HTTP_PORT:-80}"

# -----------------------------------------------------------------------------
hdr "1. Compose file validity"
if docker compose config >/dev/null 2>&1; then
  ok "docker-compose.yml parses and interpolates cleanly"
else
  bad "docker compose config failed:"
  docker compose config 2>&1 | tail -20
  echo; echo "Aborting — fix the compose file before continuing."; exit 1
fi

# -----------------------------------------------------------------------------
hdr "2. Required files present"
for f in \
  docker-compose.yml \
  .env \
  infrastructure/nginx/nginx.conf \
  infrastructure/nginx/Dockerfile \
  infrastructure/mqtt/mosquitto.conf \
  frontend/Dockerfile \
  frontend/next.config.mjs \
  backend/Dockerfile \
  backend/database/iob_core_schema.sql \
  backend/database/seed_users.sql \
  ai-platform/Dockerfile
do
  [ -f "$f" ] && ok "$f" || bad "$f is MISSING"
done

# -----------------------------------------------------------------------------
hdr "3. Container health status"
SERVICES="postgres redis mosquitto neo4j qdrant ai-platform backend frontend edge"
for svc in $SERVICES; do
  cid=$(docker compose ps -q "$svc" 2>/dev/null)
  if [ -z "$cid" ]; then bad "$svc — not running"; continue; fi
  state=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null)
  health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null)
  if [ "$health" = "healthy" ]; then ok "$svc — running & HEALTHY"
  elif [ "$health" = "none" ] && [ "$state" = "running" ]; then warn "$svc — running (no healthcheck)"
  else bad "$svc — state=$state health=$health"; fi
done

# -----------------------------------------------------------------------------
hdr "4. Network segmentation"
for net in iob-public-net iob-app-net iob-data-net; do
  docker network inspect "$net" >/dev/null 2>&1 && ok "network $net exists" || bad "network $net missing"
done
# The data tier must NOT be attached to the public network.
for svc in postgres redis neo4j qdrant; do
  cid=$(docker compose ps -q "$svc" 2>/dev/null)
  [ -z "$cid" ] && continue
  if docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$cid" | grep -q "iob-public-net"; then
    bad "$svc is attached to iob-public-net (isolation violated)"
  else
    ok "$svc is isolated from iob-public-net"
  fi
done

# -----------------------------------------------------------------------------
hdr "5. Internal DNS resolution (service aliases)"
check_dns () { # svc target
  if docker compose exec -T "$1" sh -c "getent hosts $2 >/dev/null 2>&1"; then
    ok "$1 resolves '$2'"
  else
    bad "$1 CANNOT resolve '$2'"
  fi
}
check_dns backend postgres
check_dns backend redis
check_dns backend mosquitto
check_dns backend ai-platform
check_dns ai-platform qdrant
check_dns ai-platform neo4j
check_dns edge backend
check_dns edge frontend

# -----------------------------------------------------------------------------
hdr "6. Datastore reachability from the app tier"
if docker compose exec -T backend python -c "
import socket,sys
for host,port in [('postgres',5432),('redis',6379),('mosquitto',1883),('ai-platform',8000)]:
    s=socket.socket(); s.settimeout(5)
    try: s.connect((host,port)); print('  reachable:',host,port)
    except Exception as e: print('  UNREACHABLE:',host,port,e); sys.exit(1)
    finally: s.close()
" 2>/dev/null; then ok "backend can open TCP to postgres/redis/mosquitto/ai-platform"
else bad "backend failed to reach one or more dependencies"; fi

if docker compose exec -T ai-platform python -c "
import socket,sys
for host,port in [('qdrant',6333),('neo4j',7687),('redis',6379)]:
    s=socket.socket(); s.settimeout(5)
    try: s.connect((host,port)); print('  reachable:',host,port)
    except Exception as e: print('  UNREACHABLE:',host,port,e); sys.exit(1)
    finally: s.close()
" 2>/dev/null; then ok "ai-platform can open TCP to qdrant/neo4j/redis"
else bad "ai-platform failed to reach one or more dependencies"; fi

# -----------------------------------------------------------------------------
hdr "7. HTTP routing through the edge proxy"
code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${EDGE_PORT}/edge-health" 2>/dev/null)
[ "$code" = "200" ] && ok "edge /edge-health -> 200" || bad "edge /edge-health -> $code"

code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${EDGE_PORT}/api/v1/health/live" 2>/dev/null)
[ "$code" = "200" ] && ok "edge -> backend /api/v1/health/live -> 200" || bad "backend health via edge -> $code"

code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${EDGE_PORT}/" 2>/dev/null)
[ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "302" ] \
  && ok "edge -> frontend / -> $code" || bad "frontend via edge -> $code"

# ai-platform health (direct, loopback-published)
code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${AI_PLATFORM_HOST_PORT:-8001}/health" 2>/dev/null)
[ "$code" = "200" ] && ok "ai-platform /health -> 200" || warn "ai-platform /health -> $code (removed by prod overlay)"

# -----------------------------------------------------------------------------
hdr "8. WebSocket upgrade pass-through"
# Expect 101 (upgraded) or 401/403 (proxy worked, auth rejected) — NOT 404/502.
ws_code=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  "http://localhost:${EDGE_PORT}/api/v1/ws/telemetry/CLI-1" 2>/dev/null)
case "$ws_code" in
  101) ok "/api/v1/ws/telemetry/CLI-1 upgraded (101)" ;;
  401|403) ok "/api/v1/ws/... reached backend, auth rejected ($ws_code) — proxy OK" ;;
  502|504) bad "/api/v1/ws/... -> $ws_code (backend unreachable from edge)" ;;
  404) bad "/api/v1/ws/... -> 404 (nginx did not match the ws location)" ;;
  *) warn "/api/v1/ws/... -> $ws_code" ;;
esac

ws_code=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  "http://localhost:${EDGE_PORT}/api/v1/stream" 2>/dev/null)
case "$ws_code" in
  101) ok "/api/v1/stream upgraded (101)" ;;
  401|403) ok "/api/v1/stream reached backend, auth rejected ($ws_code) — proxy OK" ;;
  *) warn "/api/v1/stream -> $ws_code" ;;
esac

# -----------------------------------------------------------------------------
hdr "9. Persistence — named volumes bound"
for v in iob_postgres_data iob_redis_data iob_mqtt_data iob_neo4j_data iob_qdrant_data; do
  docker volume inspect "$(docker compose ls -q >/dev/null 2>&1; echo "$v")" >/dev/null 2>&1 \
    && ok "volume $v exists" \
    || docker volume ls --format '{{.Name}}' | grep -q "$v" \
    && ok "volume $v exists" || bad "volume $v missing"
done

# Redis AOF actually enabled?
if docker compose exec -T redis sh -c 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli config get appendonly' 2>/dev/null | grep -q yes; then
  ok "redis AOF persistence enabled"
else
  bad "redis AOF persistence NOT enabled"
fi

# -----------------------------------------------------------------------------
hdr "RESULT"
echo "  Passed: $PASS    Failed: $FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}Phase 7 infrastructure verification COMPLETE.${NC}"; exit 0
else
  echo -e "  ${RED}$FAIL check(s) failed — inspect with: docker compose logs <service>${NC}"; exit 1
fi
