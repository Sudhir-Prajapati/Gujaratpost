import { NextRequest } from 'next/server';
import { getBackendApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const cleanCategory = (slug || '').replace(/\.xml$/i, '').trim();

    if (!cleanCategory) {
      return new Response('Category required', { status: 400 });
    }

    const endpoint = cleanCategory.toLowerCase() === 'home'
      ? '/api/public/rss'
      : `/api/public/rss/${encodeURIComponent(cleanCategory)}`;
    const backendUrl = getBackendApiUrl(endpoint + request.nextUrl.search);
    const headers: Record<string, string> = {};


    // Aggregators like Dailyhunt must always receive 200 OK with full XML (never 304)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(backendUrl, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const xmlText = await res.text();
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    };

    const etag = res.headers.get('etag');
    const lastModified = res.headers.get('last-modified');
    if (etag) responseHeaders['ETag'] = etag;
    if (lastModified) responseHeaders['Last-Modified'] = lastModified;

    return new Response(xmlText, {
      status: res.ok ? res.status : 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[RSS Dynamic Slug Route Error]', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Gujarat Post</title><description>Category News Feed</description></channel></rss>',
      {
        status: 200,
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
      }
    );
  }
}
