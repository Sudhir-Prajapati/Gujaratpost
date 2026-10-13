import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Never pre-render at build time
export const revalidate = 0; // No static caching — runs on each request

export async function GET(_request: NextRequest) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const defaultBackend = isProd ? 'https://api.gujaratpost.in' : 'http://127.0.0.1:5000';
    let rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    let backendUrl = '';
    if (rawUrl && typeof rawUrl === 'string') {
      const trimmed = rawUrl.trim();
      if (trimmed && !trimmed.startsWith('/')) {
        try {
          const url = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
          if (!isProd || (url.hostname.includes('.') && url.hostname !== 'api')) {
            let pathname = url.pathname.replace(/\/+$/, '');
            if (pathname.endsWith('/api/public')) {
              pathname = pathname.slice(0, -'/api/public'.length);
            } else if (pathname.endsWith('/api')) {
              pathname = pathname.slice(0, -'/api'.length);
            }
            backendUrl = `${url.origin}${pathname}`;
          }
        } catch {
          backendUrl = '';
        }
      }
    }
    if (!backendUrl || (isProd && (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1') || backendUrl === 'https://api'))) {
      backendUrl = defaultBackend;
    }
    const res = await fetch(`${backendUrl}/api/public/reels?limit=50`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = await res.json();
      const reels = json?.data?.reels || [];
      return NextResponse.json(
        { success: true, data: reels },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
      );
    }

    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  } catch (err: any) {
    console.error('Error in /api/instagram-reels route:', err?.message || err);
    return NextResponse.json({ success: false, data: [], error: err?.message }, { status: 200 });
  }
}
