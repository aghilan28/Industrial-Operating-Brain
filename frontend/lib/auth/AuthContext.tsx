"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContextType, AuthUser, JWTClaims } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): JWTClaims | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [error, setError] = useState<string | null>(null);

  const setSessionCookie = useCallback((authToken: string | null) => {
    if (authToken) {
      document.cookie = `iob_session=${authToken}; path=/; max-age=86400; SameSite=Lax`;
    } else {
      document.cookie = `iob_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  }, []);

  const login = useCallback((accessToken: string) => {
    const claims = parseJwt(accessToken);
    if (!claims || (claims.exp && claims.exp * 1000 < Date.now())) {
      setError("Invalid or expired token provided");
      return;
    }

    const rolesList = claims.roles || (claims.role ? [claims.role] : []);
    const primaryRole = claims.role || (rolesList.length > 0 ? rolesList[0] : "user");

    const authUser: AuthUser = {
      id: claims.sub,
      role: primaryRole,
      roles: rolesList,
      permissions: claims.permissions || [],
    };

    localStorage.setItem("iob_access_token", accessToken);
    setSessionCookie(accessToken);
    setToken(accessToken);
    setUser(authUser);
    setStatus("authenticated");
    setError(null);
  }, [setSessionCookie]);

  const logout = useCallback(() => {
    localStorage.removeItem("iob_access_token");
    setSessionCookie(null);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, [setSessionCookie]);

  useEffect(() => {
    const storedToken = localStorage.getItem("iob_access_token");
    if (storedToken) {
      const claims = parseJwt(storedToken);
      if (claims && claims.exp && claims.exp * 1000 > Date.now()) {
        login(storedToken);
      } else {
        logout();
      }
    } else {
      setStatus("unauthenticated");
    }
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ user, token, status, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
