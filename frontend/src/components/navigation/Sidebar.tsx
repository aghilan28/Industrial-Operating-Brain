"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";
import { SIDEBAR_SECTIONS, type NavItem } from "@/constants/navigation";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { IconButton } from "@/components/ui/Button";

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  className?: string;
}

/**
 * Enterprise sidebar: collapsed/expanded, scrollable, nested menus,
 * active + hover states, keyboard accessible.
 */
export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) =>
    setOpenGroups((s) => ({ ...s, [id]: !(s[id] ?? true) }));

  const isActive = (href: string) =>
    href !== "#" && (pathname === href || pathname?.startsWith(href + "/"));

  const NavLink: React.FC<{ item: NavItem; depth?: number }> = ({
    item,
    depth = 0,
  }) => {
    const active = isActive(item.href);
    const hasChildren = !!item.children?.length;
    const open = openGroups[item.id] ?? true;
    const base =
      "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.72rem] font-sans font-medium uppercase tracking-widest transition focus-ring";
    const state = active
      ? "text-white bg-white/[0.06]"
      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]";

    if (hasChildren) {
      return (
        <div>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => toggleGroup(item.id)}
            className={cn(base, state, "justify-between")}
            style={
              active
                ? {
                    background: tokens.gradients.iconBtnBg,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.7)",
                  }
                : undefined
            }
          >
            <span className="flex items-center gap-3 min-w-0">
              {item.icon && (
                <Icon
                  icon={item.icon}
                  className="text-lg shrink-0 text-zinc-400 group-hover:text-white"
                />
              )}
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </span>
            {!collapsed && (
              <Icon
                icon="solar:alt-arrow-down-linear"
                className={cn(
                  "text-base transition-transform",
                  open ? "rotate-0" : "-rotate-90"
                )}
              />
            )}
          </button>
          {open && !collapsed && (
            <div className="mt-1 ml-4 border-l border-white/10 pl-2 space-y-0.5">
              {item.children!.map((child) => (
                <NavLink key={child.id} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={onMobileClose}
        className={cn(base, state, depth > 0 && "pl-9")}
        style={
          active
            ? {
                background: tokens.gradients.iconBtnBg,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.7)",
              }
            : undefined
        }
      >
        {item.icon && (
          <Icon
            icon={item.icon}
            className={cn(
              "text-lg shrink-0",
              active ? "text-indigo-400" : "text-zinc-400 group-hover:text-white"
            )}
          />
        )}
        {!collapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}
        {!collapsed && item.badge && (
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[0.6rem] font-sans uppercase tracking-widest text-indigo-300">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const width = collapsed ? "w-[4.5rem]" : "w-64";

  const content = (
    <aside
      aria-label="Sidebar"
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl transition-[width] duration-200",
        width,
        className
      )}
    >
      {/* Collapse control */}
      <div className="flex h-20 items-center justify-end border-b border-white/10 px-3">
        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
        >
          <Icon
            icon={
              collapsed
                ? "solar:alt-arrow-right-linear"
                : "solar:alt-arrow-left-linear"
            }
            className="text-lg"
          />
        </IconButton>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav aria-label="Main" className="space-y-6">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.id}>
              {!collapsed && section.title && (
                <p className="mb-2 px-3 text-[0.65rem] font-sans font-medium uppercase tracking-[0.28em] text-zinc-600">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom status stub */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2",
            collapsed ? "justify-center" : "justify-between"
          )}
          style={{
            background: tokens.gradients.buttonSecondary,
            boxShadow: tokens.shadows.button,
          }}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400 animate-pulse-dot" />
            {!collapsed && (
              <span className="truncate text-[0.68rem] font-sans uppercase tracking-widest text-zinc-300">
                System online
              </span>
            )}
          </span>
          {!collapsed && (
            <span className="text-[0.65rem] font-sans uppercase tracking-widest text-zinc-600">
              v0.1
            </span>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0">{content}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-modal lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
