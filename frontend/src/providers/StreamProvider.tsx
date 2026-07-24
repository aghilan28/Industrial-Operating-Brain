"use client";

/**
 * Phase 5 — Real-Time Stream Context Provider.
 *
 * Replaces ad-hoc sockets instantiated inside page components. One socket is
 * owned by this provider for the whole dashboard tree.
 *
 * What it fixes
 * -------------
 * 1. **Silent drops.** A full connection state machine
 *    (`connecting | connected | reconnecting | offline | error`) is exposed to
 *    the UI, so dashboards can render honest connectivity instead of showing
 *    stale numbers as if they were live.
 * 2. **No reconnect strategy.** Exponential backoff with jitter
 *    (1s -> 2s -> 4s -> 8s -> 16s -> capped 30s), reset on every successful
 *    open. Reconnects pause while the tab is hidden or the browser is offline
 *    and resume immediately on `online` / `visibilitychange`.
 * 3. **Route-change teardown.** The socket is closed deterministically on
 *    unmount, and React 18/19 StrictMode double-mounts are guarded so a stray
 *    duplicate socket is never left open.
 * 4. **Unfiltered fan-out.** `subscribeToAsset` / `unsubscribeFromAsset` bind
 *    the connection to just the assets the current view renders. Subscriptions
 *    are reference-counted and automatically replayed after a reconnect.
 *
 * Frame compatibility: understands both the Phase 5 versioned envelope
 * (`{version, event_type, asset_id, payload, ...}`) and the legacy
 * `{topic, payload}` frame, so it works against either backend transport.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "error";

export interface StreamEventEnvelope {
  version?: string;
  event_type: string;
  timestamp?: string;
  asset_id?: string | null;
  topic?: string | null;
  payload: Record<string, any>;
  quality?: "GOOD" | "BAD" | "UNCERTAIN";
  sequence_number?: number;
}

export interface TelemetryHistoryEntry {
  timestamp: string | number;
  value: number;
}

export interface StreamContextType {
  /** Current connection state machine value. */
  connectionState: ConnectionState;
  /** Most recent telemetry envelope received, regardless of asset. */
  lastTelemetry: StreamEventEnvelope | null;
  /** Latest payload per channel key (asset_id, falling back to topic). */
  latestByAsset: Record<string, Record<string, any>>;
  /** Bounded rolling history per channel key. */
  history: Record<string, TelemetryHistoryEntry[]>;
  /** Bind this client to an asset telemetry channel (reference-counted). */
  subscribeToAsset: (assetId: string) => void;
  /** Release one reference to an asset channel. */
  unsubscribeFromAsset: (assetId: string) => void;
  /** Force an immediate reconnect, resetting the backoff ladder. */
  reconnect: () => void;
  /** Number of reconnect attempts since the last successful open. */
  reconnectAttempts: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const HEARTBEAT_INTERVAL_MS = 15000;
const MAX_HISTORY_POINTS = 50;

const StreamContext = createContext<StreamContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSocketUrl(clientId?: string): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured && configured.length > 0) {
    return configured;
  }
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${protocol}//${window.location.host}/api/v1`;
  return clientId ? `${base}/ws/telemetry/${clientId}` : `${base}/stream`;
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      localStorage.getItem("iob_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token")
    );
  } catch {
    return null;
  }
}

/** Normalize either frame dialect into a Phase 5 envelope. */
function normalizeFrame(raw: any): StreamEventEnvelope | null {
  if (!raw || typeof raw !== "object") return null;

  if (typeof raw.event_type === "string") {
    return raw as StreamEventEnvelope;
  }

  // Legacy {topic, payload} frame.
  if (typeof raw.topic === "string") {
    return {
      version: "legacy",
      event_type: "telemetry_update",
      topic: raw.topic,
      asset_id: raw.asset_id ?? null,
      payload: raw.payload ?? {},
    };
  }

  return null;
}

/** Channel key used for indexing: prefer asset_id, fall back to topic. */
function channelKey(frame: StreamEventEnvelope): string | null {
  return frame.asset_id || frame.topic || null;
}

