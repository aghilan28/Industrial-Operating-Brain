"use client";

/**
 * Phase 5 — Stream Connection State Badge.
 *
 * Surfaces the StreamProvider connection state machine to the operator so a
 * dropped socket is never mistaken for live plant data. Fixes the "frontend
 * silent drops" defect: previously a dead socket left the last-known values
 * frozen on screen with no visual indication they were stale.
 */

import React from "react";
import { ConnectionState, useStreamOptional } from "@/providers/StreamProvider";

interface StateStyle {
  label: string;
  dot: string;
  text: string;
  pulse: boolean;
}

const STATE_STYLES: Record<ConnectionState, StateStyle> = {
  connected: {
    label: "Live Stream",
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    pulse: true,
  },
  connecting: {
    label: "Connecting...",
    dot: "bg-amber-500",
    text: "text-amber-400",
    pulse: true,
  },
  reconnecting: {
    label: "Reconnecting...",
    dot: "bg-amber-500",
    text: "text-amber-400",
    pulse: true,
  },
  offline: {
    label: "Offline",
    dot: "bg-slate-500",
    text: "text-slate-400",
    pulse: false,
  },
  error: {
    label: "Stream Error",
    dot: "bg-rose-500",
    text: "text-rose-400",
    pulse: false,
  },
};

export const StreamStatusBadge: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const stream = useStreamOptional();

  // Rendered outside a StreamProvider (e.g. a public route): render nothing
  // rather than throwing and taking down the surrounding layout.
  if (!stream) return null;

  const { connectionState, reconnect, reconnectAttempts } = stream;
  const style = STATE_STYLES[connectionState] ?? STATE_STYLES.offline;
  const showRetry = connectionState === "offline" || connectionState === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Telemetry stream: ${style.label}`}
      className={`flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {style.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.dot}`}
        />
      </span>

      <span className={`${style.text} font-semibold uppercase tracking-wider`}>
        {style.label}
      </span>

      {connectionState === "reconnecting" && reconnectAttempts > 0 && (
        <span className="text-slate-500">attempt {reconnectAttempts}</span>
      )}

      {showRetry && (
        <button
          type="button"
          onClick={reconnect}
          className="ml-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default StreamStatusBadge;
