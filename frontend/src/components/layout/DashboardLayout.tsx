"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { AppHeader } from "@/components/navigation/AppHeader";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AppFooter } from "@/components/layout/AppFooter";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Primary application layout: sidebar + topbar + content + footer.
 * Placeholders only — no page-specific content.
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader onMenuToggle={() => setMobileOpen(true)} />
      <div className="flex flex-1">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <main
            className={cn(
              "relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
              className
            )}
          >
            {children}
          </main>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
