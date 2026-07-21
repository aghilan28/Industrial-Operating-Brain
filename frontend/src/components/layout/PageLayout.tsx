import * as React from "react";
import { cn } from "@/utils/cn";

export interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Page heading area */
  header?: React.ReactNode;
}

/** Simple vertical page layout: header slot + scrolling content. */
export function PageLayout({ children, className, header }: PageLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {header && <div className="flex flex-col gap-2">{header}</div>}
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
