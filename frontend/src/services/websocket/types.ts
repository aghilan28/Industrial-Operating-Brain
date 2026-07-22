export type ConnectionStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'UNAUTHORIZED';

export interface TelemetryPayload {
  value?: number;
  velocity?: number;
  unit?: string;
  status?: string;
  timestamp?: string | number;
  [key: string]: unknown;
}

export interface TelemetryFrame {
  topic: string;
  payload: TelemetryPayload;
}

export type TelemetryHandler = (frame: TelemetryFrame) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

export interface WebSocketClientConfig {
  url: string;
  getToken: () => string | null;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectIntervalMs?: number;
  heartbeatIntervalMs?: number;
}
