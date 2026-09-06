import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const backendEndpoint = `http://127.0.0.1:5000/api/public/support?t=${Date.now()}`;

    const res = await fetch(backendEndpoint, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Backend error ${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error in App Router /api/public/support route:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch support details' },
      { status: 500 }
    );
  }
}
