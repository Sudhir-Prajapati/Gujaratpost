import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { wrapCdata, stripHtmlTags, escapeXml } from '../utils/xmlSanitizer.js';

interface RssFeedOptions {
  categorySlug?: string;
  limit?: number;
}

export interface GeneratedFeedResult {
  xml: string;
  etag: string;
  lastModified: Date;
  itemCount: number;
}

// In-memory cache for generated RSS XML feeds
const feedCache = new Map<string, { result: GeneratedFeedResult; cachedAt: number }>();
const FEED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Invalidates the public RSS cache (called whenever articles are published/updated/deleted).
 */
export function invalidatePublicRssCache(): void {
  feedCache.clear();
}

/**
 * Returns canonical site base URL.
 */
export function getSiteBaseUrl(): string {
  const envUrl = process.env.SITE_URL || process.env.CLIENT_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return process.env.NODE_ENV === 'production' ? 'https://gujaratpost.in' : 'http://localhost:3000';
}

/**
 * Generates dynamic RSS 2.0 XML for public news articles.
 */
export async function generatePublicRssFeed(options: RssFeedOptions = {}): Promise<GeneratedFeedResult> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const categorySlug = (options.categorySlug || '').trim().toLowerCase().replace(/\.xml$/, '');
  const cacheKey = `rss:${categorySlug || 'all'}:${limit}`;

  const cached = feedCache.get(cacheKey);
  const nowMs = Date.now();
  if (cached && nowMs - cached.cachedAt < FEED_CACHE_TTL_MS) {
    return cached.result;
  }

  const now = new Date();
  const where: any = {
    status: 'PUBLISHED',
    OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
  };

  let channelTitle = 'Gujarat Post - ગુજરાત સમાચાર';
  let channelDescription = 'Latest Gujarati Breaking News, Politics, Crime, Business, Sports, and Entertainment';
  let selfRoute = '/api/public/rss';

  if (categorySlug) {
    selfRoute = `/api/public/rss/${encodeURIComponent(categorySlug)}`;
    const categoryRecord = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true, nameGu: true, descriptionGu: true },
    });

    if (categoryRecord) {
      where.categoryId = categoryRecord.id;
      const catName = categoryRecord.nameGu || categoryRecord.name;
      channelTitle = `${catName} સમાચાર - Gujarat Post`;
      channelDescription = categoryRecord.descriptionGu || `Latest ${categoryRecord.name} news from Gujarat Post`;
    } else {
      // Also match by category slug filter on relation if not found directly
      where.category = { slug: categorySlug };
      channelTitle = `${categorySlug.toUpperCase()} News - Gujarat Post`;
    }
  }

  const articles = await prisma.post.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      titleGu: true,
      excerpt: true,
      excerptGu: true,
      featuredImage: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          slug: true,
          name: true,
          nameGu: true,
        },
      },
      author: {
        select: {
          name: true,
          nameGu: true,
        },
      },
    },
  });

  const baseUrl = getSiteBaseUrl();
  const newestArticle = articles[0];
  const lastModified = newestArticle?.updatedAt || newestArticle?.createdAt || new Date();
  const lastBuildDate = lastModified.toUTCString();

  // Generate strong ETag from newest timestamp and count
  const etagSource = `${categorySlug || 'all'}:${articles.length}:${lastModified.getTime()}`;
  const etag = `"${crypto.createHash('md5').update(etagSource).digest('hex')}"`;

  let itemsXml = '';

  for (const art of articles) {
    const artUrl = `${baseUrl}/news/${art.slug}`;
    const pubDate = new Date(art.createdAt).toUTCString();
    const rawTitle = art.titleGu || art.title || 'Gujarat Post Samachar';
    const rawExcerpt = stripHtmlTags(art.excerptGu || art.excerpt || art.titleGu || art.title || '');
    const catName = art.category?.nameGu || art.category?.name || 'સમાચાર';
    const authorName = art.author?.nameGu || art.author?.name || 'Gujarat Post Team';
    const imageUrl = (art.featuredImage || '').trim();

    itemsXml += `    <item>
      <title>${wrapCdata(rawTitle)}</title>
      <link>${artUrl}</link>
      <guid isPermaLink="true">${artUrl}</guid>
      <description>${wrapCdata(rawExcerpt)}</description>
      <category>${wrapCdata(catName)}</category>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${wrapCdata(authorName)}</dc:creator>
      <author>editorial@gujaratpost.in (${escapeXml(authorName)})</author>`;

    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      const escapedImg = escapeXml(imageUrl);
      itemsXml += `
      <enclosure url="${escapedImg}" type="image/jpeg" length="0" />
      <media:content url="${escapedImg}" medium="image">
        <media:title>${wrapCdata(rawTitle)}</media:title>
      </media:content>`;
    }

    itemsXml += `
    </item>\n`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:media="http://search.yahoo.com/mrss/" 
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>gu-IN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}${selfRoute}" rel="self" type="application/rss+xml" />
${itemsXml}  </channel>
</rss>`;

  const result: GeneratedFeedResult = {
    xml,
    etag,
    lastModified,
    itemCount: articles.length,
  };

  feedCache.set(cacheKey, { result, cachedAt: nowMs });
  return result;
}
