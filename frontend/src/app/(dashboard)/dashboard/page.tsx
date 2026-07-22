"use client";

import * as React from "react";
import { dashboardApi, SystemStatus } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = React.useState<SystemStatus | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getSystemStatus();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load system status");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">Operating Brain Overview</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400 font-sans">Real-time system telemetry & analytics</p>
        </div>
        <button
          onClick={fetchStatus}
          className="px-3 py-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50 animate-pulse text-zinc-400 text-sm">
          Fetching system status...
        </div>
      )}

      {error && (
        <div className="p-4 rounded border border-red-500/20 bg-red-950/30 text-red-400 text-sm flex justify-between items-center">
          <span>Error: {error}</span>
          <button onClick={fetchStatus} className="underline text-xs ml-4">Retry</button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border border-white/10 rounded bg-zinc-900/40">
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Status</div>
            <div className="text-lg font-mono text-emerald-400 mt-1">{data.status}</div>
          </div>
          <div className="p-4 border border-white/10 rounded bg-zinc-900/40">
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Service</div>
            <div className="text-lg font-mono text-white mt-1">{data.service}</div>
          </div>
          <div className="p-4 border border-white/10 rounded bg-zinc-900/40">
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Version</div>
            <div className="text-lg font-mono text-white mt-1">{data.version}</div>
          </div>
          <div className="p-4 border border-white/10 rounded bg-zinc-900/40">
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Environment</div>
            <div className="text-lg font-mono text-white mt-1">{data.environment}</div>
          </div>
        </div>
      )}
    </div>
  );
}
