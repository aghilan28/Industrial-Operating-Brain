"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { alertsApi } from "@/lib/api";
import type { Alert } from "@/lib/api";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/feedback/Spinner";
import Link from "next/link";

const TableSkeleton = () => (
  <div className="space-y-3.5 animate-pulse" aria-label="Loading incidents queue">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between py-4 px-4 border border-white/5 rounded-lg bg-zinc-900/25">
        <div className="h-4 bg-zinc-800 rounded w-24" />
        <div className="h-4 bg-zinc-800 rounded w-16" />
        <div className="h-4 bg-zinc-800 rounded w-12" />
        <div className="h-4 bg-zinc-800 rounded w-20" />
        <div className="h-4 bg-zinc-800 rounded w-48" />
        <div className="h-4 bg-zinc-800 rounded w-14" />
        <div className="h-4 bg-zinc-800 rounded w-28" />
        <div className="h-4 bg-zinc-800 rounded w-16" />
      </div>
    ))}
  </div>
);

function IncidentsPageContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [searchText, setSearchText] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("all");

  // Pre-populate search query if id parameter is provided
  React.useEffect(() => {
    if (queryId) {
      setSearchText(queryId);
    }
  }, [queryId]);

  const fetchAlerts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await alertsApi.getAll();
      setAlerts(res || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledge(id, {});
      const updated = await alertsApi.getAll();
      setAlerts(updated || []);
    } catch (err) {
      console.error("Failed to acknowledge:", err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertsApi.resolve(id, { resolution_notes: "Resolved from Incident Center console." });
      const updated = await alertsApi.getAll();
      setAlerts(updated || []);
    } catch (err) {
      console.error("Failed to resolve:", err);
    }
  };

  // Filter alerts locally
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.machine_id.toLowerCase().includes(searchText.toLowerCase()) ||
        alert.id.toLowerCase().includes(searchText.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchText.toLowerCase());
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [alerts, searchText, severityFilter]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={alerts.some(a => a.severity === "critical" && a.status !== "resolved") ? "danger" : "success"} className="font-semibold">
              Operational Alarm Line
            </StatusBadge>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              Queue Status: {alerts.filter(a => a.status !== "resolved").length} Active
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            Incident Dispatch
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            Triage, acknowledge, and resolve active machine alarms and sensor excursions
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition focus-ring"
        >
          <Icon icon="solar:refresh-linear" className={loading ? "animate-spin" : ""} />
          <span>Sync Alarms</span>
        </button>
      </section>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/30 text-red-400 text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-linear" className="text-lg" />
            <span>Operational Fetch Error: {error}</span>
          </div>
          <button onClick={fetchAlerts} className="underline text-xs hover:text-white transition focus-ring">Retry Sync</button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <PanelFrame variant="dark" className="p-4 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex-1 max-w-sm flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search by ID, Machine or message..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full text-zinc-100"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-bold font-sans uppercase shrink-0 px-2 py-1.5 border border-zinc-850 rounded hover:bg-zinc-900 transition focus-ring"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative min-w-[150px]">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none uppercase font-bold tracking-wider focus-ring"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono text-right uppercase">
            Showing {filteredAlerts.length} of {alerts.length} incidents
          </span>
        </div>
      </PanelFrame>

      {/* Incidents Table List */}
      <PanelFrame variant="dark" className="rounded-xl flex flex-col min-h-[400px]">
        <div className="p-4 flex-grow">
          {loading ? (
            <TableSkeleton />
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20 text-center text-zinc-500">
              <Icon icon="solar:bell-off-linear" className="text-3xl text-zinc-700 mb-2" />
              <p className="text-xs">No active or logged incidents found matching selected filter criteria.</p>
            </div>
          ) : (
            <TableContainer className="border border-white/5">
              <TableHeader>
                <TableRow className="bg-zinc-950/80 border-b border-white/10 uppercase text-[10px]">
                  <TableHead className="py-3 px-4">Timestamp</TableHead>
                  <TableHead className="py-3 px-4">Alert ID</TableHead>
                  <TableHead className="py-3 px-4">Severity</TableHead>
                  <TableHead className="py-3 px-4">Machine ID</TableHead>
                  <TableHead className="py-3 px-4">Message</TableHead>
                  <TableHead className="py-3 px-4 text-center">Status</TableHead>
                  <TableHead className="py-3 px-4">Diagnostics</TableHead>
                  <TableHead className="py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className="hover:bg-zinc-900/40 transition">
                    <TableCell className="py-3 px-4 font-mono text-zinc-500 truncate max-w-[120px]" title={alert.timestamp}>
                      {alert.timestamp}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono font-semibold text-zinc-400 truncate max-w-[80px]" title={alert.id}>
                      {alert.id}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                        alert.severity === "critical"
                          ? "bg-red-950/30 text-red-400 border-red-800/50"
                          : alert.severity === "warning"
                          ? "bg-amber-950/30 text-amber-400 border-amber-800/50"
                          : "bg-blue-950/30 text-blue-400 border-blue-800/50"
                      }`}>
                        {alert.severity}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono text-indigo-400 font-semibold">{alert.machine_id}</TableCell>
                    <TableCell className="py-3 px-4 font-sans text-white text-[13px]" title={alert.message}>{alert.message}</TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono ${
                        alert.status === "active"
                          ? "text-red-400 bg-red-950/20 border border-red-950"
                          : alert.status === "acknowledged"
                          ? "text-amber-400 bg-amber-950/20 border border-amber-950"
                          : "text-zinc-500 bg-zinc-900/40 border border-zinc-800"
                      }`}>
                        {alert.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex gap-2.5 items-center text-[10px] font-sans font-bold uppercase tracking-wider select-none text-zinc-400">
                        <Link href={`/telemetry?id=${alert.machine_id}`} title="Inspect live sensor chart" className="hover:text-indigo-400 transition flex items-center gap-0.5 focus-ring rounded">
                          <Icon icon="solar:chart-square-linear" className="text-xs" />
                          Plot
                        </Link>
                        <span>|</span>
                        <Link href={`/explainability?machine_id=${alert.machine_id}`} title="Explain prediction anomaly SHAP value weights" className="hover:text-indigo-400 transition flex items-center gap-0.5 focus-ring rounded">
                          <Icon icon="solar:bolt-linear" className="text-xs" />
                          XAI
                        </Link>
                        <span>|</span>
                        <Link href={`/knowledge?query=${alert.machine_id}`} title="Lookup emergency SOP manuals" className="hover:text-indigo-400 transition flex items-center gap-0.5 focus-ring rounded">
                          <Icon icon="solar:document-text-linear" className="text-xs" />
                          SOP
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        {alert.status === "active" && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition uppercase focus-ring"
                          >
                            ACK
                          </button>
                        )}
                        {alert.status !== "resolved" ? (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 hover:bg-emerald-950/40 rounded transition uppercase focus-ring"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1 border border-zinc-800 px-2 py-1 rounded bg-zinc-900/40 font-mono">
                            <Icon icon="solar:check-circle-linear" className="text-emerald-400" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          )}
        </div>
      </PanelFrame>
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Spinner size={32} />
      </div>
    }>
      <IncidentsPageContent />
    </Suspense>
  );
}
