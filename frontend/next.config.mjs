/** @type {import('next').NextConfig} */

// PHASE 7 FIX — hardcoded loopback removed.
// The previous value `http://localhost:8000` resolved to the FRONTEND
// container's own network namespace once containerised, so every rewritten
// /api request died with ECONNREFUSED. Resolve the backend over the
// iob-app-net service alias instead, with a localhost fallback for
// bare-metal `npm run dev`.
const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@iconify/react", "gsap", "three"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
