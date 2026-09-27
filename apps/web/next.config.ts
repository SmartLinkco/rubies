import type { NextConfig } from "next";

const apiTarget = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["@rubies/shared"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
    /** Keep optimized Neon dish photos warm across navigations */
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.aws.neon.tech",
      },
      {
        protocol: "https",
        hostname: "**.neon.tech",
      },
      {
        protocol: "https",
        hostname: "br-royal-rice-b5yequx9.storage.c-7.us-east-2.aws.neon.tech",
      },
    ],
  },
  async rewrites() {
    // Browser calls /api-proxy/* (same origin) so session cookies work when the
    // real API lives on another host (Render). SSR still uses NEXT_PUBLIC_API_URL.
    if (!apiTarget || apiTarget.startsWith("/")) return [];
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
