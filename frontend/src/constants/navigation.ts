import type { ReactNode } from "react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string; // Iconify icon name
  shortcut?: string;
  badge?: string;
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

/**
 * Top-level primary navigation for the application header.
 * Pages will be implemented in Phase 2; these are configuration placeholders.
 */
export const PRIMARY_NAV: NavItem[] = [
  // TODO (Phase 2): populate with application-level top-nav entries.
];

/**
 * Sidebar navigation grouped by section.
 * TODO (Phase 2): finalize route map for Industrial Operating Brain.
 */
export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "solar:widget-5-linear" },
      { id: "command-center", label: "Command Center", href: "/command-center", icon: "solar:monitor-linear", badge: "Live" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { id: "assets", label: "Assets", href: "/assets", icon: "solar:gallery-wide-linear" },
      { id: "signals", label: "Signals", href: "/signals", icon: "solar:chart-square-linear" },
      { id: "workflows", label: "Workflows", href: "/workflows", icon: "solar:branching-paths-up-linear" },
      {
        id: "factory",
        label: "Factory Floor",
        href: "#",
        icon: "solar:factory-linear",
        children: [
          { id: "lines", label: "Production Lines", href: "/factory/lines" },
          { id: "cells", label: "Work Cells", href: "/factory/cells" },
          { id: "stations", label: "Stations", href: "/factory/stations" },
        ],
      },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    items: [
      { id: "models", label: "Models", href: "/models", icon: "solar:box-minimalistic-linear" },
      { id: "protocol", label: "Protocol", href: "/protocol", icon: "solar:code-square-linear" },
      { id: "anomalies", label: "Anomalies", href: "/anomalies", icon: "solar:danger-triangle-linear" },
    ],
  },
  {
    id: "governance",
    title: "Governance",
    items: [
      { id: "audit", label: "Audit Trail", href: "/audit", icon: "lucide:file-text" },
      { id: "access", label: "Access Control", href: "/access", icon: "lucide:users" },
      { id: "settings", label: "Settings", href: "/settings", icon: "solar:settings-linear" },
    ],
  },
];

export const BREADCRUMB_PLACEHOLDER: { label: string; href?: string }[] = [
  { label: "IOB" },
  { label: "Workspace" },
];

export interface AppIdentity {
  initials: string;
  name: string;
  tagline: string;
}

export const APP_IDENTITY: AppIdentity = {
  initials: "IO", // TODO: replace with final logo/initials
  name: "Industrial Operating Brain",
  tagline: "Operations Console",
};
