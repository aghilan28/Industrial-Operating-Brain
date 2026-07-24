# Phase 1 — Centralized API Communication Layer

## Integration Guide for the Industrial Operating Brain (IOB) Frontend

---

## 1. File Manifest

### New Files Created

| File | Purpose |
|------|---------|
| `src/api/types.ts` | Type definitions (RequestConfig, ApiErrorResponse, TokenRefreshHandler) |
| `src/api/errors.ts` | Unified `AppError` class with factory helpers |
| `src/api/client.ts` | Singleton `HttpClient` with auth injection, 401 refresh, timeouts |
| `src/api/index.ts` | Barrel export for clean imports (`import { api } from '@/api'`) |
| `src/api/bootstrap.ts` | App startup wiring — connects `api` to existing auth system |
| `src/services/equipmentService.ts` | Example migrated domain service |

### Legacy Files to Remove (after migration)

| File | Reason |
|------|--------|
| `src/lib/api/axiosClient.ts` | Redundant Axios instance — replaced by `api` singleton |
| `src/lib/api/client.ts` | Superseded by `src/api/client.ts` |
| `src/utils/fetcher.ts` | Superseded by `src/api/client.ts` |

---

## 2. Quick-Start Integration

### Step 1 — Copy the new files into your project

Place the `src/api/` directory and `src/services/equipmentService.ts` into your frontend source tree:

```
frontend/src/
├── api/
│   ├── types.ts
│   ├── errors.ts
│   ├── client.ts
│   ├── index.ts
│   └── bootstrap.ts
├── services/
│   └── equipmentService.ts
│   └── websocket/   (existing — untouched)
├── lib/
│   └── api/         (existing — to be migrated)
│   └── auth/        (existing — untouched)
└── ...
```

### Step 2 — Bootstrap the API client at app startup

In your root provider (e.g. `src/components/providers/RootProviders.tsx` or `src/app/layout.tsx`):

```tsx
import { bootstrapApiClient } from '@/api/bootstrap';

export function RootProviders({ children }: { children: React.ReactNode }) {
  // Configure the centralized api client once
  bootstrapApiClient();

  return <>{children}</>;
}
```

### Step 3 — Update `bootstrap.ts` to use your real auth module

Edit the placeholder functions in `src/api/bootstrap.ts` to import from your
existing `src/lib/auth/tokenManager.ts` and/or `src/lib/auth/AuthContext.tsx`:

```ts
// Replace placeholders with real imports:
import { getAccessToken, refreshAccessToken, clearSession } from '@/lib/auth/tokenManager';

function getToken(): string | null {
  return getAccessToken();
}

async function refreshToken(): Promise<string> {
  return refreshAccessToken();
}

function handleUnauthorized(): void {
  clearSession();
  // router.push('/login');
}
```

---

## 3. Migrating Existing Domain Services

### Before (legacy Axios client)

```ts
// src/lib/api/assets.ts
import axiosClient from './axiosClient';

export const AssetsApi = {
  getAll: () => axiosClient.get('/assets'),
  getById: (id: string) => axiosClient.get(`/assets/${id}`),
  update: (id: string, data: any) => axiosClient.put(`/assets/${id}`, data),
};
```

### After (unified HttpClient)

```ts
// src/lib/api/assets.ts
import { api } from '@/api';

export interface Asset {
  id: string;
  name: string;
  // ...
}

export const AssetsApi = {
  getAll: () => api.get<Asset[]>('/assets'),
  getById: (id: string) => api.get<Asset>(`/assets/${id}`),
  update: (id: string, data: Partial<Asset>) => api.put<Asset>(`/assets/${id}`, data),
};
```

### Migration Checklist for Each Domain Service

| Service File | Import Change | Notes |
|---|---|---|
| `src/lib/api/alerts.ts` | `axiosClient` → `api` from `@/api` | Add generic types |
| `src/lib/api/assets.ts` | `axiosClient` → `api` from `@/api` | Add generic types |
| `src/lib/api/dashboard.ts` | `axiosClient` → `api` from `@/api` | Add generic types |
| `src/lib/api/telemetry.ts` | `axiosClient` → `api` from `@/api` | Add generic types |
| `src/hooks/useTelemetry.ts` | Raw fetch → `api.get()` | Remove manual headers |
| `src/lib/auth/AuthContext.tsx` | Keep as-is | Token source, not consumer |

---

## 4. Error Handling Pattern

### Before (inconsistent error shapes)

```ts
// Axios path — error.response.data
try {
  const res = await axiosClient.get('/assets');
} catch (err: any) {
  console.error(err.response?.data?.message);
}

// Raw fetch path — different shape
try {
  const res = await fetch('/assets');
  if (!res.ok) throw new Error(res.statusText);
} catch (err: any) {
  console.error(err.message);
}
```

### After (unified AppError)

```ts
import { AppError } from '@/api';

try {
  const assets = await api.get('/assets');
} catch (err) {
  if (AppError.isAppError(err)) {
    switch (err.code) {
      case 'NETWORK_FAILURE':
        showToast('You appear to be offline');
        break;
      case 'REQUEST_TIMEOUT':
        showToast('The request took too long');
        break;
      case 'HTTP_403':
        showToast('You do not have permission');
        break;
      default:
        showToast(err.message);
    }
  }
}
```

---

## 5. What This Fixes

| Problem | Solution |
|---------|----------|
| Token refresh race conditions (parallel 401s trigger duplicate `/auth/refresh`) | Single-flight Promise lock — only one refresh at a time |
| Inconsistent error shapes across services | Unified `AppError` class |
| Hardcoded base URLs in multiple files | Single `baseUrl` config in `bootstrap.ts` |
| Missing request timeouts | Default 15s timeout via `AbortController` |
| No correlation IDs for distributed tracing | Auto-generated `X-Correlation-ID` header |
| FormData uploads failing due to wrong Content-Type | Automatic Content-Type removal for FormData |

---

## 6. Validation

After migration, verify:

```bash
# No remaining direct references to legacy clients
grep -r "axiosClient" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*fetcher" src/ --include="*.ts" --include="*.tsx"

# TypeScript compiles without errors
npx tsc --noEmit
```
