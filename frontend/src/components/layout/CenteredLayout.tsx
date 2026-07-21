import * as React from "react";
import { cn } from "@/utils/cn";

export interface CenteredLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

/** Vertically + horizontally centered layout (for onboarding, empty states). */
export function CenteredLayout({
  children,
  className,
  maxWidth = "md",
}: CenteredLayoutProps) {
  const width = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];
  return (
    <div className={cn("flex min-h-[60vh] items-center justify-center p-6", className)}>
      <div className={cn("w-full", width)}>{children}</div>
    </div>
  );
}
