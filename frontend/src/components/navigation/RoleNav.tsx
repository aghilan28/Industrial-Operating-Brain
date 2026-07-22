"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { CanAccess } from "@/components/auth/CanAccess";

export function RoleNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", roles: ["ADMIN", "OPERATOR", "ENGINEER", "ANALYST"] },
    { label: "Assets", href: "/assets", roles: ["ADMIN", "OPERATOR", "ENGINEER"] },
    { label: "Telemetry", href: "/telemetry", roles: ["ADMIN", "OPERATOR", "ENGINEER", "ANALYST"] },
    { label: "Incidents", href: "/incidents", roles: ["ADMIN", "OPERATOR"] },
    { label: "Admin", href: "/admin", roles: ["ADMIN"] },
  ];

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-white/10 bg-neutral-900/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-sm font-bold tracking-tight text-white font-sans">
          IOB Platform
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <CanAccess key={item.href} role={item.roles}>
              <Link
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  pathname === item.href
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            </CanAccess>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-medium text-white">{user?.userId || "User"}</p>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            {user?.roles?.join(", ") || user?.role || "OPERATOR"}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-red-950/50 hover:text-red-400 hover:border-red-900/50 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