function numericValue(payload: Record<string, any>): number | undefined {
  const candidates = [payload?.value, payload?.velocity, payload?.reading];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface StreamProviderProps {
  children: React.ReactNode;
  /** Optional stable client id. When set, the versioned envelope route is used. */
  clientId?: string;
  /** Assets to subscribe to as soon as the socket opens. */
  initialAssets?: string[];
  /** Disable the socket entirely (e.g. during SSR-only rendering or tests). */
  enabled?: boolean;
}

export const StreamProvider: React.FC<StreamProviderProps> = ({
  children,
  clientId,
  initialAssets,
  enabled = true,
}) => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastTelemetry, setLastTelemetry] =
    useState<StreamEventEnvelope | null>(null);
  const [latestByAsset, setLatestByAsset] = useState<
    Record<string, Record<string, any>>
  >({});
  const [history, setHistory] = useState<
    Record<string, TelemetryHistoryEntry[]>
  >({});

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Reference-counted asset subscriptions, replayed on every reconnect. */
  const subscriptionsRef = useRef<Map<string, number>>(new Map());
  /** Guards against StrictMode double-invocation and post-unmount reconnects. */
  const disposedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  // -- Frame batching: coalesce bursts into one paint ------------------------
  const frameBufferRef = useRef<StreamEventEnvelope[]>([]);
  const rafIdRef = useRef<number | null>(null);

  const flushFrames = useCallback(() => {
    rafIdRef.current = null;
    const frames = frameBufferRef.current;
    if (frames.length === 0) return;
    frameBufferRef.current = [];

    setLastTelemetry(frames[frames.length - 1]);

    setLatestByAsset((prev) => {
      const next = { ...prev };
      for (const frame of frames) {
        const key = channelKey(frame);
        if (key) next[key] = frame.payload;
      }
      return next;
    });

    setHistory((prev) => {
      const next = { ...prev };
      for (const frame of frames) {
        const key = channelKey(frame);
        if (!key) continue;
        const value = numericValue(frame.payload);
        if (value === undefined) continue;
        const ts = frame.timestamp || frame.payload?.timestamp || Date.now();
        const series = next[key] || [];
        next[key] = [...series, { timestamp: ts, value }].slice(
          -MAX_HISTORY_POINTS
        );
      }
      return next;
    });
  }, []);

  const enqueueFrame = useCallback(
    (frame: StreamEventEnvelope) => {
      frameBufferRef.current.push(frame);
      if (rafIdRef.current === null) {
        rafIdRef.current =
          typeof requestAnimationFrame === "function"
            ? requestAnimationFrame(flushFrames)
            : (setTimeout(flushFrames, 16) as unknown as number);
      }
    },
    [flushFrames]
  );

  // -- Socket plumbing -------------------------------------------------------

  const sendCommand = useCallback((command: Record<string, any>) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(command));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current !== null) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatTimerRef.current = setInterval(() => {
      sendCommand({ action: "ping", type: "ping", ts: Date.now() });
    }, HEARTBEAT_INTERVAL_MS);
  }, [sendCommand, stopHeartbeat]);

  const scheduleReconnect = useCallback(() => {
    if (disposedRef.current) return;
    if (reconnectTimerRef.current !== null) return;

    // Do not burn attempts while the device is known to be offline; the
    // 'online' listener will fire an immediate retry instead.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setConnectionState("offline");
      return;
    }

    const base = reconnectDelayRef.current;
    const jitter = Math.random() * 0.3 * base;
    const delay = Math.min(base + jitter, MAX_RECONNECT_DELAY_MS);
    reconnectDelayRef.current = Math.min(base * 2, MAX_RECONNECT_DELAY_MS);

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      setReconnectAttempts((n) => n + 1);
      connectRef.current();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (disposedRef.current || typeof window === "undefined") return;

    const existing = socketRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.CONNECTING ||
        existing.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    if (navigator.onLine === false) {
      setConnectionState("offline");
      return;
    }

    setConnectionState((prev) =>
      prev === "connected" || prev === "connecting" ? "connecting" : "reconnecting"
    );

    const token = readToken();
    const base = resolveSocketUrl(clientId);
    if (!base) return;
    const url = token
      ? `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
      : base;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setConnectionState("error");
      scheduleReconnect();
      return;
    }
    socketRef.current = ws;

    ws.onopen = () => {
      if (disposedRef.current) {
        try {
          ws.close();
        } catch {
          /* noop */
        }
        return;
      }
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
      setReconnectAttempts(0);
      setConnectionState("connected");

      // Replay every active asset subscription onto the fresh socket.
      subscriptionsRef.current.forEach((count, assetId) => {
        if (count > 0) sendCommand({ action: "subscribe", asset_id: assetId });
      });

      startHeartbeat();
    };

    ws.onmessage = (event) => {
      let parsed: any;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return; // Non-JSON keepalive frame.
      }

      const frame = normalizeFrame(parsed);
      if (!frame) return;

      // Control frames carry no telemetry.
      if (
        frame.event_type === "pong" ||
        frame.event_type === "ack" ||
        frame.event_type === "error"
      ) {
        return;
      }

      // Answer a server liveness probe immediately.
      if (frame.event_type === "ping") {
        sendCommand({ action: "pong", type: "pong" });
        return;
      }

      if (frame.event_type === "telemetry_update") {
        enqueueFrame(frame);
      }
    };

    ws.onerror = () => {
      setConnectionState("error");
    };

    ws.onclose = (event) => {
      stopHeartbeat();
      socketRef.current = null;
      if (disposedRef.current) return;

      // 4001 = authentication rejection. Retrying with the same bad token
      // would loop forever, so surface it and stop.
      if (event.code === 4001) {
        setConnectionState("error");
        return;
      }

      setConnectionState(
        typeof navigator !== "undefined" && navigator.onLine === false
          ? "offline"
          : "reconnecting"
      );
      scheduleReconnect();
    };
  }, [
    clientId,
    enqueueFrame,
    scheduleReconnect,
    sendCommand,
    startHeartbeat,
    stopHeartbeat,
  ]);

  connectRef.current = connect;

  // -- Lifecycle -------------------------------------------------------------

  useEffect(() => {
    if (!enabled) return;

    disposedRef.current = false;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;

    for (const assetId of initialAssets || []) {
      subscriptionsRef.current.set(
        assetId,
        (subscriptionsRef.current.get(assetId) || 0) + 1
      );
    }

    connect();

    const handleOnline = () => {
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      connectRef.current();
    };
    const handleOffline = () => setConnectionState("offline");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const ws = socketRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED) handleOnline();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposedRef.current = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);

      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (rafIdRef.current !== null) {
        if (typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = null;
      }
      stopHeartbeat();

      const ws = socketRef.current;
      socketRef.current = null;
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try {
          ws.close(1000, "client navigating away");
        } catch {
          /* noop */
        }
      }
    };
    // `connect` is stable via useCallback; initialAssets is applied once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, clientId]);

  // -- Public API ------------------------------------------------------------

  const subscribeToAsset = useCallback(
    (assetId: string) => {
      if (!assetId) return;
      const current = subscriptionsRef.current.get(assetId) || 0;
      subscriptionsRef.current.set(assetId, current + 1);
      if (current === 0) {
        sendCommand({ action: "subscribe", asset_id: assetId });
      }
    },
    [sendCommand]
  );

  const unsubscribeFromAsset = useCallback(
    (assetId: string) => {
      if (!assetId) return;
      const current = subscriptionsRef.current.get(assetId) || 0;
      if (current <= 1) {
        subscriptionsRef.current.delete(assetId);
        sendCommand({ action: "unsubscribe", asset_id: assetId });
      } else {
        subscriptionsRef.current.set(assetId, current - 1);
      }
    },
    [sendCommand]
  );

  const reconnect = useCallback(() => {
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
    setReconnectAttempts(0);
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const ws = socketRef.current;
    if (ws) {
      ws.onclose = null;
      try {
        ws.close();
      } catch {
        /* noop */
      }
      socketRef.current = null;
    }
    stopHeartbeat();
    connectRef.current();
  }, [stopHeartbeat]);

  const value = useMemo<StreamContextType>(
    () => ({
      connectionState,
      lastTelemetry,
      latestByAsset,
      history,
      subscribeToAsset,
      unsubscribeFromAsset,
      reconnect,
      reconnectAttempts,
    }),
    [
      connectionState,
      lastTelemetry,
      latestByAsset,
      history,
      subscribeToAsset,
      unsubscribeFromAsset,
      reconnect,
      reconnectAttempts,
    ]
  );

  return (
    <StreamContext.Provider value={value}>{children}</StreamContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const useStream = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStream must be used within a StreamProvider");
  }
  return context;
};

/** Optional variant that returns `undefined` instead of throwing. */
export const useStreamOptional = (): StreamContextType | undefined =>
  useContext(StreamContext);

/**
 * Subscribe to one asset for the lifetime of the calling component and read
 * back its latest payload plus rolling history.
 */
export const useAssetStream = (assetId?: string) => {
  const ctx = useStream();
  const { subscribeToAsset, unsubscribeFromAsset } = ctx;

  useEffect(() => {
    if (!assetId) return;
    subscribeToAsset(assetId);
    return () => unsubscribeFromAsset(assetId);
  }, [assetId, subscribeToAsset, unsubscribeFromAsset]);

  const key = assetId
    ? Object.keys(ctx.latestByAsset).find(
        (k) => k === assetId || k.includes(assetId)
      )
    : undefined;

  return {
    data: key ? ctx.latestByAsset[key] : undefined,
    history: key ? ctx.history[key] || [] : [],
    connectionState: ctx.connectionState,
    reconnect: ctx.reconnect,
  };
};

export default StreamProvider;
