"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Lightweight CSS-only tooltip. For production, replace with floating-ui
 * when complex positioning is required.
 */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
  className,
}) => {
  const sideCls = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-tooltip whitespace-nowrap rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-[0.68rem] font-sans uppercase tracking-widest text-zinc-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus-within:opacity-100",
          sideCls,
          className
        )}
      >
        {content}
      </span>
    </span>
  );
};
