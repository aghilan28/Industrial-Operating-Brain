/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@iconify/react", "gsap", "three"],
  },
};

export default nextConfig;
