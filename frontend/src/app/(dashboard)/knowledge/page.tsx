"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { Input } from "@/components/forms/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/feedback/Spinner";

type SOPDocument = {
  id: string;
  title: string;
  code: string;
  category: "Safety" | "Maintenance" | "Operation";
  lastUpdated: string;
  description: string;
};

const docs: SOPDocument[] = [
  {
    id: "sop-01",
    title: "High-Temperature Throttle SOP",
    code: "IOB-SOP-E420",
    category: "Safety",
    lastUpdated: "2026-06-15",
    description: "Emergency shutdown and throttling steps when Turbine inlet temperatures exceed 75°C threshold limit values."
  },
  {
    id: "sop-02",
    title: "Vibration Sensor Recalibration",
    code: "IOB-SOP-M108",
    category: "Maintenance",
    lastUpdated: "2026-07-02",
    description: "Steps to inspect shaft alignment and recalibrate piezoelectric accelerometer vibration probes on core motors."
  },
  {
    id: "sop-03",
    title: "Hydraulic Pump Startup Protocol",
    code: "IOB-SOP-O051",
    category: "Operation",
    lastUpdated: "2026-05-22",
    description: "Standard pre-operation checklist, priming instructions, and pressure balance thresholds for main hydraulic manifolds."
  },
  {
    id: "sop-04",
    title: "FastAPI Correlation ID Logging",
    code: "IOB-SOP-S904",
    category: "Operation",
    lastUpdated: "2026-07-10",
    description: "Developer guidelines for tracing request flows across Docker containers using request correlation headers."
  }
];

function KnowledgePageContent() {
  const searchParams = useSearchParams();
  const queryText = searchParams.get("query");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDoc, setSelectedDoc] = React.useState<SOPDocument | null>(null);

  // Sync searchQuery and select document on mount if parameter matches
  React.useEffect(() => {
    if (queryText) {
      setSearchQuery(queryText);
      const match = docs.find(
        (doc) =>
          doc.code.toLowerCase().includes(queryText.toLowerCase()) ||
          doc.id.toLowerCase() === queryText.toLowerCase() ||
          doc.title.toLowerCase().includes(queryText.toLowerCase()) ||
          doc.description.toLowerCase().includes(queryText.toLowerCase())
      );
      if (match) {
        setSelectedDoc(match);
      }
    }
  }, [queryText]);

  const filteredDocs = React.useMemo(() => {
    return docs.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge variant="info" className="font-semibold">
              RAG Engine Synced
            </StatusBadge>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
              Documentation: Graph Database
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
            Knowledge Assistant
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
            Search operational manuals, safety SOP guidelines, and GraphRAG system documentation
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <PanelFrame variant="dark" className="p-4 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-grow w-full flex items-center gap-2">
            <Input
              type="text"
              placeholder="Query SOP documents, manuals index, or code guidelines (e.g. throttle, calibration)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-zinc-100"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDoc(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold font-sans uppercase shrink-0 px-2 py-1.5 border border-zinc-850 rounded hover:bg-zinc-900 transition"
              >
                Clear
              </button>
            )}
          </div>
          <Button variant="primary" size="sm" className="w-full md:w-auto">
            Run GraphRAG Query
          </Button>
        </div>
      </PanelFrame>

      {/* Grid of Results / SOP Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* SOP Grid */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans px-1">
            Matching Operating Brain Manuals ({filteredDocs.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.length === 0 ? (
              <PanelFrame variant="dark" className="p-8 text-center text-zinc-500 rounded-xl md:col-span-2">
                <Icon icon="solar:document-text-linear" className="text-3xl text-zinc-700 mx-auto mb-2" />
                <p className="text-xs">No documents match your query.</p>
              </PanelFrame>
            ) : (
              filteredDocs.map((doc) => (
                <PanelFrame
                  key={doc.id}
                  variant={selectedDoc?.id === doc.id ? "hero" : "default"}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-5 rounded-xl flex flex-col justify-between cursor-pointer hover:border-zinc-700 transition ${
                    selectedDoc?.id === doc.id ? "border-indigo-500" : ""
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-zinc-500 text-[10px] font-bold">{doc.code}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${
                        doc.category === "Safety"
                          ? "bg-red-950/30 text-red-400 border-red-800/50"
                          : doc.category === "Maintenance"
                          ? "bg-amber-950/30 text-amber-400 border-amber-800/50"
                          : "bg-blue-950/30 text-blue-400 border-blue-800/50"
                      }`}>
                        {doc.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1 leading-snug">{doc.title}</h4>
                    <p className="text-zinc-400 text-[11px] mt-2 line-clamp-3 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <span>Last Edit: {doc.lastUpdated}</span>
                    <span className="text-indigo-400 flex items-center gap-0.5 font-bold uppercase tracking-wider text-[9px]">
                      Select SOP
                      <Icon icon="solar:alt-arrow-right-linear" />
                    </span>
                  </div>
                </PanelFrame>
              ))
            )}
          </div>
        </div>

        {/* Selected Doc Inspector Panel */}
        <PanelFrame variant="dark" className="p-5 rounded-xl min-h-[400px] flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-300 border-b border-white/5 pb-3">
              Manual Inspector
            </h3>

            {selectedDoc ? (
              <div className="mt-5 space-y-4 text-xs font-sans">
                <div>
                  <span className="font-mono text-zinc-500 text-[10px] font-bold uppercase block">{selectedDoc.code}</span>
                  <h4 className="text-sm font-semibold text-white mt-1 leading-snug">{selectedDoc.title}</h4>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5 space-y-2 leading-relaxed text-zinc-300 text-[11px]">
                  <span className="text-zinc-500 block uppercase font-bold text-[9px] font-sans">Detailed Instructions</span>
                  <p>{selectedDoc.description}</p>
                  <p className="mt-2 text-zinc-400">
                    Before execution: Verify the operator has logged into the security ACL portal. Log matching correlation IDs under settings tracing log.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-[10px] bg-zinc-950/45 p-3 rounded-lg border border-white/5">
                  <div>
                    <span className="text-zinc-500 block uppercase font-sans font-bold">Category</span>
                    <span className="text-zinc-300 block mt-0.5 uppercase">{selectedDoc.category}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase font-sans font-bold">Release</span>
                    <span className="text-zinc-300 block mt-0.5">Production</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center py-20 text-center text-zinc-500">
                <Icon icon="solar:document-text-linear" className="text-3xl text-zinc-700 mb-2" />
                <p className="text-xs">Select any SOP card to inspect full operational procedures and release manifests.</p>
              </div>
            )}
          </div>

          {selectedDoc && (
            <div className="pt-4 border-t border-white/5">
              <Button variant="primary" size="sm" className="w-full">
                Download PDF SOP
              </Button>
            </div>
          )}
        </PanelFrame>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Spinner size={32} />
      </div>
    }>
      <KnowledgePageContent />
    </Suspense>
  );
}
