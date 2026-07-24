/**
 * Centralized API Communication Layer — Barrel Export
 *
 * Import from `@/api` (or relative `../api`) for a single entry point.
 */

export { api } from './client';
export { AppError } from './errors';
export type {
  RequestConfig,
  ApiErrorResponse,
  TokenRefreshHandler,
  HttpClientConfig,
} from './types';
