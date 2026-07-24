/**
 * Centralized API Communication Layer — Error Model
 *
 * Unified `AppError` class that normalises every failure mode (HTTP errors,
 * network drops, timeouts, validation errors) into a single shape consumed
 * by UI components and error boundaries.
 */

import type { ApiErrorResponse } from './types';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly path?: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(params: {
    message: string;
    status?: number;
    code?: string;
    details?: Record<string, unknown>;
    timestamp?: string;
    requestId?: string;
    path?: string;
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.status = params.status ?? 500;
    this.code = params.code ?? 'UNKNOWN_ERROR';
    this.details = params.details;
    this.timestamp = params.timestamp ?? new Date().toISOString();
    this.requestId = params.requestId;
    this.path = params.path;
    this.isNetworkError = params.isNetworkError ?? false;
    this.isTimeout = params.isTimeout ?? false;

    // Ensure instanceof checks work across transpilation boundaries.
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // -----------------------------------------------------------------------
  // Factory helpers
  // -----------------------------------------------------------------------

  /** Build an AppError from an API JSON error response + HTTP status. */
  static fromResponse(data: Partial<ApiErrorResponse>, status: number): AppError {
    return new AppError({
      message: data.message || 'An unexpected server error occurred.',
      status,
      code: data.code || `HTTP_${status}`,
      details: data.details,
      timestamp: data.timestamp,
      requestId: data.requestId,
      path: data.path,
    });
  }

  /** Build an AppError representing a complete network failure (DNS, offline, etc.). */
  static networkFailure(message = 'Network connection lost'): AppError {
    return new AppError({
      message,
      status: 0,
      code: 'NETWORK_FAILURE',
      isNetworkError: true,
    });
  }

  /** Build an AppError representing a request that exceeded its timeout. */
  static timeoutFailure(message = 'Request execution timed out'): AppError {
    return new AppError({
      message,
      status: 408,
      code: 'REQUEST_TIMEOUT',
      isTimeout: true,
    });
  }

  // -----------------------------------------------------------------------
  // Type guards
  // -----------------------------------------------------------------------

  /** Type-guard: checks whether an unknown value is an AppError instance. */
  static isAppError(err: unknown): err is AppError {
    return err instanceof AppError;
  }
}
