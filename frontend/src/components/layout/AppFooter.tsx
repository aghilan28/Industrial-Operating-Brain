import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";
import { APP_IDENTITY } from "@/constants/navigation";

export interface AppFooterProps {
  className?: string;
  /** TODO: inject these from runtime config later */
  version?: string;
  environment?: string;
  copyright?: string;
}

/**
 * Minimal enterprise footer.
 * Replaces marketing footer links with application name / version /
 * environment / copyright placeholders.
 */
export function AppFooter({
  className,
  version = "v0.1.0",
  environment = "Development",
  copyright = `© ${new Date().getFullYear()} Industrial Operating Brain. All rights reserved.`,
}: AppFooterProps) {
  return (
    <footer
      className={cn(
        "relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8",
        className
      )}
    >
      <div
        className="flex flex-col gap-3 border border-white/10 px-5 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between font-sans"
        style={{
          background: tokens.gradients.panelBar,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.85)",
        }}
      >
        <p className="flex items-center gap-3">
          <span className="text-zinc-300">{APP_IDENTITY.name}</span>
          <span className="text-zinc-600">/</span>
          <span>{version}</span>
          <span className="text-zinc-600">/</span>
          <span>{environment}</span>
        </p>
        <p>{copyright}</p>
      </div>
    </footer>
  );
}
