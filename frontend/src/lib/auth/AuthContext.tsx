"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  userId: string;
  role?: string;
  roles?: string[];
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "iob_access_token";
const USER_KEY = "iob_user_data";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Keep cookie in sync with localStorage on restore
        document.cookie = `iob_session=${encodeURIComponent(storedToken)}; path=/; max-age=86400; SameSite=Lax`;
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    // Set the cookie for server middleware route guard
    if (typeof window !== "undefined") {
      document.cookie = `iob_session=${encodeURIComponent(newToken)}; path=/; max-age=86400; SameSite=Lax`;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear cookie
    if (typeof window !== "undefined") {
      document.cookie = "iob_session=; path=/; max-age=0; SameSite=Lax";
      window.location.href = "/login";
    }
  }, []);

  const hasRole = useCallback(
    (requiredRoles: string | string[]) => {
      if (!user) return false;
      const userRoles = user.roles || (user.role ? [user.role] : []);
      const checkRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return checkRoles.some((role) => userRoles.includes(role));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
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
