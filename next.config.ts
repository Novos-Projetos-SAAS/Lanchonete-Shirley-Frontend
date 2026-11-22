import type { NextConfig } from "next";
import { resolveApiConnection } from "./src/lib/api-url";

const apiConnection = resolveApiConnection(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api/v1", process.env.NEXT_PUBLIC_SITE_URL);

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "https://shirley-lanches-artesanais.vercel.app/"],
  // Preserva /socket.io/ no handshake do Engine.IO.
  skipTrailingSlashRedirect: apiConnection.rewrites.length > 0,
  async rewrites() {
    return apiConnection.rewrites;
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default nextConfig;
