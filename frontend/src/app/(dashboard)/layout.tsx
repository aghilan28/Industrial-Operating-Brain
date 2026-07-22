"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppHeader } from "@/components/navigation/AppHeader";
import { TelemetryProvider } from "@/providers/TelemetryProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <TelemetryProvider>
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </TelemetryProvider>
    </ProtectedRoute>
  );
}
