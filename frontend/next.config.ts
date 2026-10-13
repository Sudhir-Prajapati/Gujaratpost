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
    function cleanBackendUrl(raw?: string, isProd = false): string {
      if (!raw || typeof raw !== 'string') return '';
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith('/')) return '';
      try {
        const urlStr = trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? trimmed
          : `https://${trimmed}`;
        const parsed = new URL(urlStr);

        if (isProd && (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
          return '';
        }
        if (parsed.hostname === 'api') {
          return '';
        }

        let pathname = parsed.pathname.replace(/\/+$/, '');
        if (pathname.endsWith('/api/public')) {
          pathname = pathname.slice(0, -'/api/public'.length);
        } else if (pathname.endsWith('/api')) {
          pathname = pathname.slice(0, -'/api'.length);
        }
        return `${parsed.origin}${pathname}`;
      } catch {
        return '';
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    let backendUrl = cleanBackendUrl(rawUrl, isProduction);

    if (isProduction) {
      if (!backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1') || backendUrl === 'https://api') {
        backendUrl = 'https://api.gujaratpost.in';
      }
    } else {
      if (!backendUrl) {
        backendUrl = 'http://127.0.0.1:5000';
      }
      if (backendUrl.includes('localhost:')) {
        backendUrl = backendUrl.replace('://localhost:', '://127.0.0.1:');
      }
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
