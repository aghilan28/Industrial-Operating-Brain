"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { cn } from "@/utils/cn";
import { tokens } from "@/tokens";
import { IconButton } from "@/components/ui/Button";
import { Input } from "@/components/forms/Input";
import { Avatar } from "@/components/ui/Avatar";
import { PRIMARY_NAV, BREADCRUMB_PLACEHOLDER, APP_IDENTITY } from "@/constants/navigation";

export interface AppHeaderProps {
  onMenuToggle?: () => void;
  className?: string;
}

/**
 * Application header — replaces the marketing nav.
 * Supports: logo, breadcrumb, global search placeholder, notifications,
 * user avatar, theme toggle placeholder, connection status placeholder.
 */
export function AppHeader({ onMenuToggle, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "relative z-20 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl sticky top-0",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-stretch justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          aria-label={`${APP_IDENTITY.name} home`}
          className="group relative flex min-h-20 items-center gap-3 border-x border-white/10 px-4 sm:px-6"
        >
          <span className="absolute -left-1 top-4 h-2 w-2 bg-zinc-500" />
          <span className="absolute -right-1 bottom-4 h-2 w-2 bg-zinc-500" />
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-sm font-medium text-white font-sans"
            style={{
              background: tokens.gradients.logoBadge,
              boxShadow: tokens.shadows.logoBadge,
              textShadow: tokens.shadows.textShadowLogo,
            }}
          >
            {APP_IDENTITY.initials}
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block text-sm font-medium tracking-tight text-white font-sans">
              {APP_IDENTITY.name}
            </span>
            <span className="mt-1 block text-xs font-normal uppercase tracking-widest text-zinc-500 font-sans">
              {APP_IDENTITY.tagline}
            </span>
          </span>
        </Link>

        {/* Primary navigation (desktop) — placeholders wired from config */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-stretch lg:flex"
        >
          {PRIMARY_NAV.length === 0 ? (
            <div className="flex items-center px-5 text-[0.68rem] font-sans uppercase tracking-widest text-zinc-600">
              {/* Placeholder shown until Phase 2 adds routes */}
            </div>
          ) : (
            PRIMARY_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-2 border-r border-white/10 px-5 text-xs font-medium uppercase tracking-widest text-zinc-400 transition hover:text-white font-sans"
              >
                {item.icon && <Icon icon={item.icon} className="text-lg" />}
                {item.label}
              </Link>
            ))
          )}

          {/* Breadcrumb shown when top nav is empty */}
          {PRIMARY_NAV.length === 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 border-r border-white/10 px-5 text-xs font-sans text-zinc-500"
            >
              {BREADCRUMB_PLACEHOLDER.map((b, i) => (
                <React.Fragment key={b.label}>
                  {i > 0 && (
                    <Icon
                      icon="solar:alt-arrow-right-linear"
                      className="text-base text-zinc-700"
                    />
                  )}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-zinc-200 transition">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-zinc-300">{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </nav>

        {/* Action cluster */}
        <div className="hidden items-center gap-3 py-4 lg:flex">
          {/* Global search placeholder */}
          <div className="relative w-72">
            <Input
              aria-label="Global search"
              placeholder="Search (⌘K)"
              leading={<Icon icon="solar:magnifer-linear" className="text-lg" />}
              readOnly
              className="h-10 cursor-pointer"
            />
          </div>

          {/* Connection status placeholder */}
          <div
            className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[0.68rem] font-sans font-medium uppercase tracking-widest md:inline-flex"
            style={{
              background: tokens.gradients.chip,
              boxShadow: tokens.shadows.chip,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-dot" />
            <span className="text-zinc-400">Connected</span>
          </div>

          {/* Notifications */}
          <IconButton aria-label="Notifications">
            <Icon icon="solar:bell-bing-linear" className="text-lg" />
          </IconButton>

          {/* Theme toggle placeholder */}
          <IconButton aria-label="Toggle theme" disabled>
            <Icon icon="solar:sun-2-linear" className="text-lg" />
          </IconButton>

          {/* User avatar */}
          <button
            aria-label="Account menu"
            className="rounded-full focus-ring"
          >
            <Avatar initials="IO" size="md" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 py-4 lg:hidden">
          <IconButton aria-label="Search">
            <Icon icon="solar:magnifer-linear" className="text-lg" />
          </IconButton>
          <IconButton
            aria-label="Open menu"
            onClick={onMenuToggle}
          >
            <Icon icon="solar:hamburger-menu-linear" className="text-xl" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
