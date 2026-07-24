/**
 * Centralized API Communication Layer — Type Definitions
 *
 * All request/response contracts used by the unified HttpClient.
 */

// ---------------------------------------------------------------------------
// Request Config
// ---------------------------------------------------------------------------

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  /** Query-string parameters appended to the URL. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request body — will be JSON-stringified unless it is a FormData instance. */
  body?: unknown;
  /** Per-request timeout in milliseconds (overrides the client default). */
  timeout?: number;
  /** When `true`, no Authorization header is attached. */
  skipAuth?: boolean;
  /** Number of automatic retries on transient failures (5xx / network). */
  retry?: number;
}

// ---------------------------------------------------------------------------
// Error Envelope
// ---------------------------------------------------------------------------

export interface ApiErrorResponse {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  path?: string;
}

// ---------------------------------------------------------------------------
// Token Contract
// ---------------------------------------------------------------------------

/** Callback invoked by the client when a fresh token is needed (e.g. after 401). */
export type TokenRefreshHandler = () => Promise<string>;

// ---------------------------------------------------------------------------
// Client Configuration
// ---------------------------------------------------------------------------

export interface HttpClientConfig {
  baseUrl?: string;
  defaultTimeout?: number;
  getToken: () => string | null;
  refreshTokenHandler?: TokenRefreshHandler;
  onUnauthorized?: () => void;
}
