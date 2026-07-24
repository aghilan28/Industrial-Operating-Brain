# =============================================================================
# IOB PHASE 7 — Edge reverse proxy image
# infrastructure/nginx/Dockerfile
# =============================================================================
# Pure routing tier. Holds no application code: the Next.js SSR server and the
# FastAPI backend are separate containers reached over iob-app-net.
# =============================================================================
FROM nginx:1.27-alpine

# curl backs the compose healthcheck (the base image ships wget only).
RUN apk add --no-cache curl

# Replace the stock default server block with the IOB edge configuration.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fail the build early if the configuration is syntactically invalid.
# Upstream DNS names are unresolvable at build time, so only parse errors surface.
RUN nginx -t -c /etc/nginx/nginx.conf 2>&1 | grep -qi "syntax is ok" \
    || (echo "nginx configuration syntax error" && nginx -t && exit 1)

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD curl -fsS http://127.0.0.1:80/edge-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
