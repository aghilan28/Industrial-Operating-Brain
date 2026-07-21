"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className,
  title,
  description,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 p-6",
          className
        )}
        style={{
          background: tokens.gradients.labelPill,
          boxShadow: tokens.shadows.labelPill,
        }}
      >
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-200 font-sans">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs leading-5 text-zinc-400 font-sans">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};
