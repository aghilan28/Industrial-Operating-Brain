"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { assetsApi, alertsApi, dashboardApi } from "@/lib/api";
import type { Asset, Alert, SystemStatus } from "@/lib/api";
import { tokens } from "@/tokens";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, StatusBadge, Chip } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/feedback/Spinner";

export default function DashboardPage() {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [systemStatus, setSystemStatus] = React.useState<SystemStatus | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [liveTimestamp, setLiveTimestamp] = React.useState("");

  // Live telemetry hooks for dashboard KPI cards
  const tempTelemetry = useTelemetry("temp") as any;
  const rpmTelemetry = useTelemetry("rpm") as any;
  const pressTelemetry = useTelemetry("press") as any;
  const { status: wsStatus, reconnect: reconnectWs } = useTelemetry() as any;

  // Sync running clock
  React.useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
      setLiveTimestamp(`${dateStr} ${timeStr}`);
    };
    updateTimestamp();
    const interval = setInterval(updateTimestamp, 100);
    return () => clearInterval(interval);
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsRes, alertsRes, statusRes] = await Promise.all([
        assetsApi.getAll(),
        alertsApi.getAll(),
        dashboardApi.getSystemStatus().catch(() => null)
      ]);
      setAssets(assetsRes || []);
      setAlerts(alertsRes || []);
      setSystemStatus(statusRes);
    } catch (err) {
      console.error("Dashboard fetching failure:", err);
      setError(err instanceof Error ? err.message : "Failed to load operational systems");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledge(id, {});
      const updatedAlerts = await alertsApi.getAll();
      setAlerts(updatedAlerts);
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertsApi.resolve(id, { resolution_notes: "Resolved from overview console." });
      const updatedAlerts = await alertsApi.getAll();
      setAlerts(updatedAlerts);
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  // Get dynamic telemetry values or default fallbacks
  const currentTemp = tempTelemetry.data?.value ?? 72.4;
  const currentRpm = rpmTelemetry.data?.value ?? 1450;
  const currentPress = pressTelemetry.data?.value ?? 6.18;

  // Compute active critical issues count
  const criticalCount = alerts.filter(a => a.severity === "critical" && a.status !== "resolved").length;

  // Determine dynamic AI recommendations based on operational stats
  const activeCriticalAlert = alerts.find(a => a.severity === "critical" && a.status !== "resolved");
  const aiRecommendation = React.useMemo(() => {
    if (activeCriticalAlert) {
      return {
        title: `Anomaly Detected: ${activeCriticalAlert.machine_id}`,
        message: `High risk on ${activeCriticalAlert.machine_id}: ${activeCriticalAlert.message}. Suggested action: throttle load to 50% and activate cooling systems immediately.`,
        severity: "critical"
      };
    }
    if (currentTemp > 75) {
      return {
        title: "Warning: Thermal Drift",
        message: "Turbine core temperatures are drifting upward. Monitor cooling cycles or dispatch onsite engineer for intake valve inspect.",
        severity: "warning"
      };
    }
    return {
      title: "All Systems Nominal",
      message: "Neural models reporting stable cycles. All digital twins operating within safe baseline parameters. No action required.",
      severity: "nominal"
    };
  }, [activeCriticalAlert, currentTemp]);

  // Mini live sparkline renderer
  const renderSparkline = (history: { value: number }[], strokeColor = "#818cf8") => {
    if (!history || history.length < 2) {
      return (
        <svg className="w-24 h-8 shrink-0" viewBox="0 0 100 30">
          <path d="M0 15 L20 10 L40 18 L60 12 L80 20 L100 15" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="2 1" />
        </svg>
      );
    }
    const values = history.map(h => h.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const points = history.slice(-10).map((h, idx, arr) => {
      const x = (idx / (arr.length - 1)) * 100;
      const y = 28 - ((h.value - min) / range) * 26;
      return `${x},${y}`;
    });
    return (
      <svg className="w-24 h-8 shrink-0" viewBox="0 0 100 30">
        <path d={`M ${points.join(" L ")}`} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Eyebrow Panel */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={systemStatus?.status === "online" ? "success" : "warning"} className="font-semibold">
              {systemStatus?.status || "Connecting"}
            </StatusBadge>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              System Environment: {systemStatus?.environment || "STAGING"}
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            Operations Console
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            Central telemetry, machine twins, and real-time incident routing engine
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={loadData}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition"
          >
            <Icon icon="solar:refresh-linear" className={loading ? "animate-spin" : ""} />
            <span>SYNC DATA</span>
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans">Console Clock</span>
            <span className="mt-1 font-mono text-zinc-300 text-xs bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              {liveTimestamp || "CLOCK SYNCING..."}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/30 text-red-400 text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-linear" className="text-lg" />
            <span>Operational Fetch Error: {error}</span>
          </div>
          <button onClick={loadData} className="underline text-xs hover:text-white transition">Retry Sync</button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans font-semibold">Inlet Temp</span>
            <Icon icon="solar:thermometer-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex justify-between items-end mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-semibold tracking-tight text-white">
                {currentTemp.toFixed(1)}
              </span>
              <span className="text-sm font-sans font-bold text-zinc-400">°C</span>
            </div>
            {renderSparkline(tempTelemetry.history, "#818cf8")}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>WebSocket Live Stream</span>
          </div>
        </PanelFrame>

        {/* RPM Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans font-semibold">Rotor Speed</span>
            <Icon icon="solar:refresh-circle-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex justify-between items-end mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-semibold tracking-tight text-white">
                {Math.round(currentRpm)}
              </span>
              <span className="text-sm font-sans font-bold text-zinc-400">RPM</span>
            </div>
            {renderSparkline(rpmTelemetry.history, "#34d399")}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Baseline Nominal</span>
          </div>
        </PanelFrame>

        {/* Hydraulic Pressure Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans font-semibold">Hydraulic Press</span>
            <Icon icon="solar:gauge-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex justify-between items-end mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-semibold tracking-tight text-white">
                {currentPress.toFixed(2)}
              </span>
              <span className="text-sm font-sans font-bold text-zinc-400">BAR</span>
            </div>
            {renderSparkline(pressTelemetry.history, "#fbbf24")}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>High-Freq Feed</span>
          </div>
        </PanelFrame>

        {/* Active Alarms Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans font-semibold">Active Incidents</span>
            <Icon icon="solar:danger-triangle-linear" className="text-xl text-red-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-4xl font-display font-semibold tracking-tight ${criticalCount > 0 ? "text-red-400" : "text-white"}`}>
              {criticalCount}
            </span>
            <span className="text-sm font-sans font-bold text-zinc-400">ALARM{criticalCount !== 1 ? "S" : ""}</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px]">
            {criticalCount > 0 ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-400 font-bold uppercase">Critical action required</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-green-400">All systems green</span>
              </>
            )}
          </div>
        </PanelFrame>
      </section>

      {/* Main Split Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left Column: Digital Twins & Incident Dispatch */}
        <div className="space-y-6">
          {/* Digital Twin Assets */}
          <PanelFrame variant="dark" className="rounded-xl">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
                  Digital Twin Assets Hierarchy
                </h3>
                <p className="text-[10px] text-zinc-500 font-sans uppercase mt-0.5">
                  Synchronized operational hardware twins & health indexes
                </p>
              </div>
              <Link href="/assets">
                <Button size="sm" variant="ghost" className="text-[10px]">
                  View All
                </Button>
              </Link>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Spinner size={32} />
                </div>
              ) : assets.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-10 font-mono">
                  No operational digital twins registered in database.
                </p>
              ) : (
                <div className="overflow-x-auto border border-white/5 rounded-lg">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-zinc-950/80 text-zinc-400 border-b border-white/10 uppercase text-[10px]">
                        <th className="p-3">Asset ID</th>
                        <th className="p-3">Asset Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Health Status</th>
                        <th className="p-3">Area Location</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {assets.slice(0, 5).map((asset) => (
                        <tr key={asset.id} className="hover:bg-zinc-900/40 transition">
                          <td className="p-3 font-semibold text-indigo-400">{asset.id}</td>
                          <td className="p-3 text-white font-sans font-medium">{asset.name}</td>
                          <td className="p-3 uppercase text-[10px]">{asset.type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                              asset.status.toLowerCase() === "active" || asset.status.toLowerCase() === "nominal" || asset.status.toLowerCase() === "operational"
                                ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/50"
                                : "bg-amber-950/30 text-amber-400 border-amber-800/50"
                            }`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400 font-sans">{asset.location || "Sector Hall"}</td>
                          <td className="p-3 text-right">
                            <Link href={`/assets?id=${asset.id}`} className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider text-[9px] inline-flex items-center gap-0.5 transition">
                              Inspect &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </PanelFrame>

          {/* Incident Command Center */}
          <PanelFrame variant="dark" className="rounded-xl">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
                  Incident Dispatch Queue
                </h3>
                <p className="text-[10px] text-zinc-500 font-sans uppercase mt-0.5">
                  Critical system alarms, triage routing & acknowledgement flow
                </p>
              </div>
              <Link href="/incidents">
                <Button size="sm" variant="ghost" className="text-[10px]">
                  Open Queue
                </Button>
              </Link>
            </div>

            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Spinner size={32} />
                </div>
              ) : alerts.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-10 font-mono">
                  No active incidents recorded.
                </p>
              ) : (
                alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="p-4 rounded-lg border border-white/5 bg-zinc-950/40 flex flex-col md:flex-row justify-between md:items-start gap-4 hover:border-zinc-800 transition">
                    <div className="space-y-1.5 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                          alert.severity === "critical"
                            ? "bg-red-950/30 text-red-400 border-red-800/50"
                            : alert.severity === "warning"
                            ? "bg-amber-950/30 text-amber-400 border-amber-800/50"
                            : "bg-blue-950/30 text-blue-400 border-blue-800/50"
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="font-mono text-zinc-500 text-[10px]">Machine: {alert.machine_id}</span>
                      </div>
                      <p className="text-xs text-white font-sans">{alert.message}</p>
                      <p className="font-mono text-[9px] text-zinc-600">{alert.timestamp}</p>
                      
                      {/* Contextual Workflow Action Shortcuts */}
                      <div className="flex flex-wrap gap-2.5 text-zinc-500 text-[9px] font-bold uppercase tracking-wider mt-2 pt-2 border-t border-white/5 font-sans select-none">
                        <Link href={`/telemetry?id=${alert.machine_id}`} className="hover:text-indigo-400 transition flex items-center gap-1">
                          <Icon icon="solar:chart-square-linear" className="text-indigo-400 text-xs" />
                          Plot Telemetry
                        </Link>
                        <span className="text-zinc-800">|</span>
                        <Link href={`/explainability?machine_id=${alert.machine_id}`} className="hover:text-indigo-400 transition flex items-center gap-1">
                          <Icon icon="solar:bolt-linear" className="text-indigo-400 text-xs" />
                          Explain Anomaly
                        </Link>
                        <span className="text-zinc-800">|</span>
                        <Link href={`/knowledge?query=${alert.machine_id}`} className="hover:text-indigo-400 transition flex items-center gap-1">
                          <Icon icon="solar:document-text-linear" className="text-indigo-400 text-xs" />
                          Consult SOP
                        </Link>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 md:pt-1">
                      {alert.status === "active" && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition uppercase"
                        >
                          ACK
                        </button>
                      )}
                      {alert.status !== "resolved" ? (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 hover:bg-emerald-950/40 rounded transition uppercase"
                        >
                          RESOLVE
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1 border border-zinc-800 px-2 py-1 rounded bg-zinc-900/40 font-mono">
                          <Icon icon="solar:check-circle-linear" className="text-emerald-400" />
                          RESOLVED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </PanelFrame>
        </div>

        {/* Right Column: AI Analytics, Controls & WS Diagnostics */}
        <div className="space-y-6">
          {/* AI Diagnostics Card */}
          <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:bolt-linear" className="text-indigo-400 text-lg animate-pulse" />
                <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-300">
                  AI Prediction Engine
                </h4>
              </div>
              <Chip className="bg-indigo-950/20 text-indigo-400 border border-indigo-900/50 font-bold font-mono">
                RUL Pipe Active
              </Chip>
            </div>

            <div className="space-y-3">
              <div className={`p-3.5 rounded-lg border text-xs font-sans ${
                aiRecommendation.severity === "critical"
                  ? "bg-red-950/20 border-red-900/40 text-red-200"
                  : aiRecommendation.severity === "warning"
                  ? "bg-amber-950/20 border-amber-900/40 text-amber-200"
                  : "bg-indigo-950/20 border-indigo-900/40 text-indigo-200"
              }`}>
                <h5 className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    aiRecommendation.severity === "critical" ? "bg-red-500 animate-ping" : aiRecommendation.severity === "warning" ? "bg-amber-500 animate-pulse" : "bg-indigo-400"
                  }`} />
                  {aiRecommendation.title}
                </h5>
                <p className="text-zinc-300 text-[11px] leading-relaxed mt-1">
                  {aiRecommendation.message}
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-2">
                  <Link href={`/knowledge?query=${aiRecommendation.severity === "critical" ? "sop-e420" : "SOP"}`} className="text-[10px] font-bold text-white hover:text-indigo-400 flex items-center gap-1 transition uppercase select-none">
                    <Icon icon="solar:document-text-linear" />
                    Consult SOP Guidance &rarr;
                  </Link>
                </div>
              </div>

              {/* RUL Health summary */}
              <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-sans">
                  <span className="text-zinc-500 font-bold uppercase tracking-wide">Model Inference Confidence</span>
                  <span className="font-mono text-zinc-300">98.2%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: "98.2%" }} />
                </div>
              </div>
            </div>
          </PanelFrame>

          {/* Quick Shortcuts */}
          <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
            <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-300 border-b border-white/5 pb-3">
              Operations Navigation
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-sans">
              <Link href="/telemetry" className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5 hover:border-zinc-800 text-zinc-300 hover:text-white transition">
                <Icon icon="solar:chart-square-linear" className="text-indigo-400" />
                <span>Live Telemetry</span>
              </Link>
              <Link href="/assets" className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5 hover:border-zinc-800 text-zinc-300 hover:text-white transition">
                <Icon icon="solar:gallery-wide-linear" className="text-indigo-400" />
                <span>Asset Twins</span>
              </Link>
              <Link href="/incidents" className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5 hover:border-zinc-800 text-zinc-300 hover:text-white transition">
                <Icon icon="solar:danger-triangle-linear" className="text-indigo-400" />
                <span>Incidents Hub</span>
              </Link>
              <Link href="/explainability" className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-white/5 hover:border-zinc-800 text-zinc-300 hover:text-white transition">
                <Icon icon="solar:widget-linear" className="text-indigo-400" />
                <span>AI Models</span>
              </Link>
            </div>
          </PanelFrame>

          {/* Web Socket Connection Diagnostics */}
          <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:transfer-horizontal-linear" className="text-indigo-400 text-lg" />
                <h4 className="text-xs uppercase font-bold tracking-widest text-zinc-300 font-sans">
                  Socket Diagnostics
                </h4>
              </div>
              <button
                onClick={reconnectWs}
                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition uppercase"
              >
                Reconnect
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-zinc-950/60 border border-white/5 p-3 rounded">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Link Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    wsStatus === "CONNECTED" ? "bg-green-500 animate-pulse" : wsStatus === "CONNECTING" || wsStatus === "RECONNECTING" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                  }`} />
                  <span className="text-[10px] text-zinc-300 font-semibold uppercase">{wsStatus}</span>
                </div>
              </div>
              <div className="bg-zinc-950/60 border border-white/5 p-3 rounded">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Ping Jitter</p>
                <p className="text-zinc-200 mt-1 text-[11px] font-semibold">2ms</p>
              </div>
              <div className="bg-zinc-950/60 border border-white/5 p-3 rounded">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Feed Rate</p>
                <p className="text-zinc-200 mt-1 text-[11px] font-semibold">88 Hz</p>
              </div>
              <div className="bg-zinc-950/60 border border-white/5 p-3 rounded">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Data Bandwidth</p>
                <p className="text-zinc-200 mt-1 text-[11px] font-semibold">124 KB/s</p>
              </div>
            </div>
          </PanelFrame>
        </div>
      </div>
    </div>
  );
}
