"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PanelFrame } from "@/components/ui/PanelFrame";
import { TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { StatusBadge, Badge } from "@/components/ui/Badge";

type UserRecord = {
  userId: string;
  email: string;
  role: "ADMIN" | "ENGINEER" | "OPERATOR";
  status: "active" | "suspended";
};

type AuditRecord = {
  timestamp: string;
  category: "AUTH" | "ALARM" | "WRITE" | "SYSTEM";
  operator: string;
  action: string;
  status: "SUCCESS" | "FAILURE";
};

const USERS: UserRecord[] = [
  { userId: "admin_01", email: "admin@operatingbrain.com", role: "ADMIN", status: "active" },
  { userId: "engineer_01", email: "eng.alpha@operatingbrain.com", role: "ENGINEER", status: "active" },
  { userId: "operator_01", email: "op.402@operatingbrain.com", role: "OPERATOR", status: "active" },
  { userId: "operator_02", email: "op.119@operatingbrain.com", role: "OPERATOR", status: "active" }
];

const AUDIT_LOGS: AuditRecord[] = [
  { timestamp: "2026-07-22 10:14:02", category: "ALARM", operator: "engineer_01", action: "Acknowledge Alert: AL-0824", status: "SUCCESS" },
  { timestamp: "2026-07-22 09:44:18", category: "AUTH", operator: "operator_02", action: "Session Login (OAuth2 Password)", status: "SUCCESS" },
  { timestamp: "2026-07-22 08:12:00", category: "SYSTEM", operator: "admin_01", action: "Database Migration (PostgreSQL AsyncPG)", status: "SUCCESS" },
  { timestamp: "2026-07-21 16:51:24", category: "WRITE", operator: "operator_01", action: "Modify Telemetry Ingest Rate Limit", status: "FAILURE" }
];

export default function AdminPage() {
  const [auditCategory, setAuditCategory] = React.useState("all");

  const filteredLogs = React.useMemo(() => {
    return auditCategory === "all" ? AUDIT_LOGS : AUDIT_LOGS.filter(log => log.category === auditCategory);
  }, [auditCategory]);

  return (
    <ProtectedRoute requiredRole={["ADMIN"]}>
      <div className="space-y-6 select-none">
        {/* Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="success" className="font-semibold">
                Access Level: ADMIN
              </StatusBadge>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-zinc-500 font-sans">
                Controls: Role-Based (RBAC)
              </span>
            </div>
            <h1 className="text-3xl font-display font-semibold tracking-wider text-white mt-2">
              System Administration
            </h1>
            <p className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-sans">
              Manage platform security credentials, user roles, and platform audit trail logs
            </p>
          </div>
        </section>

        {/* Section 1: User Management */}
        <PanelFrame variant="dark" className="rounded-xl flex flex-col">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
              User Credential Profiles
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans uppercase mt-0.5">
              Authorized users registered inside the operational domain database
            </p>
          </div>

          <div className="p-4">
            <TableContainer className="border border-white/5">
              <TableHeader>
                <TableRow className="bg-zinc-950/80 border-b border-white/10 uppercase text-[10px]">
                  <TableHead className="py-3 px-4">User ID</TableHead>
                  <TableHead className="py-3 px-4">Email Address</TableHead>
                  <TableHead className="py-3 px-4">RBAC System Role</TableHead>
                  <TableHead className="py-3 px-4">Account Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {USERS.map((u) => (
                  <TableRow key={u.userId} className="hover:bg-zinc-900/40 transition">
                    <TableCell className="py-3 px-4 font-mono font-semibold text-indigo-400">{u.userId}</TableCell>
                    <TableCell className="py-3 px-4 font-sans text-zinc-300">{u.email}</TableCell>
                    <TableCell className="py-3 px-4 font-mono text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold border ${
                        u.role === "ADMIN"
                          ? "bg-indigo-950/30 text-indigo-300 border-indigo-800/40"
                          : u.role === "ENGINEER"
                          ? "bg-blue-950/30 text-blue-300 border-blue-800/40"
                          : "bg-zinc-900 text-zinc-400 border-zinc-700/40"
                      }`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                        u.status === "active"
                          ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/50"
                          : "bg-red-950/30 text-red-400 border-red-800/50"
                      }`}>
                        {u.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </div>
        </PanelFrame>

        {/* Section 2: Platform Audit Logs */}
        <PanelFrame variant="dark" className="rounded-xl flex flex-col">
          <div className="p-5 border-b border-white/10 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
                System Activity Audit Trail
              </h3>
              <p className="text-[10px] text-zinc-500 font-sans uppercase mt-0.5">
                Cryptographically logged records of read/write actions on controllers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-sans">Filter Category</span>
              <div className="relative min-w-[130px]">
                <select
                  value={auditCategory}
                  onChange={(e) => setAuditCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none uppercase font-bold tracking-wider"
                >
                  <option value="all">All Logs</option>
                  <option value="AUTH">Auth</option>
                  <option value="ALARM">Alarm</option>
                  <option value="WRITE">Write</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4">
            <TableContainer className="border border-white/5">
              <TableHeader>
                <TableRow className="bg-zinc-950/80 border-b border-white/10 uppercase text-[10px]">
                  <TableHead className="py-3 px-4">Timestamp</TableHead>
                  <TableHead className="py-3 px-4">Event Category</TableHead>
                  <TableHead className="py-3 px-4">Operator</TableHead>
                  <TableHead className="py-3 px-4">Logged Action Details</TableHead>
                  <TableHead className="py-3 px-4 text-right">Inference Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, index) => (
                  <TableRow key={index} className="hover:bg-zinc-900/40 transition">
                    <TableCell className="py-3 px-4 font-mono text-zinc-500">{log.timestamp}</TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 font-mono">
                        {log.category}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono text-zinc-300">{log.operator}</TableCell>
                    <TableCell className="py-3 px-4 font-sans text-white text-[13px]">{log.action}</TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/50"
                          : "bg-red-950/30 text-red-400 border-red-800/50"
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </div>
        </PanelFrame>
      </div>
    </ProtectedRoute>
  );
}
