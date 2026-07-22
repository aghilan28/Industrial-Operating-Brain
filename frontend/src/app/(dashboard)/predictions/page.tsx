"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { tokens } from "@/tokens";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, StatusBadge, Chip } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/feedback/Spinner";
import Link from "next/link";

type PredictionsData = {
  machineId: string;
  predictedRulHours: number;
  anomalyProbability: number;
  healthIndex: number;
  modelConfidence: number;
};

const PREDICTIONS: Record<string, PredictionsData> = {
  "Turbine-04": {
    machineId: "Turbine-04",
    predictedRulHours: 124,
    anomalyProbability: 4.2,
    healthIndex: 91.5,
    modelConfidence: 98.4
  },
  "Motor-01": {
    machineId: "Motor-01",
    predictedRulHours: 540,
    anomalyProbability: 0.8,
    healthIndex: 98.2,
    modelConfidence: 96.1
  },
  "Compressor-02": {
    machineId: "Compressor-02",
    predictedRulHours: 88,
    anomalyProbability: 14.6,
    healthIndex: 82.1,
    modelConfidence: 94.7
  }
};

function PredictionsPageContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [selectedMachine, setSelectedMachine] = React.useState("Turbine-04");
  const [liveTimestamp, setLiveTimestamp] = React.useState("");

  // Sync selected machine if queryId matches one of our known machines
  React.useEffect(() => {
    if (queryId) {
      const match = ["Turbine-04", "Motor-01", "Compressor-02"].find(
        (m) => m.toLowerCase() === queryId.toLowerCase()
      );
      if (match) {
        setSelectedMachine(match);
      }
    }
  }, [queryId]);

  // Live telemetry to link health state
  const tempTelemetry = useTelemetry("temp") as any;
  const currentTemp = tempTelemetry.data?.value ?? 72.4;

  // Running clock sync
  React.useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date();
      setLiveTimestamp(now.toISOString().replace('T', ' ').substring(0, 23));
    };
    updateTimestamp();
    const interval = setInterval(updateTimestamp, 100);
    return () => clearInterval(interval);
  }, []);

  const currentData = PREDICTIONS[selectedMachine] || PREDICTIONS["Turbine-04"];

  // Generate SVG coordinates for health index regression curve
  const chartPoints = React.useMemo(() => {
    const points = [];
    const health = currentData.healthIndex;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * 800;
      const factor = i * i * 0.22;
      const y = 260 - ((health - factor) / 100) * 220; // scale between [40, 260] height
      points.push({ x, y });
    }
    return points;
  }, [currentData]);

  // Generate confidence intervals upper/lower bounds
  const confidenceBoundsPoints = React.useMemo(() => {
    const health = currentData.healthIndex;
    const upper = [];
    const lower = [];
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * 800;
      const factor = i * i * 0.22;
      // Divergence uncertainty over time horizon (LSTMs uncertainty grows)
      const uncertainty = i * 1.6;
      const baseVal = health - factor;
      
      const yUpper = 260 - (Math.min(100, baseVal + uncertainty) / 100) * 220;
      const yLower = 260 - (Math.max(0, baseVal - uncertainty) / 100) * 220;
      
      upper.push({ x, y: yUpper });
      lower.push({ x, y: yLower });
    }
    return { upper, lower };
  }, [currentData]);

  const polygonPointsStr = React.useMemo(() => {
    const { upper, lower } = confidenceBoundsPoints;
    if (upper.length === 0) return "";
    const part1 = upper.map(p => `${p.x},${p.y}`).join(" ");
    const part2 = [...lower].reverse().map(p => `${p.x},${p.y}`).join(" ");
    return `${part1} ${part2}`;
  }, [confidenceBoundsPoints]);

  const lineD = React.useMemo(() => {
    if (chartPoints.length === 0) return "";
    return "M" + chartPoints.map(p => `${p.x} ${p.y}`).join(" L");
  }, [chartPoints]);

  const areaD = React.useMemo(() => {
    if (chartPoints.length === 0) return "";
    return `${lineD} V300 H0 Z`;
  }, [lineD, chartPoints]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={currentData.anomalyProbability > 10 ? "danger" : currentData.anomalyProbability > 3 ? "warning" : "success"} className="font-semibold">
              Predictive Pipeline Active
            </StatusBadge>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              Model: LSTM Regression v2.1
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            Predictive Intelligence
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            Remaining Useful Life (RUL) models and anomaly probability curves
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans font-medium">Select Target Twin</span>
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 gap-1 mt-1">
              {Object.keys(PREDICTIONS).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMachine(m)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition uppercase tracking-wider ${
                    selectedMachine === m
                      ? 'bg-indigo-500 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans">Prediction Clock</span>
            <span className="mt-1 font-mono text-zinc-300 text-xs bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              {liveTimestamp}
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RUL Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Remaining Useful Life</span>
            <Icon icon="solar:hourglass-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-display font-semibold tracking-tight ${currentData.predictedRulHours < 100 ? "text-red-400" : "text-white"}`}>
              {currentData.predictedRulHours}
            </span>
            <span className="text-sm font-sans font-bold text-zinc-400">HOURS</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            Estimated time to maintenance window
          </div>
        </PanelFrame>

        {/* Anomaly Probability Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Anomaly Probability</span>
            <Icon icon="solar:danger-triangle-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-display font-semibold tracking-tight ${currentData.anomalyProbability > 10 ? "text-red-400" : "text-white"}`}>
              {currentData.anomalyProbability.toFixed(1)}
            </span>
            <span className="text-sm font-sans font-bold text-zinc-400">%</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            Real-time inference probability
          </div>
        </PanelFrame>

        {/* Health Index Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Overall Health Index</span>
            <Icon icon="solar:heart-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display font-semibold tracking-tight text-white">
              {currentData.healthIndex.toFixed(1)}
            </span>
            <span className="text-sm font-sans font-bold text-zinc-400">/100</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            Aggregated sensor drift index
          </div>
        </PanelFrame>

        {/* Model Confidence Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Model Confidence</span>
            <Icon icon="solar:bolt-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display font-semibold tracking-tight text-white">
              {currentData.modelConfidence.toFixed(1)}
            </span>
            <span className="text-sm font-sans font-bold text-zinc-400">%</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            LSTM predictive fit accuracy
          </div>
        </PanelFrame>
      </section>

      {/* Anomaly Trend Curves */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <PanelFrame variant="dark" className="rounded-xl flex flex-col min-h-[480px]">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
                Health Regression Forecast Curve
              </h3>
              <p className="text-[10px] text-zinc-500 font-sans uppercase mt-0.5">
                95% prediction interval (shaded) showing trajectory toward critical 70% threshold
              </p>
            </div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase border border-zinc-800 px-2 py-1 rounded bg-zinc-950">
              Active Scope: 72H Horizon
            </span>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-between">
            <div className="flex-grow relative h-[280px] border-l border-b border-zinc-800">
              <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rulGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.12"></stop>
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line x1="0" y1="75" x2="800" y2="75" stroke="#1f2937" strokeDasharray="4" strokeWidth="0.5" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#1f2937" strokeDasharray="4" strokeWidth="0.5" />
                <line x1="0" y1="225" x2="800" y2="225" stroke="#1f2937" strokeDasharray="4" strokeWidth="0.5" />

                {/* Y Axis percentage ticks */}
                <text x="12" y="45" className="fill-zinc-500 font-mono text-[9px] font-bold">100% Health</text>
                <text x="12" y="150" className="fill-zinc-500 font-mono text-[9px] font-bold">75% Health</text>
                <text x="12" y="260" className="fill-zinc-500 font-mono text-[9px] font-bold">50% Health</text>

                {/* Shaded 95% Confidence bounds */}
                {polygonPointsStr && (
                  <polygon points={polygonPointsStr} fill="#818cf8" fillOpacity="0.08" />
                )}

                {/* Critical threshold line at 70% health */}
                <line x1="0" y1="180" x2="800" y2="180" stroke="#f87171" strokeDasharray="8 4" strokeWidth="1.5" />
                <text x="680" y="172" className="fill-red-400/80 font-sans text-[10px] font-bold uppercase tracking-wider">Critical Threshold (70%)</text>

                {/* Gradient area */}
                {areaD && <path d={areaD} fill="url(#rulGradient)" className="transition-all duration-500" />}

                {/* Line Path */}
                {lineD && (
                  <path
                    d={lineD}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
              </svg>
            </div>
            <div className="flex justify-between mt-3 px-2">
              <span className="font-mono text-[10px] text-zinc-500">Current Cycle</span>
              <span className="font-mono text-[10px] text-zinc-500">+12 Hours</span>
              <span className="font-mono text-[10px] text-zinc-500">+24 Hours</span>
              <span className="font-mono text-[10px] text-zinc-500">+48 Hours</span>
              <span className="font-mono text-[10px] text-zinc-500">+72 Hours (T_LIMIT)</span>
            </div>
          </div>
        </PanelFrame>

        {/* Right side diagnostics */}
        <div className="space-y-6">
          <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
            <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-300 border-b border-white/5 pb-3">
              Predictive Diagnostics
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5 font-sans">
                <span className="text-zinc-500 font-sans font-medium">Model Type</span>
                <span className="font-mono text-zinc-300">LSTM / Autoencoder</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5 font-sans">
                <span className="text-zinc-500 font-sans font-medium">Last Training Date</span>
                <span className="font-mono text-zinc-300">2026-07-20 04:12</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5 font-sans">
                <span className="text-zinc-500 font-sans font-medium">Re-training Trigger</span>
                <span className="text-emerald-400 font-semibold">Automatic (Drift &gt; 5%)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5 font-sans">
                <span className="text-zinc-500 font-sans font-medium">Active Warning Profile</span>
                <span className="text-zinc-300 font-mono">None</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5">
              <Link href={`/explainability?machine_id=${currentData.machineId}`} className="w-full text-center block text-[10px] font-bold text-white bg-indigo-500/80 hover:bg-indigo-500 px-3 py-1.5 rounded transition uppercase tracking-wider select-none">
                Explain Anomaly Weights &rarr;
              </Link>
            </div>
          </PanelFrame>

          <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
            <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-300 border-b border-white/5 pb-3">
              Anomaly Trigger Logs
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-zinc-950/60 rounded border border-white/5 text-[11px] font-sans">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-zinc-300">Temp Excursion Warning</span>
                  <span className="font-mono text-zinc-500 text-[10px]">10:04</span>
                </div>
                <p className="text-zinc-400 mt-1">Temp drift on {currentData.machineId} core reached 72.4°C.</p>
              </div>
              <div className="p-3 bg-zinc-950/60 rounded border border-white/5 text-[11px] font-sans">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-zinc-300">RPM Fluctuations</span>
                  <span className="font-mono text-zinc-500 text-[10px]">Yesterday</span>
                </div>
                <p className="text-zinc-400 mt-1">Jitter drift observed under load transitions.</p>
              </div>
            </div>
          </PanelFrame>
        </div>
      </section>
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Spinner size={32} />
      </div>
    }>
      <PredictionsPageContent />
    </Suspense>
  );
}
