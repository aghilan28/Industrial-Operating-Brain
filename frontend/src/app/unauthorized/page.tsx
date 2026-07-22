"use client";

import React from "react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
      <div className="w-full max-w-md text-center space-y-4 rounded-2xl border border-red-900/30 bg-neutral-900/80 p-8 backdrop-blur-xl">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-950/60 border border-red-800/50 text-red-400 text-xl font-bold font-mono">
          403
        </div>
        <h1 className="text-xl font-bold font-sans tracking-tight">
          Access Forbidden
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          You do not have the required permissions to access this area of the Industrial Operating Brain.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2.5 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
