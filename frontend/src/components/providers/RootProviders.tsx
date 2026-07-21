"use client";

import * as React from "react";
import { useLenis } from "@/hooks/useLenis";

/**
 * RootProviders mounts all client-side providers.
 * Currently: Lenis smooth scroll. Add more providers (ThemeProvider, QueryClient, etc.) here.
 */
export function RootProviders({ children }: { children: React.ReactNode }) {
  useLenis();
  return <>{children}</>;
}
