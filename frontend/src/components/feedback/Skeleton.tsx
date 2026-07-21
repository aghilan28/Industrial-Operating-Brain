import * as React from "react";
import { cn } from "@/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  rounded = "md",
  ...props
}) => (
  <div
    aria-hidden="true"
    className={cn(
      "animate-pulse bg-white/5",
      rounded === "sm" && "rounded-sm",
      rounded === "md" && "rounded",
      rounded === "lg" && "rounded-xl",
      rounded === "full" && "rounded-full",
      className
    )}
    {...props}
  />
);
