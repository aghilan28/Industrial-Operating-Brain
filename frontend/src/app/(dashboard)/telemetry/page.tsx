"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ConnectionBadge } from "@/components/telemetry/ConnectionBadge";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Spinner } from "@/components/feedback/Spinner";

type SensorKey = 'temp' | 'press' | 'rpm' | 'volt' | 'vibr';

const EMPTY_ARRAY: any[] = [];

const CURRENT_UNITS: Record<SensorKey, string> = {
  temp: "°C",
  press: "BAR",
  rpm: "RPM",
  volt: "V",
  vibr: "mm/s",
};

function TelemetryPageContent() {
  const searchParams = useSearchParams();
  const querySensor = searchParams.get("sensor") as SensorKey | null;
  const queryId = searchParams.get("id");

  const [selectedSensor, setSelectedSensor] = React.useState<SensorKey>('temp');
  const [hoveredPoint, setHoveredPoint] = React.useState<{ x: number; y: number; value: number; timestamp: string } | null>(null);

  // Handle setting active sensor from query parameter
  React.useEffect(() => {
    if (querySensor && ['temp', 'press', 'rpm', 'volt', 'vibr'].includes(querySensor)) {
      setSelectedSensor(querySensor);
    }
  }, [querySensor]);

  // Telemetry stream hooks
  const tempTelemetry = useTelemetry("temp") as any;
  const pressTelemetry = useTelemetry("press") as any;
  const rpmTelemetry = useTelemetry("rpm") as any;
  const voltTelemetry = useTelemetry("volt") as any;
  const vibrTelemetry = useTelemetry("vibr") as any;

  // Active stream depending on selected key
  const activeTelemetry = useTelemetry(selectedSensor) as any;
  const liveData = activeTelemetry.data;
  const historyData = activeTelemetry.history || EMPTY_ARRAY;

  const [uptimeSeconds, setUptimeSeconds] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe coordinates
  const currentTemp = tempTelemetry.data?.value ?? 72.4;
  const currentPress = pressTelemetry.data?.value ?? 6.18;
  const currentRpm = rpmTelemetry.data?.value ?? 1450;
  const currentVolt = voltTelemetry.data?.value ?? 480;
  const currentVibr = vibrTelemetry.data?.value ?? 0.85;



  // Build dynamic machine names based on query contexts
  const activeMachineName = queryId ? `IOB-${queryId.toUpperCase()}` : "IOB-TURBINE-04";
  const activeMachineIdLabel = queryId ? `${queryId.toUpperCase()}-ALPHA` : "TX-40092-ALPHA";
  const activeMachineLocation = queryId ? `Enterprise Plant, Area ${queryId.slice(-2)}` : "Sector G-14, Hall 3";

  // Build SVG points for time-series charts
  const points = React.useMemo(() => {
    if (historyData.length < 2) {
      // Mock layout coords
      return [
        { x: 0, y: 150 },
        { x: 80, y: 140 },
        { x: 160, y: 160 },
        { x: 240, y: 130 },
        { x: 320, y: 180 },
        { x: 400, y: 110 },
        { x: 480, y: 160 },
        { x: 560, y: 140 },
        { x: 640, y: 150 },
        { x: 720, y: 120 },
        { x: 800, y: 130 }
      ];
    }
    const maxVal = Math.max(...historyData.map((d: any) => d.value), 1);
    const minVal = Math.min(...historyData.map((d: any) => d.value), 0);
    const range = maxVal - minVal || 1;

    return historyData.map((item: any, idx: number) => {
      const x = (idx / (historyData.length - 1)) * 800;
      // map to chart height [40, 260]
      const y = 260 - ((item.value - minVal) / range) * 220;
      return { x, y };
    });
  }, [historyData]);

  const lineD = React.useMemo(() => {
    if (points.length === 0) return "";
    return "M" + points.map((p: any) => `${p.x} ${p.y}`).join(" L");
  }, [points]);

  const areaD = React.useMemo(() => {
    if (points.length === 0) return "";
    return `${lineD} V300 H0 Z`;
  }, [lineD, points]);

  const timeLabels = React.useMemo(() => {
    if (historyData.length === 0) {
      return ["-15M", "-10M", "-5M", "LIVE"];
    }
    const step = Math.floor(historyData.length / 4) || 1;
    const labels = [];
    for (let i = 0; i < historyData.length; i += step) {
      const item = historyData[i];
      if (item && item.timestamp) {
        labels.push(item.timestamp.split(" ")[1] || item.timestamp);
      }
    }
    if (labels.length < 4 && historyData[historyData.length - 1]) {
      labels.push(historyData[historyData.length - 1].timestamp.split(" ")[1]);
    }
    return labels.slice(0, 4);
  }, [historyData]);

  const eventLog = React.useMemo(() => {
    if (historyData.length === 0) return [];
    return historyData.slice(-10).reverse().map((item: any, index: number) => ({
      id: `${item.timestamp}-${index}`,
      timestamp: item.timestamp,
      sensor: selectedSensor.toUpperCase(),
      machine: queryId ? queryId.toUpperCase() : "TURBINE-04",
      value: item.value.toFixed(selectedSensor === "press" ? 2 : 1),
      unit: CURRENT_UNITS[selectedSensor],
      status: "NOMINAL",
      quality: "100.0%"
    }));
  }, [historyData, selectedSensor, queryId]);

  // Industrial Threshold Calculations
  const thresholdValue = { temp: 75.0, press: 8.0, rpm: 1800.0, volt: 500.0, vibr: 1.5 }[selectedSensor];
  const thresholdY = React.useMemo(() => {
    if (historyData.length < 2) return 100;
    const maxVal = Math.max(...historyData.map((d: any) => d.value), 1);
    const minVal = Math.min(...historyData.map((d: any) => d.value), 0);
    const range = maxVal - minVal || 1;
    if (thresholdValue > maxVal) return -50; // threshold is out of view
    return 260 - ((thresholdValue - minVal) / range) * 220;
  }, [historyData, thresholdValue]);

  // Y-Axis labels
  const yTicks = React.useMemo(() => {
    if (historyData.length < 2) return ["High", "Mid", "Low"];
    const maxVal = Math.max(...historyData.map((d: any) => d.value), 1);
    const minVal = Math.min(...historyData.map((d: any) => d.value), 0);
    const midVal = (maxVal + minVal) / 2;
    const unit = CURRENT_UNITS[selectedSensor];
    return [
      `${maxVal.toFixed(selectedSensor === "press" ? 2 : 1)} ${unit}`,
      `${midVal.toFixed(selectedSensor === "press" ? 2 : 1)} ${unit}`,
      `${minVal.toFixed(selectedSensor === "press" ? 2 : 1)} ${unit}`
    ];
  }, [historyData, selectedSensor]);

  // Interactive Hover logic
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (historyData.length === 0 || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = (e.clientX - rect.left) / rect.width;
    const idx = Math.min(Math.max(Math.round(xPercent * (historyData.length - 1)), 0), historyData.length - 1);
    const item = historyData[idx];
    const pt = points[idx];
    if (item && pt) {
      setHoveredPoint({
        x: pt.x,
        y: pt.y,
        value: item.value,
        timestamp: item.timestamp
      });
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ConnectionBadge />
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              Stream Protocol: JSON WebSockets
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            Sensor Telemetry
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            High-frequency time-series graphs and diagnostic metrics for {activeMachineName}
          </p>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temp Card */}
        <PanelFrame variant={selectedSensor === "temp" ? "hero" : "default"} className={`p-5 flex flex-col justify-between hover:border-zinc-700 transition ${selectedSensor === "temp" ? "border-indigo-500" : ""}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Current Temp</span>
            <Icon icon="solar:thermometer-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display text-indigo-400">{currentTemp.toFixed(1)}</span>
            <span className="text-sm font-sans font-bold text-zinc-400">°C</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500">
            <Icon icon="solar:trending-up-linear" className="text-xs text-indigo-400" />
            <span>Live stream active</span>
          </div>
        </PanelFrame>

        {/* RPM Card */}
        <PanelFrame variant={selectedSensor === "rpm" ? "hero" : "default"} className={`p-5 flex flex-col justify-between hover:border-zinc-700 transition ${selectedSensor === "rpm" ? "border-indigo-500" : ""}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Motor Speed</span>
            <Icon icon="solar:refresh-circle-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display text-indigo-400">{Math.round(currentRpm)}</span>
            <span className="text-sm font-sans font-bold text-zinc-400">RPM</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-500">
            <Icon icon="solar:check-circle-linear" className="text-xs text-emerald-400" />
            <span>Nominal operation</span>
          </div>
        </PanelFrame>

        {/* Pressure Card */}
        <PanelFrame variant={selectedSensor === "press" ? "hero" : "default"} className={`p-5 flex flex-col justify-between hover:border-zinc-700 transition ${selectedSensor === "press" ? "border-indigo-500" : ""}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Hydraulic Press</span>
            <Icon icon="solar:gauge-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display text-indigo-400">{currentPress.toFixed(2)}</span>
            <span className="text-sm font-sans font-bold text-zinc-400">BAR</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500">
            <Icon icon="solar:trending-down-linear" className="text-xs text-zinc-500" />
            <span>Standard baseline</span>
          </div>
        </PanelFrame>

        {/* Latency / Ping Card */}
        <PanelFrame variant="default" className="p-5 flex flex-col justify-between hover:border-zinc-700 transition">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">WS Latency</span>
            <Icon icon="solar:transmission-linear" className="text-xl text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display text-indigo-400">18</span>
            <span className="text-sm font-sans font-bold text-zinc-400">MS</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-500">
            <Icon icon="solar:bolt-linear" className="text-xs text-emerald-400 animate-pulse" />
            <span>High-frequency link</span>
          </div>
        </PanelFrame>
      </section>

      {/* Main Body Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Panel: SVG Live Chart */}
        <PanelFrame variant="dark" className="flex flex-col min-h-[500px] rounded-xl relative">
          <div className="p-5 border-b border-white/10 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans mr-2">Sensor Selector</span>
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 gap-1">
                {(['temp', 'press', 'rpm', 'volt', 'vibr'] as SensorKey[]).map((key) => {
                  const labels = { temp: 'Temp', press: 'Pressure', rpm: 'RPM', volt: 'Voltage', vibr: 'Vibration' };
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSensor(key)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        selectedSensor === key
                          ? 'bg-indigo-500 text-white shadow'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      {labels[key]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 font-mono">
              <button className="px-2 py-1 text-[10px] font-bold text-white bg-zinc-900 rounded shadow-sm">15M</button>
              <button className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">1H</button>
              <button className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">6H</button>
              <button className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">24H</button>
            </div>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-between relative">
            {/* SVG Chart Container */}
            <div className="flex-grow relative h-[300px] border-l border-b border-zinc-800">
              <svg
                className="w-full h-full cursor-crosshair"
                viewBox="0 0 800 300"
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                <line x1="0" y1="75" x2="800" y2="75" stroke="#1f2937" strokeDasharray="4" strokeWidth="0.5" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#1f2937" strokeDasharray="4" strokeWidth="0.5" />
                <line x1="0" y1="225" x2="800" y2="225" stroke="#1f2937" strokeDasharray="4" strokeWidth="0.5" />

                {/* Y-Axis Ticks */}
                <text x="12" y="45" className="fill-zinc-500 font-mono text-[9px] font-bold">{yTicks[0]}</text>
                <text x="12" y="150" className="fill-zinc-500 font-mono text-[9px] font-bold">{yTicks[1]}</text>
                <text x="12" y="260" className="fill-zinc-500 font-mono text-[9px] font-bold">{yTicks[2]}</text>

                {/* Industrial Threshold Warnings */}
                {thresholdY >= 0 && (
                  <>
                    <rect x="0" y="40" width="800" height={Math.max(0, thresholdY - 40)} fill="#f87171" fillOpacity="0.04" />
                    <line x1="0" y1={thresholdY} x2="800" y2={thresholdY} stroke="#f87171" strokeDasharray="6 3" strokeWidth="1.25" />
                    <text x="680" y={thresholdY - 6} className="fill-red-400/80 font-sans text-[10px] font-bold uppercase tracking-wider">
                      Danger Limit ({thresholdValue} {CURRENT_UNITS[selectedSensor]})
                    </text>
                  </>
                )}

                {/* Gradient area */}
                {areaD && <path d={areaD} fill="url(#chartGradient)" className="transition-all duration-300" />}

                {/* Line Path */}
                {lineD && (
                  <path
                    d={lineD}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}

                {/* Interactive Tooltip Overlay components */}
                {hoveredPoint && (
                  <>
                    <line x1={hoveredPoint.x} y1="40" x2={hoveredPoint.x} y2="260" stroke="#a5b4fc" strokeDasharray="3 3" strokeWidth="1" />
                    <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#818cf8" stroke="#ffffff" strokeWidth="1.5" />
                  </>
                )}
              </svg>

              {/* Absolute Tooltip Card */}
              {hoveredPoint && (
                <div
                  className="absolute bg-zinc-950/95 border border-zinc-800 p-2.5 rounded shadow-xl text-[10px] text-zinc-300 font-mono z-50 pointer-events-none"
                  style={{
                    left: `${Math.min(Math.max((hoveredPoint.x / 800) * 100 - 6, 2), 85)}%`,
                    top: `${Math.min(Math.max((hoveredPoint.y / 300) * 100 - 25, 2), 65)}%`
                  }}
                >
                  <p className="text-zinc-500 font-bold uppercase text-[9px] font-sans">Live Triage Telemetry</p>
                  <p className="mt-1"><span className="text-zinc-400 font-sans font-medium">Time:</span> {hoveredPoint.timestamp.split(" ")[1] || hoveredPoint.timestamp}</p>
                  <p className="text-indigo-400 font-bold mt-0.5"><span className="text-zinc-400 font-sans font-medium">Value:</span> {hoveredPoint.value.toFixed(2)} {CURRENT_UNITS[selectedSensor]}</p>
                </div>
              )}
            </div>
            {/* Time labels below chart */}
            <div className="flex justify-between mt-3 px-2">
              {timeLabels.map((lbl, idx) => (
                <span key={idx} className="font-mono text-[10px] text-zinc-500">{lbl}</span>
              ))}
            </div>
          </div>
        </PanelFrame>

        {/* Right Side: Details Panels */}
        <div className="flex flex-col gap-6">
          {/* Machine Info Card */}
          <PanelFrame variant="dark" className="p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center animate-pulse">
                <Icon icon="solar:widget-linear" className="text-indigo-400 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-white leading-tight uppercase">{activeMachineName}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-wider">Active Operations</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                <span className="text-zinc-500 font-sans font-medium">Machine ID</span>
                <span className="font-mono text-zinc-300">{activeMachineIdLabel}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                <span className="text-zinc-500 font-sans font-medium">Location</span>
                <span className="text-zinc-300 font-sans">{activeMachineLocation}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                <span className="text-zinc-500 font-sans font-medium">Operator</span>
                <span className="text-zinc-300 font-sans">John Doe (8824)</span>
              </div>
            </div>
          </PanelFrame>

          {/* Live Sensor Stream List */}
          <PanelFrame variant="dark" className="flex flex-col max-h-[300px] rounded-xl">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Live Sensor Stream</h3>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2 max-h-[220px]">
              <div
                onClick={() => setSelectedSensor("temp")}
                className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition ${
                  selectedSensor === "temp"
                    ? "bg-indigo-950/20 border-indigo-800/40"
                    : "bg-zinc-950/60 border-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <span className="text-xs font-sans text-zinc-400">Temp_Inlet_01</span>
                <span className="font-mono text-indigo-400 text-xs font-semibold">{currentTemp.toFixed(1)}°C</span>
              </div>
              <div
                onClick={() => setSelectedSensor("vibr")}
                className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition ${
                  selectedSensor === "vibr"
                    ? "bg-indigo-950/20 border-indigo-800/40"
                    : "bg-zinc-950/60 border-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <span className="text-xs font-sans text-zinc-400">Vibr_Axial_X</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">{currentVibr.toFixed(2)} mm/s</span>
              </div>
              <div
                onClick={() => setSelectedSensor("rpm")}
                className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition ${
                  selectedSensor === "rpm"
                    ? "bg-indigo-950/20 border-indigo-800/40"
                    : "bg-zinc-950/60 border-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <span className="text-xs font-sans text-zinc-400">Motor_RPM</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">{Math.round(currentRpm)} RPM</span>
              </div>
              <div
                onClick={() => setSelectedSensor("press")}
                className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition ${
                  selectedSensor === "press"
                    ? "bg-indigo-950/20 border-indigo-800/40"
                    : "bg-zinc-950/60 border-zinc-800/50 hover:border-zinc-700"
                }`}
              >
                <span className="text-xs font-sans text-zinc-400">Flow_Pressure</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">{currentPress.toFixed(2)} BAR</span>
              </div>
            </div>
          </PanelFrame>

          {/* WebSocket Diagnostics */}
          <PanelFrame variant="dark" className="p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:transfer-horizontal-linear" className="text-indigo-400 text-lg" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">WS Diagnostics</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Data Rate</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">124 KB/s</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Uptime</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">{formatUptime(uptimeSeconds)}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Reconnections</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">0</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide font-sans">Jitter</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">2ms</p>
              </div>
            </div>
          </PanelFrame>
        </div>
      </section>

      {/* Bottom Table: Raw Telemetry Log */}
      <PanelFrame variant="dark" className="rounded-xl overflow-hidden" as="section">
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/80">
          <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-200 font-sans">Raw Telemetry Event Log</h3>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition">
            <Icon icon="solar:download-linear" className="text-sm" />
            <span>EXPORT CSV</span>
          </button>
        </div>
        <TableContainer className="border-0 rounded-none bg-transparent">
          <TableHeader>
            <TableRow className="bg-zinc-950/80 border-b border-white/10 uppercase text-[10px]">
              <TableHead className="px-5 py-3 font-semibold">Timestamp</TableHead>
              <TableHead className="px-5 py-3 font-semibold">Sensor</TableHead>
              <TableHead className="px-5 py-3 font-semibold">Machine</TableHead>
              <TableHead className="px-5 py-3 font-semibold">Value</TableHead>
              <TableHead className="px-5 py-3 font-semibold">Unit</TableHead>
              <TableHead className="px-5 py-3 font-semibold text-center">Status</TableHead>
              <TableHead className="px-5 py-3 font-semibold text-right">Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventLog.map((event: any) => (
              <TableRow key={event.id} className="hover:bg-zinc-900/40 transition">
                <TableCell className="px-5 py-3 font-mono text-zinc-500">{event.timestamp}</TableCell>
                <TableCell className="px-5 py-3 font-semibold text-zinc-200">{event.sensor}</TableCell>
                <TableCell className="px-5 py-3">{event.machine}</TableCell>
                <TableCell className="px-5 py-3 text-indigo-400 font-bold font-mono">{event.value}</TableCell>
                <TableCell className="px-5 py-3 text-zinc-500">{event.unit}</TableCell>
                <TableCell className="px-5 py-3 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-sans font-bold bg-emerald-950/30 text-emerald-400 border border-emerald-900/50">
                    {event.status}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-3 text-right font-mono text-zinc-500">{event.quality}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContainer>
      </PanelFrame>
    </div>
  );
}

export default function TelemetryPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Spinner size={32} />
      </div>
    }>
      <TelemetryPageContent />
    </Suspense>
  );
}
