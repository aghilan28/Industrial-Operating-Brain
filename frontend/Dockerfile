# syntax=docker/dockerfile:1.7
# =============================================================================
# IOB PHASE 7 — Frontend (Next.js 15 SSR)
# frontend/Dockerfile
# =============================================================================
# This stays an SSR node server (npm start on :3000). It is intentionally NOT
# an nginx static-bundle image: middleware.ts (auth route guarding), server
# components and the /api rewrite proxy all require a running Node runtime.
# Host ingress is terminated by the separate `edge` nginx container.
#
# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time, so they
# must arrive as build args (runtime `environment:` entries are too late).
# =============================================================================
FROM node:20-alpine AS base

# ---- Dependencies -----------------------------------------------------------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Build ------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public API origin baked into the browser bundle.
# Empty string => clients emit RELATIVE URLs (/api/v1/...), which the edge proxy
# routes to backend:8000. This keeps the browser on a single origin (no CORS
# preflight) and lets the same image serve http://localhost and any real domain.
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_API_BASE_URL=""
# Empty => StreamProvider/TelemetryProvider derive ws(s)://<host>/api/v1/...
# from window.location, upgrading to wss automatically behind TLS.
ARG NEXT_PUBLIC_WS_URL=""
ARG NEXT_PUBLIC_APP_ENV="production"

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Runner -----------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
# next.config.mjs is required at runtime for the server-side /api rewrite.
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs
EXPOSE 3000

# busybox wget — node:20-alpine has no curl.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["npm", "start"]
