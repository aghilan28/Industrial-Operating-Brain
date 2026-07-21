"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

/** Toast — surface-rendered notification. Uses PanelFrame-like styling. */
export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = "default",
  onClose,
}) => {
  const accent = {
    default: "border-zinc-500/40",
    success: "border-green-500/40",
    warning: "border-yellow-500/40",
    danger: "border-red-500/40",
    info: "border-blue-500/40",
  }[variant];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto w-80 max-w-[90vw] rounded-xl border p-4 font-sans",
        accent
      )}
      style={{
        background: tokens.gradients.labelPill,
        boxShadow: tokens.shadows.labelPill,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && (
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-200">
              {title}
            </p>
          )}
          {description && (
            <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Dismiss notification"
            className="text-zinc-500 transition hover:text-zinc-200 focus-ring rounded"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
