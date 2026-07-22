"use client";

import React from 'react';
import { useTelemetry } from '../../hooks/useTelemetry';

export const ConnectionBadge: React.FC = () => {
  const { status, reconnect } = useTelemetry();

  const statusConfigs = {
    CONNECTED: { label: 'Live Stream', color: 'bg-emerald-500', text: 'text-emerald-400', animate: true },
    CONNECTING: { label: 'Connecting...', color: 'bg-amber-500', text: 'text-amber-400', animate: true },
    RECONNECTING: { label: 'Reconnecting...', color: 'bg-amber-500', text: 'text-amber-400', animate: true },
    DISCONNECTED: { label: 'Offline', color: 'bg-rose-500', text: 'text-rose-400', animate: false },
    UNAUTHORIZED: { label: 'Auth Failed', color: 'bg-red-600', text: 'text-red-500', animate: false },
  };

  const current = statusConfigs[status] || statusConfigs.DISCONNECTED;

  return (
    <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono">
      <span className="relative flex h-2.5 w-2.5">
        {current.animate && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${current.color} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${current.color}`}></span>
      </span>
      <span className={`${current.text} font-semibold uppercase tracking-wider`}>{current.label}</span>
      {(status === 'DISCONNECTED' || status === 'UNAUTHORIZED') && (
        <button
          onClick={reconnect}
          className="ml-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};
