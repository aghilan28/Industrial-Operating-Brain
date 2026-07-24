/**
 * Strict TypeScript models matching FastAPI Pydantic schemas.
 * Source of truth for Phase 2 API Contract Standardization.
 */

// ---------------------------------------------------------------------------
// Common Paginated Response Wrapper
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ---------------------------------------------------------------------------
// Auth Contracts
// ---------------------------------------------------------------------------

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ---------------------------------------------------------------------------
// Asset / Equipment Contracts
// ---------------------------------------------------------------------------

export interface AssetSchema {
  id: string;
  name: string;
  serial_number: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE' | 'OFFLINE';
  location: string;
  installation_date: string;
}

export interface AssetDetailSchema extends AssetSchema {
  telemetry_channels: string[];
  last_serviced: string;
  health_score: number;
}

// ---------------------------------------------------------------------------
// Telemetry Contracts
// ---------------------------------------------------------------------------

export interface TelemetrySeriesResponse {
  asset_id: string;
  timestamps: string[];
  series: Record<string, number[]>; // Channel name -> array of readings
}

export interface TelemetryQuery {
  start_time?: string;
  end_time?: string;
  sensors?: string[];
}

// ---------------------------------------------------------------------------
// Failure Prediction Contracts
// ---------------------------------------------------------------------------

export interface FailurePredictionRequest {
  asset_id: string;
  operating_hours: number;
  telemetry_window_days: number;
}

export interface FailurePredictionResponse {
  asset_id: string;
  risk_score: number; // 0.0 - 1.0
  rul_days: number;   // Remaining Useful Life
  recommendations: string[];
  predicted_at: string;
}

// ---------------------------------------------------------------------------
// Alert Contracts
// ---------------------------------------------------------------------------

export interface AlertSchema {
  id: string;
  asset_id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface AcknowledgeAlertRequest {
  operator_id: string;
  notes: string;
}

export interface AlertFilters {
  page?: number;
  size?: number;
  severity?: string;
  acknowledged?: boolean;
}
