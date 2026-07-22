"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TelemetryProvider } from "@/providers/TelemetryProvider";
import { DashboardLayout as DashboardLayoutWrapper } from "@/components/layout/DashboardLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <TelemetryProvider>
        <DashboardLayoutWrapper>
          {children}
        </DashboardLayoutWrapper>
      </TelemetryProvider>
    </ProtectedRoute>
  );
}
