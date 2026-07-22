# Industrial Operating Brain (IOB)

**Industrial Operating Brain (IOB)** is an Industry 5.0 enterprise intelligence platform developed for the **ET AI Hackathon 2.0**.

The platform unifies industrial IoT telemetry, AI-driven decision intelligence, GraphRAG knowledge retrieval, predictive maintenance, digital twins, and real-time operational monitoring into a single enterprise platform for smart manufacturing environments.

---

## Repository Structure

```
.
├── backend/        # FastAPI backend, PostgreSQL, Authentication, RBAC, REST APIs, MQTT ingestion
├── ai-platform/    # AI services, GraphRAG, Knowledge Graph, Predictive Analytics, Computer Vision
├── frontend/       # Next.js industrial dashboard and monitoring interface
├── docker/         # Docker configuration and deployment resources
├── docs/           # Technical documentation and architecture references
└── scripts/        # Utility scripts, automation, and validation tools
```

---

## Components

### Backend
- FastAPI
- PostgreSQL
- JWT Authentication
- Role-Based Access Control (RBAC)
- REST API Gateway
- MQTT Data Ingestion

### AI Platform
- GraphRAG Knowledge Retrieval
- Knowledge Graph Engine
- Predictive Maintenance
- Digital Twin Intelligence
- Computer Vision Pipelines
- AI Decision Support

### Frontend
- Next.js
- React
- Tailwind CSS
- Real-Time Industrial Dashboard
- Live Telemetry Visualization

---

## Technology Stack

| Layer | Technologies |
|--------|--------------|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | PostgreSQL |
| Messaging | MQTT (Mosquitto) |
| AI Services | GraphRAG, Neo4j, Qdrant, Computer Vision |
| Infrastructure | Docker, Docker Compose |

---

## Local Development

Each component contains its own documentation for local setup, development, and deployment.

Refer to:

- `backend/README.md`
- `ai-platform/README.md`
- `frontend/README.md`

for module-specific instructions.

---

## Project Overview

Industrial Operating Brain provides:

- Real-time industrial telemetry ingestion
- Intelligent asset monitoring
- AI-assisted operational decision support
- Predictive maintenance analytics
- Knowledge Graph–powered enterprise search
- Digital Twin integration
- Industrial dashboard and visualization

---

## License

Developed as part of the **India Innovates Hackathon** submission.
