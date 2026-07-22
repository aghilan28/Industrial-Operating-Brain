// TypeScript interfaces generated strictly from Backend FastAPI endpoints & Pydantic models

export interface SystemStatus {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface TelemetryItem {
  id: string | number;
  timestamp: string;
  machine_id: string;
  measured_value: number;
  [key: string]: unknown;
}

export interface TelemetryResponse {
  success: boolean;
  data: TelemetryItem[];
}

export interface AlarmAcknowledgeRequest {
  comment?: string;
}

export interface AlarmResolveRequest {
  resolution_notes: string;
}

export interface Alert {
  id: string;
  machine_id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  status: "active" | "acknowledged" | "resolved";
  timestamp: string;
  acknowledged_by?: string;
  resolved_by?: string;
  [key: string]: unknown;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  last_seen?: string;
  [key: string]: unknown;
}

export interface AssetDetail extends Asset {
  telemetry_flow?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  detail: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
}
