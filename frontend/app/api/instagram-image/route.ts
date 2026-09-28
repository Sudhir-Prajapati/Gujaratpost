import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 86400; // Cache image for 24 hours

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const shortcode = searchParams.get('shortcode');

  let targetUrl = imageUrl;
  if (!targetUrl && shortcode) {
    targetUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
  }

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/',
      },
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const imageBuffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'image/jpeg';

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
      });
    }

    // Fallback: try Instagram shortcode media endpoint
    if (shortcode) {
      const fallbackUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Referer': 'https://www.instagram.com/',
        },
      });

      if (fallbackRes.ok) {
        const imageBuffer = await fallbackRes.arrayBuffer();
        const contentType = fallbackRes.headers.get('content-type') || 'image/jpeg';
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        });
      }
    }

    return new NextResponse('Failed to fetch image', { status: res.status });
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Instagram image proxy error:', err?.message || err);
    }
    return new NextResponse('Image proxy error', { status: 500 });
  }
}
