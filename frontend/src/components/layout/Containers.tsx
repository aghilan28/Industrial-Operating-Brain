import * as React from "react";
import { cn } from "@/utils/cn";

/* ============================================================
   Reusable container primitives extracted from the template.
   These are purely structural — no business logic.
   ============================================================ */

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * PageContainer — max-w-7xl outer bound, used on <main> and <footer>.
 * Matches template: mx-auto max-w-7xl px-4 sm:px-6 lg:px-8
 */
export const PageContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  )
);
PageContainer.displayName = "PageContainer";

/** SectionContainer — generic vertical stack. */
export const SectionContainer = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <section ref={ref} className={cn("relative", className)} {...props}>
      {children}
    </section>
  )
);
SectionContainer.displayName = "SectionContainer";

/** ContentContainer — padded content area used inside frames for headers/content. */
export const ContentContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 sm:p-8", className)} {...props}>
      {children}
    </div>
  )
);
ContentContainer.displayName = "ContentContainer";

/** WidgetContainer — the label-pill-like floating widget. */
export const WidgetContainer = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-white/10 p-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
WidgetContainer.displayName = "WidgetContainer";

/** GridContainer — thin wrapper around CSS grid. */
export type GridContainerProps = ContainerProps & {
  cols?: { base?: string; sm?: string; md?: string; lg?: string };
  gap?: string;
};

export const GridContainer = React.forwardRef<HTMLDivElement, GridContainerProps>(
  ({ className, cols, gap = "gap-0", children, ...props }, ref) => {
    const colCls = [
      cols?.base ? `grid-cols-${cols.base}` : "grid-cols-1",
      cols?.sm ? `sm:grid-cols-${cols.sm}` : "",
      cols?.md ? `md:grid-cols-${cols.md}` : "",
      cols?.lg ? `lg:grid-cols-${cols.lg}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div
        ref={ref}
        className={cn("grid auto-rows-fr", colCls, gap, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GridContainer.displayName = "GridContainer";

/** FlexContainer — thin flex wrapper. */
export const FlexContainer = React.forwardRef<
  HTMLDivElement,
  ContainerProps & { direction?: "row" | "col"; align?: string; justify?: string; gap?: string }
>(
  (
    { className, direction = "row", align, justify, gap = "gap-0", children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        align,
        justify,
        gap,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
FlexContainer.displayName = "FlexContainer";

/** Divider — 1px white/10 horizontal rule. */
export const Divider: React.FC<React.HTMLAttributes<HTMLHRElement>> = ({
  className,
  ...props
}) => (
  <hr
    className={cn("border-t border-white/10", className)}
    {...props}
  />
);
