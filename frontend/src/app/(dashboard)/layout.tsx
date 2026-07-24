"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TelemetryProvider } from "@/providers/TelemetryProvider";
import { StreamProvider } from "@/providers/StreamProvider";
import { DashboardLayout as DashboardLayoutWrapper } from "@/components/layout/DashboardLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <TelemetryProvider>
        {/*
          Phase 5: StreamProvider owns the single dashboard-wide telemetry
          socket (connection state machine + exponential backoff reconnect +
          per-asset subscriptions). It is mounted inside TelemetryProvider so
          the existing useTelemetry() surface keeps working unchanged while
          new views migrate to useStream() / useAssetStream().
        */}
        <StreamProvider>
          <DashboardLayoutWrapper>
            {children}
          </DashboardLayoutWrapper>
        </StreamProvider>
      </TelemetryProvider>
    </ProtectedRoute>
  );
}
