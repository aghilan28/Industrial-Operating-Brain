"use client";

import * as React from "react";
import { assetsApi, Asset } from "@/lib/api";

export default function AssetManagementPage() {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAssets = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assetsApi.getAll();
      setAssets(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">Asset Management</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400 font-sans">Digital Twin Hierarchy & Asset Health</p>
        </div>
        <button
          onClick={fetchAssets}
          className="px-3 py-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="p-4 rounded border border-zinc-800 bg-zinc-900/50 animate-pulse text-zinc-400 text-sm">
          Loading assets from backend...
        </div>
      )}

      {error && (
        <div className="p-4 rounded border border-red-500/20 bg-red-950/30 text-red-400 text-sm flex justify-between items-center">
          <span>Error loading assets: {error}</span>
          <button onClick={fetchAssets} className="underline text-xs ml-4">Retry</button>
        </div>
      )}

      {!loading && !error && assets.length === 0 && (
        <div className="p-8 border border-white/10 rounded bg-zinc-900/20 text-center text-zinc-400 text-sm">
          No assets currently registered in system.
        </div>
      )}

      {!loading && !error && assets.length > 0 && (
        <div className="border border-white/10 rounded overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900 border-b border-white/10 text-zinc-400 uppercase">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-200">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-zinc-900/50">
                  <td className="p-3">{asset.id}</td>
                  <td className="p-3 text-white font-sans">{asset.name}</td>
                  <td className="p-3">{asset.type}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-400">{asset.location || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
