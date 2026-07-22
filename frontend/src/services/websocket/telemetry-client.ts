import {
  ConnectionStatus,
  TelemetryFrame,
  TelemetryHandler,
  StatusHandler,
  WebSocketClientConfig,
} from './types';

export class TelemetryWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private status: ConnectionStatus = 'DISCONNECTED';
  private frameListeners: Set<TelemetryHandler> = new Set();
  private statusListeners: Set<StatusHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketClientConfig) {
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 10,
      reconnectIntervalMs: 3000,
      heartbeatIntervalMs: 15000,
      ...config,
    };
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const token = this.config.getToken();
    if (!token) {
      this.setStatus('UNAUTHORIZED');
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    const wsUrl = `${this.config.url}?token=${encodeURIComponent(token)}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupHandlers();
    } catch (err) {
      this.handleConnectionFailure();
    }
  }

  private setupHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('CONNECTED');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const frame: TelemetryFrame = JSON.parse(event.data);
        if (frame && frame.topic) {
          this.frameListeners.forEach((listener) => listener(frame));
        }
      } catch (e) {
        // Handle ping or malformed JSON
      }
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      if (event.code === 4001) {
        this.setStatus('UNAUTHORIZED');
        return;
      }
      this.setStatus('DISCONNECTED');
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      return;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const delay = Math.min(
      (this.config.reconnectIntervalMs || 3000) * Math.pow(1.5, this.reconnectAttempts),
      30000
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatIntervalMs || 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private handleConnectionFailure(): void {
    this.setStatus('DISCONNECTED');
    if (this.config.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  private setStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => listener(newStatus));
  }

  public subscribe(handler: TelemetryHandler): () => void {
    this.frameListeners.add(handler);
    return () => this.frameListeners.delete(handler);
  }

  public subscribeStatus(handler: StatusHandler): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => this.statusListeners.delete(handler);
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }
}
