import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(_request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
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
