import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "nav";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  asChild?: boolean;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-[0.68rem]",
  md: "h-10 px-4 text-xs",
  lg: "h-12 px-5 text-xs",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-medium uppercase tracking-[0.2em] transition select-none rounded-lg focus-ring disabled:opacity-50 disabled:pointer-events-none";

const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: tokens.gradients.buttonPrimary,
    color: "#000",
    border: "1px solid rgba(255,255,255,0.20)",
    boxShadow: tokens.shadows.buttonPrimary,
  },
  secondary: {
    background: tokens.gradients.buttonSecondary,
    color: "#d4d4d8",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: tokens.shadows.button,
  },
  ghost: {
    background: "transparent",
    color: "#a1a1aa",
    border: "1px solid transparent",
  },
  nav: {
    background: "transparent",
    color: "#a1a1aa",
  },
};

const VARIANT_HOVER: Record<ButtonVariant, string> = {
  primary: "hover:brightness-105",
  secondary: "hover:border-white/25 hover:text-white",
  ghost: "hover:text-white",
  nav: "hover:text-white",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      leadingIcon,
      trailingIcon,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const radius = size === "lg" ? "rounded-xl" : "rounded-lg";
    return (
      <button
        ref={ref}
        className={cn(BASE, SIZE_CLASSES[size], VARIANT_HOVER[variant], radius, className)}
        style={{ ...VARIANT_STYLE[variant], ...style }}
        {...props}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label - required for icon-only buttons */
  "aria-label": string;
  variant?: "default" | "primary";
  size?: "sm" | "md";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "default", size = "md", children, style, ...props }, ref) => {
    const sizeCls = size === "sm" ? "h-9 w-9" : "h-10 w-10";
    const variantStyle: React.CSSProperties =
      variant === "primary"
        ? VARIANT_STYLE.primary
        : {
            background: tokens.gradients.iconBtnBg,
            color: "#d4d4d8",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.8)",
          };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition hover:border-white/25 hover:text-white focus-ring",
          sizeCls,
          className
        )}
        style={{ ...variantStyle, ...style }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
