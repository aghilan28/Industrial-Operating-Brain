"use client";

import React from "react";
import { useAuth } from "@/lib/auth/AuthContext";

interface CanAccessProps {
  children: React.ReactNode;
  role?: string | string[];
  fallback?: React.ReactNode;
}

export function CanAccess({ children, role, fallback = null }: CanAccessProps) {
  const { hasRole } = useAuth();

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
