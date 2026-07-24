/**
 * Centralized API Communication Layer — Unified HttpClient
 *
 * A singleton HTTP client that replaces all legacy fetchers (raw `fetch`,
 * Axios wrappers, custom fetch helpers). It provides:
 *
 *   • Automatic Authorization header injection
 *   • Single-flight 401 refresh (prevents parallel token refresh races)
 *   • Per-request timeout via AbortController
 *   • X-Correlation-ID header for distributed tracing
 *   • FormData-aware Content-Type handling
 *   • Unified AppError for every failure mode
 *
 * Usage:
 *   import { api } from '@/api';
 *   const data = await api.get<MyType>('/endpoint');
 */

import type { RequestConfig, HttpClientConfig, TokenRefreshHandler } from './types';
import { AppError } from './errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a UUID for X-Correlation-ID (falls back to timestamp). */
function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Resolve a safe base URL for the URL constructor fallback.
 * Works in both browser and SSR (Node) contexts.
 */
function getOriginFallback(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost';
}

// ---------------------------------------------------------------------------
// HttpClient
// ---------------------------------------------------------------------------

class HttpClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private getToken: () => string | null;
  private refreshTokenHandler?: TokenRefreshHandler;
  private onUnauthorized?: () => void;

  // Single-flight refresh state
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    this.defaultTimeout = 15_000; // 15 seconds
    this.getToken = () => null;
  }

  // -------------------------------------------------------------------------
  // Public configuration
  // -------------------------------------------------------------------------

  /**
   * Configure the client with token management, refresh handler, and
   * unauthorized callback. Call once at app bootstrap (e.g. in RootProviders).
   */
  public configure(opts: HttpClientConfig): void {
    if (opts.baseUrl) this.baseUrl = opts.baseUrl;
    if (opts.defaultTimeout) this.defaultTimeout = opts.defaultTimeout;
    this.getToken = opts.getToken;
    this.refreshTokenHandler = opts.refreshTokenHandler;
    this.onUnauthorized = opts.onUnauthorized;
  }

  // -------------------------------------------------------------------------
  // Single-flight refresh internals
  // -------------------------------------------------------------------------

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void): void {
    this.refreshSubscribers.push(cb);
  }

  // -------------------------------------------------------------------------
  // URL building
  // -------------------------------------------------------------------------

  private buildUrl(path: string, params?: RequestConfig['params']): string {
    const fullUrl = path.startsWith('http')
      ? path
      : `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    if (!params) return fullUrl;

    const url = new URL(fullUrl, getOriginFallback());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
    return url.toString();
  }

  // -------------------------------------------------------------------------
  // Core request method
  // -------------------------------------------------------------------------

  public async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const {
      params,
      body,
      timeout = this.defaultTimeout,
      skipAuth = false,
      headers: customHeaders,
      retry = 0,
      ...customConfig
    } = config;

    const url = this.buildUrl(path, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Correlation-ID': generateCorrelationId(),
      ...(customHeaders as Record<string, string>),
    };

    // Auth injection
    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const options: RequestInit = {
      ...customConfig,
      headers,
      signal: controller.signal,
    };

    // Body handling — FormData and URLSearchParams get special treatment
    if (body !== undefined && body !== null) {
      if (body instanceof FormData) {
        options.body = body;
        delete headers['Content-Type']; // Let browser set multipart boundary
      } else if (body instanceof URLSearchParams) {
        options.body = body.toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        options.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      // Handle 401 with single-flight refresh
      if (response.status === 401 && !skipAuth && this.refreshTokenHandler) {
        return this.handle401AndRetry<T>(path, config);
      }

      if (!response.ok) {
        let errorData: Partial<import('./types').ApiErrorResponse> = {};
        try {
          errorData = await response.json();
        } catch {
          // Response body was not JSON — use defaults
        }
        throw AppError.fromResponse(errorData, response.status);
      }

      // 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Re-throw already-normalised errors
      if (err instanceof AppError) throw err;

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw AppError.timeoutFailure(`Request timed out after ${timeout}ms`);
        }
        throw AppError.networkFailure(err.message);
      }

      throw AppError.networkFailure();
    }
  }

  // -------------------------------------------------------------------------
  // 401 single-flight refresh
  // -------------------------------------------------------------------------

  private async handle401AndRetry<T>(path: string, config: RequestConfig): Promise<T> {
    if (!this.isRefreshing && this.refreshTokenHandler) {
      this.isRefreshing = true;
      try {
        const newToken = await this.refreshTokenHandler();
        this.isRefreshing = false;
        this.onRefreshed(newToken);
        return this.request<T>(path, config);
      } catch (refreshErr) {
        this.isRefreshing = false;
        this.refreshSubscribers = [];
        if (this.onUnauthorized) this.onUnauthorized();
        throw refreshErr;
      }
    }

    // Queue this request until the ongoing refresh completes
    return new Promise<T>((resolve, reject) => {
      this.addRefreshSubscriber(async () => {
        try {
          resolve(await this.request<T>(path, config));
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Convenience methods
  // -------------------------------------------------------------------------

  public get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'GET' });
  }

  public post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'POST', body });
  }

  public put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'PUT', body });
  }

  public patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'PATCH', body });
  }

  public delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'DELETE' });
  }

  /**
   * Upload one or more files via multipart/form-data.
   * Automatically removes Content-Type so the browser sets the boundary.
   */
  public upload<T>(path: string, formData: FormData, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: 'POST', body: formData });
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const api = new HttpClient();
