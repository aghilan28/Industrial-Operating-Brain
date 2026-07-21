"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * ScrollArea — overflow-y-auto container with the custom scrollbar
 * already provided globally. Prevents Lenis capture for wheel events.
 */
export const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    data-lenis-prevent
    className={cn("overflow-y-auto overflow-x-hidden", className)}
    {...props}
  >
    {children}
  </div>
));
ScrollArea.displayName = "ScrollArea";
