import * as React from "react";
import { cn } from "@/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the indigo top-edge hover gradient used on ui-card */
  hoverAccent?: boolean;
}

/**
 * Generic container card matching template's ui-card visual treatment.
 * Does not include corner brackets (use PanelFrame for that).
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverAccent = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "ui-card group relative flex flex-col",
          hoverAccent &&
            "transition-colors duration-700",
          className
        )}
        {...props}
      >
        {hoverAccent && (
          <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100 pointer-events-none" />
        )}
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardMedia.displayName = "CardMedia";

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative z-10 mt-auto border-t border-white/5 bg-black/20 p-5 sm:p-8 pt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardBody.displayName = "CardBody";
