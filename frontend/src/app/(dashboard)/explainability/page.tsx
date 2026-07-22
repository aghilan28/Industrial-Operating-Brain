"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/feedback/Spinner";

type FeatureImportance = {
  name: string;
  key: string;
  impact: number;
  type: "temp" | "rpm" | "press" | "vibr";
};

const SHAP_DATA: Record<string, FeatureImportance[]> = {
  "Turbine-04": [
    { name: "Inlet Temperature (Temp_Inlet)", key: "temp", impact: 1.84, type: "temp" },
    { name: "Rotor Speed (RPM_Actual)", key: "rpm", impact: 0.92, type: "rpm" },
    { name: "Vibration Axial X", key: "vibr", impact: 0.38, type: "vibr" },
    { name: "Hydraulic Pump Pressure", key: "press", impact: -0.24, type: "press" }
  ],
  "Motor-01": [
    { name: "Vibration Axial X", key: "vibr", impact: 1.45, type: "vibr" },
    { name: "Rotor Speed (RPM_Actual)", key: "rpm", impact: -0.58, type: "rpm" },
    { name: "Inlet Temperature (Temp_Inlet)", key: "temp", impact: 0.12, type: "temp" },
    { name: "Hydraulic Pump Pressure", key: "press", impact: 0.05, type: "press" }
  ]
};

function ExplainabilityPageContent() {
  const searchParams = useSearchParams();
  const queryMachineId = searchParams.get("machine_id");

  const [selectedMachine, setSelectedMachine] = React.useState("Turbine-04");

  // Sync selected machine if queryMachineId is present
  React.useEffect(() => {
    if (queryMachineId) {
      const match = ["Turbine-04", "Motor-01"].find(
        (m) => m.toLowerCase() === queryMachineId.toLowerCase()
      );
      if (match) {
        setSelectedMachine(match);
      } else {
        setSelectedMachine("Turbine-04");
      }
    }
  }, [queryMachineId]);

  const currentFeatures = SHAP_DATA[selectedMachine] || SHAP_DATA["Turbine-04"];
  const maxImpact = Math.max(...currentFeatures.map(f => Math.abs(f.impact)));

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="info" className="font-semibold">
              XAI Pipeline Active
            </StatusBadge>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              Method: SHAP / LIME Kernels
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            Decision Transparency
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            Inspect model contribution weights explaining why anomaly alerts were triggered
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans font-medium">Select Target Twin</span>
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 gap-1 mt-1">
            {Object.keys(SHAP_DATA).map((m) => (
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
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* SHAP Chart Panel */}
        <PanelFrame variant="dark" className="p-5 space-y-6 rounded-xl flex flex-col justify-between min-h-[440px]">
          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
                SHAP Feature Contributions
              </h3>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">
                SHAP Value impact range [-{maxImpact.toFixed(1)}, +{maxImpact.toFixed(1)}]
              </span>
            </div>

            <div className="relative mt-6 space-y-6 p-2 bg-zinc-950/20 rounded-lg border border-white/5">
              {/* Vertical grid lines representing scale weights */}
              <div className="absolute inset-0 flex justify-between pointer-events-none z-0 py-2">
                <div className="border-l border-white/5 h-full" />
                <div className="border-l border-white/5 h-full" />
                <div className="border-l border-zinc-800/80 h-full" /> {/* Zero Center Axis */}
                <div className="border-l border-white/5 h-full" />
                <div className="border-l border-white/5 h-full" />
              </div>

              {currentFeatures.map((feat) => {
                const percent = Math.min((Math.abs(feat.impact) / maxImpact) * 100, 100);
                const isPositive = feat.impact >= 0;

                return (
                  <div key={feat.name} className="space-y-2 text-xs font-sans relative z-10">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-semibold text-zinc-300">{feat.name}</span>
                      <span className={`font-mono font-bold ${isPositive ? "text-red-400" : "text-emerald-400"}`}>
                        {isPositive ? "+" : ""}{feat.impact.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-950/80 h-3 rounded-full relative overflow-hidden border border-white/5">
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-zinc-800 z-10" />
                      {!isPositive && (
                        <div
                          className="absolute inset-y-0 right-1/2 bg-emerald-500/60 rounded-l-full transition-all duration-500"
                          style={{ width: `${percent / 2}%` }}
                        />
                      )}
                      {isPositive && (
                        <div
                          className="absolute inset-y-0 left-1/2 bg-red-500/60 rounded-r-full transition-all duration-500"
                          style={{ width: `${percent / 2}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-zinc-500 border-t border-white/5 pt-3 select-none">
            <span>-100% (Decreases Risk)</span>
            <span>-50%</span>
            <span>0% (Neutral)</span>
            <span>+50%</span>
            <span>+100% (Increases Risk)</span>
          </div>
        </PanelFrame>

        {/* Explainability Diagnostics Description */}
        <div className="space-y-6">
          <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
            <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-300 border-b border-white/5 pb-3">
              AI Reasoning Summary
            </h3>
            <div className="text-xs leading-relaxed space-y-3 font-sans text-zinc-300">
              <p>
                The model predicted a higher failure probability on <strong className="text-indigo-400 font-mono">{selectedMachine}</strong>. 
              </p>
              <div className="p-3 bg-zinc-950/60 rounded border border-white/5 text-[11px]">
                <strong className="text-zinc-400 uppercase tracking-wide text-[9px] block mb-1">Inference Rationale</strong>
                {selectedMachine === "Turbine-04" ? (
                  <p>
                    A positive drift in <strong>Inlet Temperature</strong> accounts for 62% of the decision weight. This temperature drift triggers the high-risk classifier layer.
                  </p>
                ) : (
                  <p>
                    Increased high-frequency jitter levels on the <strong>Axial X Vibration</strong> accelerometer contribute most to the risk weight profile.
                  </p>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                SHAP contribution values represent the additive impact of feature drifts relative to standard operating baselines.
              </p>
            </div>
          </PanelFrame>

          <PanelFrame variant="dark" className="p-5 space-y-4 rounded-xl">
            <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-300 border-b border-white/5 pb-3">
              Local Interpretable Explanations (LIME)
            </h3>
            <div className="text-[11px] text-zinc-400 font-sans space-y-2 leading-relaxed">
              <p>
                LIME kernels fit surrogate models locally around active telemetry coordinates. The current local regression fit matches the primary global SHAP weights with an accuracy of <strong>94.2%</strong>.
              </p>
            </div>
          </PanelFrame>
        </div>
      </div>
    </div>
  );
}

export default function ExplainabilityPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Spinner size={32} />
      </div>
    }>
      <ExplainabilityPageContent />
    </Suspense>
  );
}
