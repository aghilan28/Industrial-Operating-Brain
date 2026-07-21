import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@iconify/react", "gsap", "three"],
  },
};

export default nextConfig;
