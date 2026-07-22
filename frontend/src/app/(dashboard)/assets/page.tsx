"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { assetsApi } from "@/lib/api";
import type { Asset } from "@/lib/api";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/feedback/Spinner";
import Link from "next/link";

const TableSkeleton = () => (
  <div className="space-y-3.5 animate-pulse" aria-label="Loading assets directory">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between py-4 px-4 border border-white/5 rounded-lg bg-zinc-900/25">
        <div className="h-4 bg-zinc-800 rounded w-16" />
        <div className="h-4 bg-zinc-800 rounded w-36" />
        <div className="h-4 bg-zinc-800 rounded w-20" />
        <div className="h-4 bg-zinc-800 rounded w-16" />
        <div className="h-4 bg-zinc-800 rounded w-28" />
      </div>
    ))}
  </div>
);

const InspectorSkeleton = () => (
  <div className="mt-5 space-y-6 animate-pulse" aria-label="Loading twin details">
    <div className="space-y-2">
      <div className="h-3 bg-zinc-850 rounded w-1/4" />
      <div className="h-5 bg-zinc-800 rounded w-2/3" />
    </div>
    <div className="space-y-3 p-4 bg-zinc-950/40 rounded border border-white/5">
      <div className="h-3 bg-zinc-850 rounded w-full" />
      <div className="h-3 bg-zinc-850 rounded w-5/6" />
      <div className="h-3 bg-zinc-850 rounded w-4/5" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-12 bg-zinc-900 rounded-lg" />
      <div className="h-12 bg-zinc-900 rounded-lg" />
    </div>
    <div className="space-y-2.5">
      <div className="h-3 bg-zinc-850 rounded w-1/3" />
      <div className="h-10 bg-zinc-900 rounded-lg" />
      <div className="h-10 bg-zinc-900 rounded-lg" />
    </div>
  </div>
);

function AssetsPageContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [detailLoading, setDetailLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const fetchAssets = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assetsApi.getAll();
      setAssets(res || []);
      // If query ID is provided, highlight it. Otherwise default to first twin.
      if (queryId) {
        const found = res.some(a => a.id.toLowerCase() === queryId.toLowerCase());
        if (found) {
          setSelectedAssetId(res.find(a => a.id.toLowerCase() === queryId.toLowerCase())?.id || null);
        } else if (res.length > 0) {
          setSelectedAssetId(res[0].id);
        }
      } else if (res.length > 0) {
        setSelectedAssetId(res[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [queryId]);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  React.useEffect(() => {
    if (!selectedAssetId) {
      setSelectedAsset(null);
      return;
    }
    const fetchDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await assetsApi.getById(selectedAssetId);
        setSelectedAsset(res);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : "Failed to load asset details");
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selectedAssetId]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="success" className="font-semibold">
              Twin Sync Active
            </StatusBadge>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              Hierarchy: Enterprise Plant
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            Asset Twins
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            Explore digital twin properties, hierarchy connections, and sensor flows
          </p>
        </div>
        <button
          onClick={fetchAssets}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition"
        >
          <Icon icon="solar:refresh-linear" className={loading ? "animate-spin" : ""} />
          <span>Sync Hierarchy</span>
        </button>
      </section>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/30 text-red-400 text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-linear" className="text-lg" />
            <span>Operational Fetch Error: {error}</span>
          </div>
          <button onClick={fetchAssets} className="underline text-xs hover:text-white transition">Retry Sync</button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Left Side: Hierarchy Table */}
        <PanelFrame variant="dark" className="rounded-xl flex flex-col min-h-[480px]">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
              Asset Twin Directory
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans uppercase mt-0.5">
              Select any machine twin row to query its real-time telemetry registers
            </p>
          </div>

          <div className="p-4 flex-grow">
            {loading ? (
              <TableSkeleton />
            ) : assets.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-20 font-mono">
                No active asset twins found.
              </p>
            ) : (
              <TableContainer className="border border-white/5">
                <TableHeader>
                  <TableRow className="bg-zinc-950/80 border-b border-white/10 uppercase text-[10px]">
                    <TableHead className="py-3 px-4">Asset ID</TableHead>
                    <TableHead className="py-3 px-4">Asset Name</TableHead>
                    <TableHead className="py-3 px-4">Type</TableHead>
                    <TableHead className="py-3 px-4">Status</TableHead>
                    <TableHead className="py-3 px-4">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`cursor-pointer transition ${
                        selectedAssetId === asset.id
                          ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                          : "hover:bg-zinc-900/40"
                      }`}
                    >
                      <TableCell className="py-3 px-4 font-mono font-semibold text-indigo-400">{asset.id}</TableCell>
                      <TableCell className="py-3 px-4 font-sans font-medium text-white">{asset.name}</TableCell>
                      <TableCell className="py-3 px-4 uppercase text-[10px]">{asset.type}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                          asset.status.toLowerCase() === "active" || asset.status.toLowerCase() === "nominal" || asset.status.toLowerCase() === "operational"
                            ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/50"
                            : "bg-amber-950/30 text-amber-400 border-amber-800/50"
                        }`}>
                          {asset.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-zinc-400 font-sans">{asset.location || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableContainer>
            )}
          </div>
        </PanelFrame>

        {/* Right Side: Detailed twin panel */}
        <div className="space-y-6">
          <PanelFrame variant="dark" className="p-5 min-h-[480px] rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-300 border-b border-white/5 pb-3">
                Digital Twin Inspector
              </h3>

              {detailLoading ? (
                <InspectorSkeleton />
              ) : detailError ? (
                <div className="p-4 rounded-lg bg-red-950/20 text-red-400 border border-red-900/30 text-xs mt-4">
                  Failed to fetch registers: {detailError}
                </div>
              ) : selectedAsset ? (
                <div className="mt-5 space-y-5 text-xs font-sans">
                  {/* General Metadata */}
                  <div>
                    <span className="font-mono text-zinc-500 text-[10px] font-bold uppercase block">{selectedAsset.id}</span>
                    <h4 className="text-sm font-semibold text-white mt-1 leading-snug">{selectedAsset.name}</h4>
                  </div>

                  <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-white/5 space-y-2 leading-relaxed text-zinc-300 text-[11px]">
                    <span className="text-zinc-500 block uppercase font-bold text-[9px] font-sans">Asset Description</span>
                    <p>{selectedAsset.description || "Core digital twin engine calibrated to monitor vibration, RPM, temperature and intake flow limits."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-[10px] bg-zinc-950/45 p-3 rounded-lg border border-white/5">
                    <div>
                      <span className="text-zinc-500 block uppercase font-sans font-bold">Type Model</span>
                      <span className="text-zinc-300 block mt-0.5 uppercase">{selectedAsset.type}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase font-sans font-bold">Location</span>
                      <span className="text-zinc-300 block mt-0.5">{selectedAsset.location || "N/A"}</span>
                    </div>
                  </div>

                  {/* Asset Telemetry Sensor registers */}
                  <div className="space-y-2">
                    <span className="text-zinc-500 block uppercase font-sans font-bold text-[9px] tracking-wide">Dynamic Sensor Ports</span>
                    
                    <div className="flex justify-between items-center bg-zinc-950/60 border border-white/5 p-2.5 rounded-md">
                      <span className="text-zinc-400">Temp_Inlet_01</span>
                      <span className="font-mono text-indigo-400 font-bold">{selectedAsset.id === "Motor-01" ? "24.5" : "72.4"} °C</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/60 border border-white/5 p-2.5 rounded-md">
                      <span className="text-zinc-400">Vibr_Axial_X</span>
                      <span className="font-mono text-indigo-400 font-bold">{selectedAsset.id === "Motor-01" ? "1.45" : "0.85"} mm/s</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col justify-center items-center py-20 text-center text-zinc-500">
                  <Icon icon="solar:gallery-wide-linear" className="text-3xl text-zinc-700 mb-2" />
                  <p className="text-xs">Select any asset twin card to inspect raw field sensors.</p>
                </div>
              )}
            </div>

            {selectedAsset && (
              <div className="pt-4 border-t border-white/5">
                <Link href={`/telemetry?id=${selectedAsset.id}`}>
                  <button className="w-full text-center block text-[10px] font-bold text-white bg-indigo-500/80 hover:bg-indigo-500 px-3 py-2.5 rounded-lg transition uppercase tracking-wider select-none focus-ring">
                    Inspect Real-Time Telemetry &rarr;
                  </button>
                </Link>
              </div>
            )}
          </PanelFrame>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Spinner size={32} />
      </div>
    }>
      <AssetsPageContent />
    </Suspense>
  );
}
