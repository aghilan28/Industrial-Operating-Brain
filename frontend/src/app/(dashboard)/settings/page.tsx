"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { tokens } from "@/tokens";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { Switch } from "@/components/forms/Switch";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const [telemetryRate, setTelemetryRate] = React.useState("100");
  const [highFreqWs, setHighFreqWs] = React.useState(true);
  const [correlationId, setCorrelationId] = React.useState(true);
  const [keyboardShortcuts, setKeyboardShortcuts] = React.useState(false);
  const [severityFilter, setSeverityFilter] = React.useState("warning");
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="success" className="font-semibold">
              Configurations Active
            </StatusBadge>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              Scope: System-Wide Workspace
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            System Settings
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            Manage platform properties, telemetry refresh rates, and local notification routing
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
              <Icon icon="solar:check-circle-linear" />
              Settings Saved
            </span>
          )}
          <Button onClick={handleSave} variant="primary" size="sm">
            Save Preferences
          </Button>
        </div>
      </section>

      {/* Grid of Settings Categories */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry Stream Settings */}
        <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200 border-b border-white/5 pb-3 flex items-center gap-2">
            <Icon icon="solar:chart-square-linear" className="text-indigo-400" />
            <span>Telemetry & WS Stream</span>
          </h3>

          <div className="space-y-4 text-xs font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                Telemetry Stream Refresh Frequency (ms)
              </label>
              <Input
                type="number"
                value={telemetryRate}
                onChange={(e) => setTelemetryRate(e.target.value)}
                className="max-w-[200px]"
                placeholder="e.g. 100"
              />
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                Determines how often the UI queues sensor coordinates for SVG regression calculation.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4">
              <div className="space-y-0.5">
                <label className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] block">
                  High-Frequency WebSockets
                </label>
                <span className="text-[10px] text-zinc-500 block leading-relaxed">
                  Establish a real-time MQTT-bridged connection for 100Hz vibration feeds.
                </span>
              </div>
              <Switch checked={highFreqWs} onChange={setHighFreqWs} />
            </div>
          </div>
        </PanelFrame>

        {/* Operational Security & Tracing */}
        <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200 border-b border-white/5 pb-3 flex items-center gap-2">
            <Icon icon="solar:shield-keyhole-linear" className="text-indigo-400" />
            <span>Security & Data Tracing</span>
          </h3>

          <div className="space-y-4 text-xs font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                Minimum Incident Severity Filter
              </label>
              <div className="relative max-w-[200px]">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none uppercase font-bold tracking-wider"
                >
                  <option value="info">Info & Above</option>
                  <option value="warning">Warning & Above</option>
                  <option value="critical">Critical Only</option>
                </select>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                Filter alarms in the Incident command center.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4">
              <div className="space-y-0.5">
                <label className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] block">
                  Correlation-ID Propagation
                </label>
                <span className="text-[10px] text-zinc-500 block leading-relaxed">
                  Inject X-Correlation-ID tracing headers across FastAPI microservices.
                </span>
              </div>
              <Switch checked={correlationId} onChange={setCorrelationId} />
            </div>
          </div>
        </PanelFrame>

        {/* Interface Preferences */}
        <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200 border-b border-white/5 pb-3 flex items-center gap-2">
            <Icon icon="solar:widget-linear" className="text-indigo-400" />
            <span>Workspace Layout Customization</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] block">
                  Display Keyboard Hotkeys Overlay
                </label>
                <span className="text-[10px] text-zinc-500 block leading-relaxed">
                  Shows visual shortcut tips next to route items in the navigation panel.
                </span>
              </div>
              <Switch checked={keyboardShortcuts} onChange={setKeyboardShortcuts} />
            </div>

            <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-zinc-800/60 pt-4 md:pt-0 md:pl-6">
              <div className="space-y-0.5">
                <label className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] block">
                  Lock Interface Theme to Dark Mode
                </label>
                <span className="text-[10px] text-zinc-500 block leading-relaxed">
                  Ensures all components leverage CSS tokens conforming to baseline visual contrast ratios.
                </span>
              </div>
              <Switch checked={true} disabled={true} />
            </div>
          </div>
        </PanelFrame>
      </section>
    </div>
  );
}
