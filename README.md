# Industrial Operating Brain (IOB)

Official production repository for the India Innovates hackathon submission at Bharat Mandapam, New Delhi.
An end-to-end industrial operating brain integrating real-time IoT telemetry pipelines, GraphRAG knowledge graphs, predictive maintenance digital twins, and a high-performance industrial control dashboard.

## Monorepo Architecture

- **backend/** — FastAPI platform, PostgreSQL persistence, RBAC, API Gateway, and MQTT IoT ingestion pipeline.
- **ai-platform/** — GraphRAG, Knowledge Graph engine, computer vision pipelines (YOLO11 / RT-DETR), and predictive maintenance digital twins.
- **frontend/** — Next.js, React, and Tailwind CSS industrial monitoring dashboard.
- **docker/** — Orchestration configurations, container definitions, and deployment overlays.
- **docs/** — Comprehensive engineering specifications, integration notes, and audit trails.
- **scripts/** — Operational automation scripts and smoke test verification suites.

## Execution
Refer to individual module documentation within the respective subdirectories for local development and build procedures.