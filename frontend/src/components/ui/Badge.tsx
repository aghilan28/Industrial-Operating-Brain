import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
  pulse?: boolean;
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  default: "bg-zinc-400",
  accent: "bg-indigo-400",
  success: "bg-green-400",
  warning: "bg-yellow-400",
  danger: "bg-red-400",
  info: "bg-blue-400",
};

/**
 * Rounded pill chip used for section eyebrows and status labels
 * (template's "Diagnostic layer active" / "System Active" badges).
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", withDot = false, pulse = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[0.68rem] font-sans font-medium uppercase tracking-[0.2em] text-zinc-400",
          className
        )}
        style={{
          background: tokens.gradients.chip,
          boxShadow: tokens.shadows.chip,
        }}
        {...props}
      >
        {withDot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              DOT_COLORS[variant],
              pulse && "animate-pulse-dot"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

/** StatusBadge — semantic alias with colored dot and semantic default. */
export const StatusBadge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "success", ...props }, ref) => (
    <Badge ref={ref} variant={variant} withDot pulse {...props} />
  )
);
StatusBadge.displayName = "StatusBadge";

/** Chip — non-pill rectangular compact label. */
export const Chip = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border border-white/10 px-2 py-1 text-[0.7rem] uppercase tracking-widest text-zinc-400",
        className
      )}
      style={{ background: "rgba(255,255,255,0.04)" }}
      {...props}
    >
      {children}
    </span>
  )
);
Chip.displayName = "Chip";
