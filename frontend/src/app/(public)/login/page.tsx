"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { api } from "@/lib/api/axiosClient";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Backend OAuth2 Password request format
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post("/api/v1/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, user } = response.data;

      // Build user object from response or defaults
      const userData = user || {
        userId: username,
        role: "OPERATOR",
        roles: ["OPERATOR"],
      };

      login(access_token, userData);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failure:", err);
      if (err.response?.status === 401) {
        setError("Invalid username or password.");
      } else if (err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Connection failed. Please check backend server status.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/60 p-8 backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Industrial Operating Brain
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400 font-sans">
            Enterprise Security Portal
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800/40 bg-red-950/30 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-300 font-sans">
              Username / User ID
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g. operator_01"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-300 font-sans">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
