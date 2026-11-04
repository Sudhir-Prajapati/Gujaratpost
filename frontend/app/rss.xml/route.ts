import { NextRequest } from 'next/server';
import { getBackendApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = getBackendApiUrl('/api/public/rss' + request.nextUrl.search);
    const headers: Record<string, string> = {};

    // Aggregators like Dailyhunt must always receive 200 OK with full XML (never 304)

    const res = await fetch(backendUrl, {
      headers,
      cache: 'no-store',
    });

    

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
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Gujarat Post</title><description>News Feed</description></channel></rss>',
      {
        status: 500,
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
      }
    );
  }
}
