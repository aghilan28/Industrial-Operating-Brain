"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={["ADMIN"]}>
      <div className="space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            System Administration
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-sans mt-1">
            Role Access Level: ADMIN
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider font-sans mb-2">
            System Policies & RBAC Management
          </h2>
          <p className="text-xs text-zinc-400">
            Administrative controls for user roles, access control lists, and security logs.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
