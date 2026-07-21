"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
  title?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  children,
  side = "right",
  className,
  title,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-drawer" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className={cn(
          "absolute top-0 h-full w-[85vw] max-w-sm overflow-y-auto border-white/10 p-6",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className
        )}
        style={{
          background: tokens.gradients.panelDark,
          boxShadow: tokens.shadows.panel,
        }}
      >
        {title && (
          <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-zinc-200 font-sans">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};
