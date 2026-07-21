import * as React from "react";
import { cn } from "@/utils/cn";

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Optional branding / visual side. Placeholder for Phase 3 (Login). */
  branding?: React.ReactNode;
}

/**
 * Split layout used for authentication screens (login / signup / SSO).
 * Placeholder only — Login implemented in Phase 3.
 */
export function AuthLayout({ children, className, branding }: AuthLayoutProps) {
  return (
    <div className={cn("relative flex min-h-screen items-stretch", className)}>
      {/* Visual / branding panel */}
      <div className="relative hidden w-1/2 border-r border-white/10 lg:block">
        {branding ?? (
          <div className="flex h-full items-center justify-center p-12 text-zinc-600">
            {/* TODO (Phase 3): insert branded side panel here */}
            <span className="text-xs font-sans uppercase tracking-[0.32em]">
              IOB — Auth Visual Panel
            </span>
          </div>
        )}
      </div>
      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
