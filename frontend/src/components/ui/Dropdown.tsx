"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  className?: string;
}

/** Dropdown — minimal popover menu styled to match the glass-pill language. */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "end",
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring rounded-lg"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-dropdown mt-2 min-w-[12rem] rounded-xl border border-white/10 p-1",
            align === "end" ? "right-0" : "left-0"
          )}
          style={{
            background: tokens.gradients.labelPill,
            boxShadow: tokens.shadows.labelPill,
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect?.();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-sans uppercase tracking-widest transition",
                item.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white",
                item.disabled && "opacity-50 pointer-events-none"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
