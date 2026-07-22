"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ConnectionStatus, TelemetryFrame, TelemetryPayload } from '../services/websocket/types';
import { TelemetryWebSocketClient } from '../services/websocket/telemetry-client';

interface TelemetryHistoryEntry {
  timestamp: string | number;
  value: number;
}

interface TelemetryState {
  latestValues: Record<string, TelemetryPayload>;
  history: Record<string, TelemetryHistoryEntry[]>;
  status: ConnectionStatus;
  reconnect: () => void;
}

const MAX_HISTORY_POINTS = 50;

const TelemetryContext = createContext<TelemetryState | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [latestValues, setLatestValues] = useState<Record<string, TelemetryPayload>>({});
  const [history, setHistory] = useState<Record<string, TelemetryHistoryEntry[]>>({});

  const clientRef = useRef<TelemetryWebSocketClient | null>(null);
  
  // High-frequency frame batching queue
  const frameBufferRef = useRef<TelemetryFrame[]>([]);
  const rafIdRef = useRef<number | null>(null);

  const processFrameBuffer = useCallback(() => {
    if (frameBufferRef.current.length === 0) {
      rafIdRef.current = null;
      return;
    }

    const incomingFrames = [...frameBufferRef.current];
    frameBufferRef.current = [];

    setLatestValues((prev) => {
      const next = { ...prev };
      for (const frame of incomingFrames) {
        if (frame?.topic) {
          next[frame.topic] = frame.payload;
        }
      }
      return next;
    });

    setHistory((prev) => {
      const nextHistory = { ...prev };
      for (const frame of incomingFrames) {
        if (!frame?.topic || !frame?.payload) continue;
        const topic = frame.topic;
        const payload = frame.payload;
        const numVal = typeof payload.value === 'number' ? payload.value : payload.velocity;

        if (typeof numVal === 'number') {
          const ts = payload.timestamp || Date.now();
          const existing = nextHistory[topic] || [];
          const updated = [...existing, { timestamp: ts, value: numVal }];
          nextHistory[topic] = updated.slice(-MAX_HISTORY_POINTS);
        }
      }
      return nextHistory;
    });

    rafIdRef.current = null;
  }, []);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.host}/api/v1/stream`;

    const client = new TelemetryWebSocketClient({
      url: wsHost,
      getToken: () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('iob_access_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
        }
        return null;
      },
    });

    clientRef.current = client;

    const unsubscribeStatus = client.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    const unsubscribeFrames = client.subscribe((frame: TelemetryFrame) => {
      frameBufferRef.current.push(frame);

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(processFrameBuffer);
      }
    });

    client.connect();

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      unsubscribeFrames();
      unsubscribeStatus();
      client.disconnect();
    };
  }, [processFrameBuffer]);

  const reconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current.connect();
    }
  }, []);

  return (
    <TelemetryContext.Provider value={{ latestValues, history, status, reconnect }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetryContext = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetryContext must be used within a TelemetryProvider');
  }
  return context;
};
