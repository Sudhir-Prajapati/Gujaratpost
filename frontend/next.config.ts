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
  // Support zero-downtime builds via atomic directory swapping
  distDir: process.env.NEXT_DIST_DIR || '.next',

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

  async redirects() {
    return [
      // 1. Direct redirects for legacy/spreadsheet URLs (exact casing matches)
      {
        source: '/news/listing/Gujarat',
        destination: '/category/gujarat',
        permanent: true,
      },
      {
        source: '/news/listing/Loksabha-Election',
        destination: '/category/elections',
        permanent: true,
      },
      {
        source: '/news/listing/Ahmedabad',
        destination: '/category/ahmedabad',
        permanent: true,
      },
      {
        source: '/news/listing/Surat',
        destination: '/category/surat',
        permanent: true,
      },
      {
        source: '/news/listing/Rajkot',
        destination: '/category/rajkot',
        permanent: true,
      },
      {
        source: '/news/listing/Vadodara',
        destination: '/category/vadodara',
        permanent: true,
      },
      {
        source: '/news/listing/Gandhinagar',
        destination: '/category/gandhinagar',
        permanent: true,
      },
      {
        source: '/news/listing/others',
        destination: '/category/other-cities',
        permanent: true,
      },
      {
        source: '/news/listing/National',
        destination: '/category/national',
        permanent: true,
      },
      {
        source: '/news/listing/national',
        destination: '/category/national',
        permanent: true,
      },
      {
        source: '/news/listing/international',
        destination: '/category/world',
        permanent: true,
      },
      {
        source: '/news/listing/International',
        destination: '/category/world',
        permanent: true,
      },
      {
        source: '/news/listing/entertainment-life-style',
        destination: '/category/entertainment',
        permanent: true,
      },
      {
        source: '/news/listing/popular-stories',
        destination: '/category/trending',
        permanent: true,
      },
      {
        source: '/news/listing/Politics',
        destination: '/category/politics',
        permanent: true,
      },
      {
        source: '/news/listing/Fact-Check',
        destination: '/category/fact-check',
        permanent: true,
      },
      {
        source: '/news/listing/fact-check',
        destination: '/category/fact-check',
        permanent: true,
      },
      {
        source: '/news/listing/photos',
        destination: '/photos',
        permanent: true,
      },
      {
        source: '/news/listing/gallery',
        destination: '/photos',
        permanent: true,
      },

      // 2. Generic fallback for any other /news/listing/:slug
      {
        source: '/news/listing/:slug',
        destination: '/category/:slug',
        permanent: true,
      },

      // 3. Photo gallery legacy URL redirects
      {
        source: '/gallery',
        destination: '/photos',
        permanent: true,
      },
      {
        source: '/gallery/:path*',
        destination: '/photos',
        permanent: true,
      },

      // 4. Election route aliases
      {
        source: '/Loksabha-Election',
        destination: '/category/elections',
        permanent: true,
      },
      {
        source: '/loksabha-election',
        destination: '/category/elections',
        permanent: true,
      },
      {
        source: '/Election',
        destination: '/category/elections',
        permanent: true,
      },
      {
        source: '/election',
        destination: '/category/elections',
        permanent: true,
      },

      // 5. Category alias redirects
      {
        source: '/category/international',
        destination: '/category/world',
        permanent: true,
      },
      {
        source: '/category/entertainment-life-style',
        destination: '/category/entertainment',
        permanent: true,
      },
      {
        source: '/category/popular-stories',
        destination: '/category/trending',
        permanent: true,
      },
      {
        source: '/category/others',
        destination: '/category/other-cities',
        permanent: true,
      },
      {
        source: '/category/other',
        destination: '/category/other-cities',
        permanent: true,
      },
      {
        source: '/category/loksabha-election',
        destination: '/category/elections',
        permanent: true,
      },
      {
        source: '/category/election',
        destination: '/category/elections',
        permanent: true,
      },
      {
        source: '/category/Fact-Check',
        destination: '/category/fact-check',
        permanent: true,
      },
      {
        source: '/category/factcheck',
        destination: '/category/fact-check',
        permanent: true,
      },
    ];
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
