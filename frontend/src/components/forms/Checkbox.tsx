"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-black/40 transition",
        "checked:bg-indigo-500 checked:border-indigo-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
        className
      )}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";
