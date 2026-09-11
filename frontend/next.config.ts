import type { NextConfig } from "next";
import fs from "fs";

// Fix Windows case-sensitivity path issues by forcing the process to use the real filesystem casing
try {
  const realCwd = fs.realpathSync.native(process.cwd());
  if (process.cwd() !== realCwd) {
    process.chdir(realCwd);
  }
} catch (e) {
  // Fallback in case realpathSync fails
}

const nextConfig: NextConfig = {
  // Allow HMR connections from 127.0.0.1 (same machine, different origin format)
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.1.16'],

  // Disable dev indicators overlay to suppress DevTools pointer capture errors in console
  devIndicators: false,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json; charset=utf-8" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },

  async rewrites() {
    const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    let backendUrl = rawUrl && rawUrl.startsWith('http')
      ? rawUrl.replace(/\/api\/?.*$/, '')
      : "http://127.0.0.1:5000";
    backendUrl = backendUrl.replace('://localhost:', '://127.0.0.1:');
    return [
      {
        source: "/api/public/:path*",
        destination: `${backendUrl}/api/public/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${backendUrl}/api/admin/:path*`,
      },
      {
        source: "/api/health",
        destination: `${backendUrl}/api/health`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
