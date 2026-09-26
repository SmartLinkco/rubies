import type { NextConfig } from "next";

const apiTarget = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["@rubies/shared"],
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
