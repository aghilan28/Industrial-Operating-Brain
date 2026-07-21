import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant matching the label-pill / sub-card / step-badge styles in the template. */
  variant?: "pill" | "subcard" | "step";
}

/**
 * Glass / inset card used for the label pills floating over the hero canvas,
 * session operators card, and step number badges.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "pill", children, style, ...props }, ref) => {
    const variants: Record<NonNullable<GlassCardProps["variant"]>, React.CSSProperties> = {
      pill: {
        background: tokens.gradients.labelPill,
        boxShadow: tokens.shadows.labelPill,
      },
      subcard: {
        background: tokens.gradients.subCard,
        boxShadow: tokens.shadows.card,
      },
      step: {
        background: tokens.gradients.stepBadge,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.88)",
      },
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-xl border border-white/10", className)}
        style={{ ...variants[variant], ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";
