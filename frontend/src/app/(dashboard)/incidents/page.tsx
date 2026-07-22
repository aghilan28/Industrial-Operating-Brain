"use client";

import * as React from "react";
import { alertsApi, Alert } from "@/lib/api";

export default function IncidentsPage() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAlerts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await alertsApi.getAll();
      setAlerts(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">Incident Command Center</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400 font-sans">Critical Alert Dispatch & Triage</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="px-3 py-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50 animate-pulse text-zinc-400 text-sm">
          Loading alerts from triage feed...
        </div>
      )}

      {error && (
        <div className="p-4 rounded border border-red-500/20 bg-red-950/30 text-red-400 text-sm flex justify-between items-center">
          <span>Error loading incidents: {error}</span>
          <button onClick={fetchAlerts} className="underline text-xs ml-4">Retry</button>
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="p-8 border border-white/10 rounded bg-zinc-900/20 text-center text-zinc-400 text-sm">
          No active or logged incidents found.
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 border border-white/10 rounded bg-zinc-900/30 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                    alert.severity === 'critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                    alert.severity === 'warning' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">Machine: {alert.machine_id}</span>
                </div>
                <div className="text-sm text-white font-sans">{alert.message}</div>
                <div className="text-[10px] font-mono text-zinc-500">{alert.timestamp}</div>
              </div>
              <span className="text-xs font-mono text-zinc-400 uppercase border border-zinc-800 px-2 py-1 rounded bg-zinc-900">
                {alert.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
