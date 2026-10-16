import { NextRequest } from 'next/server';
import { GET as getCategoryRss } from '@/app/rss/[slug]/route';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return getCategoryRss(request, context);
}
