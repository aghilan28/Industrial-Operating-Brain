Phase 2 — Frontend ↔ Backend Route Alignment & API Contract Standardization
=============================================================================
Modified / New Files (relative to frontend/src/)
-----------------------------------------------------------------------------

NEW:
  types/apiContracts.ts        — Strict Pydantic-aligned TypeScript interfaces
  types/auth.ts                 — Updated Auth payload interfaces
  services/authService.ts       — OAuth2 form-encoded login + refresh
  services/telemetryService.ts  — GET /api/v1/assets/{id}/telemetry
  services/predictionService.ts — POST /api/v1/predictions/failure
  services/alertService.ts      — PATCH /api/v1/alerts/{id}/ack

MODIFIED:
  services/equipmentService.ts  — /api/v1/assets + paginated wrapper parsing
  api/client.ts                 — URLSearchParams + array query param support

Integration Notes:
  • authService.login uses URLSearchParams to match FastAPI OAuth2PasswordRequestForm.
  • HttpClient (api/client.ts) now handles URLSearchParams body and array params.
  • All service endpoints use /api/v1/ prefix as defined in backend route audit.
  • Paginated responses (items/total/page/size) are typed via PaginatedResponse<T>.
