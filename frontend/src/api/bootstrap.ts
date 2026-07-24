/**
 * API Client Bootstrap — Integration Wiring
 *
 * This module configures the centralized `api` singleton at app startup,
 * wiring it to the existing auth system (AuthContext / tokenManager).
 *
 * Call `bootstrapApiClient()` once in your root provider or layout, before
 * any API calls are made.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * INTEGRATION WITH EXISTING PROJECT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The existing frontend has:
 *   - src/lib/auth/tokenManager.ts  → manages JWT token storage / retrieval
 *   - src/lib/auth/AuthContext.tsx   → React context providing auth state
 *
 * This bootstrap bridges the new centralized api client to those modules.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MIGRATION GUIDE FOR EXISTING DOMAIN SERVICES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Before (using legacy Axios client at src/lib/api/axiosClient.ts):
 *   import axiosClient from '@/lib/api/axiosClient';
 *   const data = await axiosClient.get('/dashboard');
 *
 * After (using the new centralized client):
 *   import { api } from '@/api';
 *   const data = await api.get('/dashboard');
 *
 * All existing domain services under src/lib/api/ (alerts.ts, assets.ts,
 * dashboard.ts, telemetry.ts) should update their imports accordingly.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { api } from './client';

// ---------------------------------------------------------------------------
// Token integration — adapt these imports to your actual auth module paths
// ---------------------------------------------------------------------------

/**
 * Replace the placeholder imports below with the real paths from your project.
 *
 * Example:
 *   import { getToken, refreshToken, clearSession } from '@/lib/auth/tokenManager';
 *
 * Or if using AuthContext:
 *   import { getTokenFromContext } from '@/lib/auth/AuthContext';
 */

// --- Placeholder token functions (replace with real implementations) ---

/** Retrieve the current JWT token from storage. */
function getToken(): string | null {
  // TODO: Replace with actual implementation from tokenManager / AuthContext
  // Example: return tokenManager.getAccessToken();
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('iob_access_token') ?? null;
}

/** Refresh the expired token and return the new one. */
async function refreshToken(): Promise<string> {
  // TODO: Replace with actual refresh logic
  // Example: return tokenManager.refreshAccessToken();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/refresh`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  const newToken: string = data.access_token;

  // Persist the new token
  if (typeof window !== 'undefined') {
    localStorage.setItem('iob_access_token', newToken);
  }

  return newToken;
}

/** Handle complete session expiration (redirect to login, clear state). */
function handleUnauthorized(): void {
  // TODO: Replace with actual session cleanup
  // Example: clearSession(); router.push('/login');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('iob_access_token');
    window.location.href = '/login';
  }
}

// ---------------------------------------------------------------------------
// Bootstrap function
// ---------------------------------------------------------------------------

/**
 * Initialize the centralized API client with auth wiring.
 * Call this once at app startup (e.g. in RootProviders or app/layout.tsx).
 *
 * @example
 * ```tsx
 * // src/components/providers/RootProviders.tsx
 * import { bootstrapApiClient } from '@/api/bootstrap';
 *
 * export function RootProviders({ children }) {
 *   bootstrapApiClient();
 *   return <>{children}</>;
 * }
 * ```
 */
export function bootstrapApiClient(): void {
  api.configure({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
    defaultTimeout: 15_000,
    getToken,
    refreshTokenHandler: refreshToken,
    onUnauthorized: handleUnauthorized,
  });
}
