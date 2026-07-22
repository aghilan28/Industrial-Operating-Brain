"use client";

import * as React from "react";
import { telemetryApi, TelemetryItem } from "@/lib/api";

export default function TelemetryPage() {
  const [items, setItems] = React.useState<TelemetryItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTelemetry = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await telemetryApi.getHistory("MCH-001", 50);
      setItems(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load telemetry data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">Real-Time Telemetry</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400 font-sans">High-frequency sensor streams (Target: MCH-001)</p>
        </div>
        <button
          onClick={fetchTelemetry}
          className="px-3 py-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50 animate-pulse text-zinc-400 text-sm">
          Fetching sensor stream history...
        </div>
      )}

      {error && (
        <div className="p-4 rounded border border-red-500/20 bg-red-950/30 text-red-400 text-sm flex justify-between items-center">
          <span>Error loading telemetry: {error}</span>
          <button onClick={fetchTelemetry} className="underline text-xs ml-4">Retry</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="p-8 border border-white/10 rounded bg-zinc-900/20 text-center text-zinc-400 text-sm">
          No telemetry stream points returned for machine MCH-001.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="border border-white/10 rounded overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900 border-b border-white/10 text-zinc-400 uppercase">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Machine ID</th>
                <th className="p-3">Measured Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-200">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-zinc-900/50">
                  <td className="p-3 text-zinc-400">{item.timestamp}</td>
                  <td className="p-3 text-white">{item.machine_id}</td>
                  <td className="p-3 text-emerald-400 font-bold">{item.measured_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
