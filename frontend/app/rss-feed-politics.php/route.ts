import { NextRequest } from 'next/server';
import { getBackendApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

const LEGACY_MAP: Record<string, string> = {
  'news': 'home',
  'gujarat': 'gujarat',
  'gandhinagar': 'gandhinagar',
  'ahmedabad': 'ahmedabad',
  'surat': 'surat',
  'vadodara': 'vadodara',
  'rajkot': 'rajkot',
  'others': 'other-cities',
  'national': 'national',
  'international': 'world',
  'entertainment-life-style': 'entertainment-life-style',
  'popular-stories': 'trending',
  'politics': 'politics',
  'fact-check': 'fact-check',
  'health': 'health',
  'technology': 'technology',
  'crime': 'crime',
  'video': 'videos',
  'videos': 'videos',
  'shorts': 'videos',
  'instagram': 'instagram',
  'reels': 'instagram',
  'gallery': 'photos',
  'photos': 'photos',
  'home': 'home',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawName = (searchParams.get('name') || '').trim().toLowerCase();
    const mappedCategory = rawName ? (LEGACY_MAP[rawName] || rawName) : 'politics';

    const backendUrl = getBackendApiUrl(
      `/api/public/rss-feed-politics.php?name=${encodeURIComponent(mappedCategory)}`
    );
    const headers: Record<string, string> = {};

    const ifNoneMatch = request.headers.get('if-none-match');
    const ifModifiedSince = request.headers.get('if-modified-since');

    if (ifNoneMatch) headers['If-None-Match'] = ifNoneMatch;
    if (ifModifiedSince) headers['If-Modified-Since'] = ifModifiedSince;

    const res = await fetch(backendUrl, {
      headers,
      cache: 'no-store',
    });

    if (res.status === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: res.headers.get('etag') || '',
          'Last-Modified': res.headers.get('last-modified') || '',
        },
      });
    }

    const xmlText = await res.text();
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
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
