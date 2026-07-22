"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ConnectionBadge } from "@/components/telemetry/ConnectionBadge";

type SensorKey = 'temp' | 'press' | 'rpm' | 'volt' | 'vibr';

export default function TelemetryPage() {
  const [selectedSensor, setSelectedSensor] = React.useState<SensorKey>('temp');
  const [plantArea, setPlantArea] = React.useState("Plant Area Alpha");
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = React.useState(false);
  const [uptimeSeconds, setUptimeSeconds] = React.useState(0);
  const [liveTimestamp, setLiveTimestamp] = React.useState("");

  interface SingleTelemetry {
    data?: { value?: number; velocity?: number; unit?: string; status?: string; timestamp?: string | number };
    history: { timestamp: string | number; value: number }[];
    status: any;
    reconnect: () => void;
  }

  // Live telemetry hooks for all sensors
  const tempTelemetry = useTelemetry("temp") as unknown as SingleTelemetry;
  const rpmTelemetry = useTelemetry("rpm") as unknown as SingleTelemetry;
  const pressTelemetry = useTelemetry("press") as unknown as SingleTelemetry;
  const vibrTelemetry = useTelemetry("vibr") as unknown as SingleTelemetry;
  const voltTelemetry = useTelemetry("volt") as unknown as SingleTelemetry;
  const currTelemetry = useTelemetry("curr") as unknown as SingleTelemetry;

  // Track page uptime
  React.useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update dynamic timestamp
  React.useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
      setLiveTimestamp(`${dateStr} ${timeStr}`);
    };
    updateTimestamp();
    const interval = setInterval(updateTimestamp, 84);
    return () => clearInterval(interval);
  }, []);

  // Format uptime into hh:mm:ss
  const formatUptime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Get active telemetry for selected chart sensor
  const activeTelemetry = useTelemetry(selectedSensor) as unknown as SingleTelemetry;
  const historyData = React.useMemo(() => activeTelemetry.history || [], [activeTelemetry.history]);

  // Generate SVG coordinates for active sensor chart
  const points = React.useMemo(() => {
    if (historyData.length < 2) {
      // Mock / fallback design coordinates matching the template
      return [
        { x: 0, y: 200 }, { x: 50, y: 180 }, { x: 100, y: 190 }, { x: 150, y: 150 },
        { x: 200, y: 160 }, { x: 250, y: 120 }, { x: 300, y: 130 }, { x: 350, y: 90 },
        { x: 400, y: 100 }, { x: 450, y: 80 }, { x: 500, y: 110 }, { x: 550, y: 70 },
        { x: 600, y: 90 }, { x: 650, y: 60 }, { x: 700, y: 75 }, { x: 750, y: 40 },
        { x: 800, y: 50 }
      ];
    }
    const values = historyData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = maxVal - minVal || 1;

    return historyData.map((d, i) => {
      const x = (i / (historyData.length - 1)) * 800;
      const y = 260 - ((d.value - minVal) / valRange) * 220; // scale y within [40, 260] height
      return { x, y };
    });
  }, [historyData]);

  const lineD = React.useMemo(() => {
    if (points.length === 0) return "";
    return "M" + points.map(p => `${p.x} ${p.y}`).join(" L");
  }, [points]);

  const areaD = React.useMemo(() => {
    if (points.length === 0) return "";
    return `${lineD} V300 H0 Z`;
  }, [lineD, points]);

  // Generate dynamic chart time labels
  const timeLabels = React.useMemo(() => {
    if (historyData.length < 2) {
      return ["13:47:00", "13:52:00", "13:57:00", "14:02:00"];
    }
    const formatTime = (ts: any) => {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? String(ts) : d.toTimeString().split(' ')[0];
    };
    const count = historyData.length;
    return [
      formatTime(historyData[0].timestamp),
      formatTime(historyData[Math.floor(count / 3)].timestamp),
      formatTime(historyData[Math.floor(2 * count / 3)].timestamp),
      formatTime(historyData[count - 1].timestamp)
    ];
  }, [historyData]);

  // Bottom table raw log events
  const { history: allHistory } = useTelemetry() as unknown as {
    history: Record<string, { timestamp: string | number; value: number }[]>;
  };
  const eventLog = React.useMemo(() => {
    const events: any[] = [];
    Object.entries(allHistory || {}).forEach(([topic, entries]) => {
      const sensorName = topic.split("/").pop() || topic;
      entries.forEach((entry) => {
        let unit = "Unit";
        if (topic.includes("temp")) unit = "°C";
        else if (topic.includes("rpm")) unit = "RPM";
        else if (topic.includes("press")) unit = "Bar";
        else if (topic.includes("vibr")) unit = "mm/s";
        else if (topic.includes("volt")) unit = "V";
        else if (topic.includes("curr")) unit = "A";

        const formatLogTime = (ts: any) => {
          const d = new Date(ts);
          if (isNaN(d.getTime())) return String(ts);
          return d.toTimeString().split(' ')[0] + '.' + d.getMilliseconds().toString().padStart(3, '0');
        };

        events.push({
          id: `${topic}-${entry.timestamp}-${entry.value}`,
          timestamp: formatLogTime(entry.timestamp),
          sensor: sensorName.toUpperCase(),
          machine: "Turbine-04",
          value: entry.value.toFixed(2),
          unit: unit,
          status: "Normal",
          quality: (0.995 + (entry.value % 5) * 0.001).toFixed(3)
        });
      });
    });

    if (events.length === 0) {
      // Return high-fidelity fallback items matching initial layout
      return [
        { id: "fallback-1", timestamp: "14:02:44.912", sensor: "T_CORE_02", machine: "Turbine-04", value: "72.41", unit: "°C", status: "Normal", quality: "0.998" },
        { id: "fallback-2", timestamp: "14:02:44.881", sensor: "P_HYD_MAIN", machine: "Turbine-04", value: "6.18", unit: "Bar", status: "Normal", quality: "1.000" },
        { id: "fallback-3", timestamp: "14:02:44.750", sensor: "RPM_IND_01", machine: "Turbine-04", value: "1450.2", unit: "RPM", status: "Normal", quality: "0.995" },
        { id: "fallback-4", timestamp: "14:02:44.622", sensor: "T_CORE_01", machine: "Turbine-04", value: "71.95", unit: "°C", status: "Normal", quality: "0.999" },
      ];
    }

    return events.sort((a, b) => {
      const tA = a.timestamp;
      const tB = b.timestamp;
      return tB.localeCompare(tA);
    }).slice(0, 10);
  }, [allHistory]);

  // Extract latest values with fallbacks
  const currentTemp = tempTelemetry.data?.value ?? 72.4;
  const currentRpm = rpmTelemetry.data?.value ?? 1450;
  const currentPress = pressTelemetry.data?.value ?? 6.18;
  const currentVibr = vibrTelemetry.data?.value ?? vibrTelemetry.data?.velocity ?? 0.04;
  const currentVolt = voltTelemetry.data?.value ?? 415.0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white">Real-Time Telemetry</h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-sans">
            Monitor live industrial sensor streams, machine conditions, and operational metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Current Plant Area Dropdown */}
          <div className="flex flex-col items-end relative">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans">Current Plant</span>
            <button
              onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
              className="mt-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition"
            >
              <span>{plantArea}</span>
              <Icon icon="solar:alt-arrow-down-linear" className="text-sm text-zinc-400" />
            </button>
            {isAreaDropdownOpen && (
              <div className="absolute top-12 right-0 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-30 min-w-[150px]">
                {["Plant Area Alpha", "Plant Area Beta", "Plant Area Gamma"].map((area) => (
                  <button
                    key={area}
                    onClick={() => {
                      setPlantArea(area);
                      setIsAreaDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connection Status Badge (Alternative inline presentation if needed, or link to header) */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans">Connection Status</span>
            <div className="mt-1">
              <ConnectionBadge />
            </div>
          </div>

          {/* Running Timestamp */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans">Telemetry Clock</span>
            <span className="mt-1 font-mono text-zinc-300 text-xs bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
              {liveTimestamp || "Syncing..."}
            </span>
          </div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temp Card */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
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
        </div>

        {/* RPM Card */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
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
        </div>

        {/* Pressure Card */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
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
        </div>

        {/* Latency / Ping Card */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
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
        </div>
      </section>

      {/* Main Body Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Panel: SVG Live Chart */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-xl flex flex-col min-h-[500px]">
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
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button className="px-2 py-1 text-[10px] font-bold text-white bg-zinc-900 rounded shadow-sm">15M</button>
              <button className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">1H</button>
              <button className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">6H</button>
              <button className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300">24H</button>
            </div>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-between">
            {/* SVG Chart Container */}
            <div className="flex-grow relative h-[300px] border-l border-b border-zinc-800">
              <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
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
              </svg>
            </div>
            {/* Time labels below chart */}
            <div className="flex justify-between mt-3 px-2">
              {timeLabels.map((lbl, idx) => (
                <span key={idx} className="font-mono text-[10px] text-zinc-500">{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Details Panels */}
        <div className="flex flex-col gap-6">
          {/* Machine Info Card */}
          <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center">
                <Icon icon="solar:widget-linear" className="text-indigo-400 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-white leading-tight">IOB-TURBINE-04</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-wider">Active Operations</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                <span className="text-zinc-500 font-sans font-medium">Machine ID</span>
                <span className="font-mono text-zinc-300">TX-40092-ALPHA</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                <span className="text-zinc-500 font-sans font-medium">Location</span>
                <span className="text-zinc-300">Sector G-14, Hall 3</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                <span className="text-zinc-500 font-sans font-medium">Operator</span>
                <span className="text-zinc-300">John Doe (8824)</span>
              </div>
            </div>
          </div>

          {/* Live Sensor Stream List */}
          <div className="bg-zinc-900/40 border border-white/10 rounded-xl flex flex-col max-h-[300px]">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Live Sensor Stream</h3>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2 max-h-[220px]">
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded border border-zinc-800/50">
                <span className="text-xs font-sans text-zinc-400">Temp_Inlet_01</span>
                <span className="font-mono text-indigo-400 text-xs font-semibold">{currentTemp.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded border border-zinc-800/50">
                <span className="text-xs font-sans text-zinc-400">Vibr_Axial_X</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">{currentVibr.toFixed(2)} mm/s</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded border border-zinc-800/50">
                <span className="text-xs font-sans text-zinc-400">Load_Factor_Σ</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">88.2%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded border border-zinc-800/50">
                <span className="text-xs font-sans text-zinc-400">Flow_Rate_H2O</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">45.0 L/m</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded border border-zinc-800/50">
                <span className="text-xs font-sans text-zinc-400">Exhaust_Temp</span>
                <span className="font-mono text-zinc-300 text-xs font-semibold">312.8°C</span>
              </div>
            </div>
          </div>

          {/* WebSocket Diagnostics */}
          <div className="bg-zinc-900/40 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="solar:transfer-horizontal-linear" className="text-indigo-400 text-lg" />
              <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">WS Diagnostics</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Data Rate</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">124 KB/s</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Uptime</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">{formatUptime(uptimeSeconds)}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Reconnections</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">0</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Jitter</p>
                <p className="font-mono text-sm text-zinc-200 mt-1">2ms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Table: Raw Telemetry Log */}
      <section className="bg-zinc-900/40 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/80">
          <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">Raw Telemetry Event Log</h3>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition">
            <Icon icon="solar:download-linear" className="text-sm" />
            <span>EXPORT CSV</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Sensor</th>
                <th className="px-5 py-3 font-semibold">Machine</th>
                <th className="px-5 py-3 font-semibold">Value</th>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-zinc-300 font-mono">
              {eventLog.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-900/50 transition">
                  <td className="px-5 py-3 text-zinc-500">{event.timestamp}</td>
                  <td className="px-5 py-3 font-sans font-semibold text-zinc-200">{event.sensor}</td>
                  <td className="px-5 py-3 font-sans">{event.machine}</td>
                  <td className="px-5 py-3 text-indigo-400 font-bold">{event.value}</td>
                  <td className="px-5 py-3 text-zinc-500 font-sans">{event.unit}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-sans font-bold bg-emerald-950/30 text-emerald-400 border border-emerald-900/50">
                      {event.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-500">{event.quality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
