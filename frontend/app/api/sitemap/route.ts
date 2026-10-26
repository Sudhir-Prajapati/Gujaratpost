import { getSitemapData } from '@/lib/sitemap-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getSitemapData();
  return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
