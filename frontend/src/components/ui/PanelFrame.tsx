"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

type BracketColor = "indigo" | "zinc";
type Variant = "hero" | "default" | "dark" | "darker" | "footer";

export interface PanelFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Corner bracket color. Hero uses indigo, all other template sections use zinc.
   * @default "zinc"
   */
  bracket?: BracketColor;
  /**
   * Size of corner brackets (in px via tw classes). Hero uses h-10/w-10, others h-8/w-8.
   * @default "md"
   */
  bracketSize?: "sm" | "md" | "lg";
  /** Whether to render the four small dots at the inside corners (hero only). */
  withDots?: boolean;
  /** Gradient preset matching template panel variants. */
  variant?: Variant;
  /** Override background style. */
  bgStyle?: React.CSSProperties;
  /** Render as a semantic element other than section. */
  as?: "section" | "div" | "article" | "aside" | "nav" | "header" | "footer";
}

const BRACKET_COLORS: Record<BracketColor, string> = {
  indigo: "border-indigo-500/40",
  zinc: "border-zinc-300/40",
};

const BRACKET_SIZES = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const DOT_COLORS: Record<BracketColor, string> = {
  indigo: "bg-indigo-500/50",
  zinc: "bg-zinc-500/50",
};

const VARIANT_BG: Record<Variant, React.CSSProperties> = {
  hero: {
    background: tokens.gradients.panel,
    boxShadow: tokens.shadows.panel,
  },
  default: {
    background: tokens.gradients.panelMuted,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.95)",
  },
  dark: {
    background: tokens.gradients.panelDark,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.95)",
  },
  darker: {
    background: tokens.gradients.panelDarker,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.95)",
  },
  footer: {
    background: tokens.gradients.panelFooter,
    boxShadow: tokens.shadows.panelSoft,
  },
};

export const PanelFrame = React.forwardRef<HTMLDivElement, PanelFrameProps>(
  (
    {
      className,
      bracket = "zinc",
      bracketSize = "md",
      withDots = false,
      variant = "default",
      bgStyle,
      as: Tag = "section",
      children,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn("frame-section relative overflow-hidden border border-white/10", className)}
        style={{ ...VARIANT_BG[variant], ...style, ...bgStyle }}
        {...props}
      >
        {/* Corner brackets */}
        <span
          className={cn(
            "pointer-events-none absolute left-0 top-0 border-l border-t",
            BRACKET_SIZES[bracketSize],
            BRACKET_COLORS[bracket]
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute right-0 top-0 border-r border-t",
            BRACKET_SIZES[bracketSize],
            BRACKET_COLORS[bracket]
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 border-b border-l",
            BRACKET_SIZES[bracketSize],
            BRACKET_COLORS[bracket]
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute bottom-0 right-0 border-b border-r",
            BRACKET_SIZES[bracketSize],
            BRACKET_COLORS[bracket]
          )}
        />

        {/* Inner dots (hero only) */}
        {withDots && (
          <>
            <div className={cn("absolute left-4 top-4 h-2 w-2", DOT_COLORS[bracket])} />
            <div className={cn("absolute right-4 top-4 h-2 w-2", DOT_COLORS[bracket])} />
            <div className={cn("absolute bottom-4 left-4 h-2 w-2", DOT_COLORS[bracket])} />
            <div className={cn("absolute bottom-4 right-4 h-2 w-2", DOT_COLORS[bracket])} />
          </>
        )}

        {children}
      </Tag>
    );
  }
);
PanelFrame.displayName = "PanelFrame";
