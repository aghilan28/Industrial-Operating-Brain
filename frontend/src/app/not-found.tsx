import * as React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <span className="text-6xl font-extrabold text-indigo-500 font-sans">404</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white font-sans">Page Not Found</h1>
      <p className="mt-2 text-sm text-zinc-400 font-sans">The industrial telemetry route or page does not exist.</p>
      <Link href="/dashboard" className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium uppercase tracking-widest text-white hover:bg-indigo-500 font-sans">
        Return to Dashboard
      </Link>
    </div>
  );
}
