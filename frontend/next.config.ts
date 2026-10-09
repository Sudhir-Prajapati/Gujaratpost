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
  // Allow HMR connections from 127.0.0.1 and tunnel domains
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '192.168.1.16',
    '*.ngrok-free.app',
    '*.ngrok.app',
    '*.trycloudflare.com',
    '*.loca.lt',
    '*.pinggy.link',
    '*.a.pinggy.link',
    '*.github.dev',
  ],

  // Disable dev indicators overlay to suppress DevTools pointer capture errors in console
  devIndicators: false,


  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
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
      {
        source: "/:file(.*\\.apk)",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: "attachment; filename=\"GujaratPost.apk\"" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },

  async rewrites() {
    let rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (process.env.NODE_ENV === 'production' && rawUrl && (rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1'))) {
      rawUrl = undefined;
    }
    const defaultBackend = process.env.NODE_ENV === 'production'
      ? "https://gujaratpost.onrender.com"
      : "http://127.0.0.1:5000";
    let backendUrl = rawUrl && rawUrl.startsWith('http')
      ? rawUrl.replace(/\/api\/?.*$/, '')
      : defaultBackend;
    if (backendUrl.includes('localhost:') && process.env.NODE_ENV !== 'production') {
      backendUrl = backendUrl.replace('://localhost:', '://127.0.0.1:');
    }
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
