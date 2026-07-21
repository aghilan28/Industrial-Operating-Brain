import * as React from "react";
import { cn } from "@/utils/cn";

export interface SplitLayoutProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
  leftCol?: string; // e.g. "0.72fr"
  rightCol?: string; // e.g. "1.28fr"
  vertical?: boolean;
}

/** Two-column split — matches the template's grid-cols-[a_b] pattern. */
export function SplitLayout({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
  leftCol = "0.8fr",
  rightCol = "1.2fr",
  vertical = false,
}: SplitLayoutProps) {
  return (
    <div
      className={cn(
        "grid",
        vertical ? "grid-rows-[auto_1fr]" : "grid-cols-1 lg:grid-cols-[var(--lc)_var(--rc)]",
        className
      )}
      style={
        !vertical
          ? ({ ["--lc" as string]: leftCol, ["--rc" as string]: rightCol } as React.CSSProperties)
          : undefined
      }
    >
      <div
        className={cn(
          !vertical && "border-b border-white/10 lg:border-b-0 lg:border-r",
          leftClassName
        )}
      >
        {left}
      </div>
      <div className={cn(rightClassName)}>{right}</div>
    </div>
  );
}
