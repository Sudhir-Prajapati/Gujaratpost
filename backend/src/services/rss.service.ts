import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { wrapCdata, stripHtmlTags, escapeXml, sanitizeHtmlContent } from '../utils/xmlSanitizer.js';

interface RssFeedOptions {
  categorySlug?: string;
  limit?: number;
  lang?: string;
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
 * Strips the 'KEY HIGHLIGHTS' (એક નજરમાં) markdown/HTML block from article excerpts and content.
 */
export function stripKeyHighlights(text?: string | null): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Markdown block:
  // ## 📌 એક નજરમાં (KEY HIGHLIGHTS)
  // --------------------------------------------------
  // ... bullets ...
  // --------------------------------------------------
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:##\s*)?📌?\s*(?:એક નજરમાં|એક નજર મેં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^\n]*\n+[-—_=]{3,}[\s\S]*?[-—_=]{3,}\n*/gi,
    '\n'
  );

  // 2. HTML container block if wrapped in tags
  cleaned = cleaned.replace(
    /<(h[1-6]|p|div|section)[^>]*>[\s\S]*?📌?\s*(?:એક નજરમાં|એક નજર મેં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[\s\S]*?<\/\1>\s*(?:<hr\s*\/?>)?/gi,
    ''
  );

  // 3. Fallback: single header line
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:##\s*)?📌?\s*(?:એક નજરમાં|એક નજર મેં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^\n-]*(?:[-—_=]{3,})?/gi,
    ''
  );

  // 4. Remove leftover dashes or bullets at start
  cleaned = cleaned.replace(/^\s*[-—_=]{3,}\s*\n*/, '');

  return cleaned.trim();
}

/**
 * Cleans excerpts for RSS descriptions by stripping markdown highlights, divider lines, and bullets.
 */
function cleanRssExcerpt(text?: string | null): string {
  if (!text) return '';
  const withoutHighlights = stripKeyHighlights(text);
  return stripHtmlTags(withoutHighlights)
    .replace(/[-—_=]{3,}/g, ' ')
    .replace(/^[#\s*•\-–—]+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  'other-cities': ['other-cities', 'others'],
  'others': ['others', 'other-cities'],
  'world': ['world', 'international'],
  'international': ['international', 'world'],
  'trending': ['trending', 'popular-stories'],
  'popular-stories': ['popular-stories', 'trending'],
  'entertainment-life-style': ['entertainment-life-style', 'entertainment', 'lifestyle', 'entertainmentlifestyle'],
  'entertainmentlifestyle': ['entertainment', 'entertainment-life-style', 'lifestyle'],
  'entertainment-lifestyle': ['entertainment', 'entertainment-life-style', 'lifestyle'],
  'entertainment': ['entertainment', 'entertainment-life-style', 'lifestyle', 'entertainmentlifestyle', 'entertainment-lifestyle'],
  'lifestyle': ['lifestyle', 'entertainment-life-style', 'entertainment'],
  'national': ['national', 'india'],
  'india': ['india', 'national'],
  'politics': ['politics'],
  'gujarat': ['gujarat'],
  'gandhinagar': ['gandhinagar'],
  'ahmedabad': ['ahmedabad'],
  'surat': ['surat'],
  'vadodara': ['vadodara'],
  'rajkot': ['rajkot'],
  'fact-check': ['fact-check', 'factcheck'],
  'factcheck': ['fact-check', 'factcheck'],
  'crime': ['crime'],
  'health': ['health'],
  'technology': ['technology', 'tech'],
  'tech': ['technology', 'tech'],
  'videos': ['videos', 'video'],
  'video': ['videos', 'video'],
  'photos': ['photos', 'gallery'],
  'gallery': ['photos', 'gallery'],
  'instagram': ['instagram', 'reels'],
  'reels': ['instagram', 'reels'],
};

/**
 * Generates dynamic RSS 2.0 XML for public news articles, photo gallery, videos, and reels.
 */
export async function generatePublicRssFeed(options: RssFeedOptions = {}): Promise<GeneratedFeedResult> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 100);
  const rawCategorySlug = (options.categorySlug || '').trim().toLowerCase().replace(/\.xml$/, '');
  let cleanTopic = rawCategorySlug;
  if (cleanTopic.includes('-updates-')) {
    cleanTopic = cleanTopic.split('-updates-')[0].trim();
  } else if (cleanTopic.includes('_updates_')) {
    cleanTopic = cleanTopic.split('_updates_')[0].trim();
  } else if (cleanTopic.startsWith('updates-')) {
    cleanTopic = cleanTopic.replace(/^updates-/, '').trim();
  } else if (cleanTopic.endsWith('-updates')) {
    cleanTopic = cleanTopic.replace(/-updates$/, '').trim();
  }

  const isHomeSlug = !cleanTopic || ['all', 'home', 'homepage', 'news', 'main', 'top', 'gujpost'].includes(cleanTopic);
  const categorySlug = isHomeSlug ? '' : cleanTopic;
  const lang = (options.lang || 'gu').toLowerCase().trim();
  const cacheKey = `rss:${categorySlug || 'home'}:${limit}:${lang}`;

  const cached = feedCache.get(cacheKey);
  const nowMs = Date.now();
  if (cached && nowMs - cached.cachedAt < FEED_CACHE_TTL_MS) {
    return cached.result;
  }

  const baseUrl = getSiteBaseUrl();

  // ==========================================
  // Special Feed Type 1: Photo Gallery Feed
  // ==========================================
  if (categorySlug === 'photos' || categorySlug === 'gallery') {
    const photos = await prisma.galleryPhoto.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        src: true,
        alt: true,
        caption: true,
        captionGu: true,
        category: true,
        photographer: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const newestPhoto = photos[0];
    const lastModified = newestPhoto?.updatedAt || newestPhoto?.createdAt || new Date();
    const lastBuildDate = lastModified.toUTCString();
    const etagSource = `photos:${photos.length}:${lastModified.getTime()}`;
    const etag = `"${crypto.createHash('md5').update(etagSource).digest('hex')}"`;

    let itemsXml = '';
    for (const photo of photos) {
      const photoUrl = `${baseUrl}/photos/${photo.id}`;
      const pubDate = new Date(photo.createdAt).toUTCString();
      const rawTitle = lang === 'en' ? (photo.caption || photo.captionGu || photo.alt || 'Gujarat Post Photo Gallery') : lang === 'hi' ? (photo.caption || photo.captionGu || photo.alt || 'गुजरात पोस्ट फोटो गैलरी') : (photo.captionGu || photo.caption || photo.alt || 'Gujarat Post Photo Gallery');
      const rawDesc = stripHtmlTags(rawTitle);
      const catName = lang === 'en' ? 'Photo Gallery' : lang === 'hi' ? 'फोटो गैलरी' : (photo.category || 'ફોટો ગેલેરી');
      const authorName = photo.photographer || 'Gujarat Post Team';
      let imageUrl = (photo.src || '').trim();
      if (imageUrl.startsWith('[')) {
        try {
          const parsed = JSON.parse(imageUrl);
          if (Array.isArray(parsed) && parsed.length > 0) {
            imageUrl = parsed[0]?.src || parsed[0]?.url || (typeof parsed[0] === 'string' ? parsed[0] : '');
          }
        } catch {}
      }

      itemsXml += `    <item>
      <title>${wrapCdata(rawTitle)}</title>
      <link>${photoUrl}</link>
      <guid isPermaLink="true">${photoUrl}</guid>
      <description>${wrapCdata(rawDesc)}</description>
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
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${lang === 'en' ? 'Photo Gallery - Gujarat Post' : lang === 'hi' ? 'फोटो गैलरी - गुजरात पोस्ट' : 'ફોટો ગેલેરી - Gujarat Post'}</title>
    <link>${baseUrl}</link>
    <description>${lang === 'en' ? 'Latest Gujarat and National News Photo Gallery from Gujarat Post' : lang === 'hi' ? 'गुजरात पोस्ट से नवीनतम फोटो गैलरी और दृश्य समाचार' : 'Latest Gujarat and National News Photo Gallery from Gujarat Post'}</description>
    <language>${lang === 'en' ? 'en-US' : lang === 'hi' ? 'hi-IN' : 'gu-IN'}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss/photos.xml" rel="self" type="application/rss+xml" />
${itemsXml}  </channel>
</rss>`;

    const result: GeneratedFeedResult = { xml, etag, lastModified, itemCount: photos.length };
    feedCache.set(cacheKey, { result, cachedAt: nowMs });
    return result;
  }

  // ==========================================
  // Special Feed Type 2: Videos Feed
  // ==========================================
  if (categorySlug === 'videos' || categorySlug === 'video') {
    const videos = await prisma.video.findMany({
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        titleGu: true,
        description: true,
        thumbnail: true,
        youtubeId: true,
        embedUrl: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const newestVideo = videos[0];
    const lastModified = newestVideo?.updatedAt || newestVideo?.publishedAt || newestVideo?.createdAt || new Date();
    const lastBuildDate = lastModified.toUTCString();
    const etagSource = `videos:${videos.length}:${lastModified.getTime()}`;
    const etag = `"${crypto.createHash('md5').update(etagSource).digest('hex')}"`;

    let itemsXml = '';
    for (const vid of videos) {
      const vidUrl = `${baseUrl}/videos?v=${vid.youtubeId}`;
      const pubDate = new Date(vid.publishedAt || vid.createdAt).toUTCString();
      const rawTitle = vid.titleGu || vid.title || 'Gujarat Post Video News';
      const rawDesc = stripHtmlTags(vid.description || rawTitle);
      const imageUrl = (vid.thumbnail || '').trim();
      const mediaVideoUrl = vid.embedUrl || `https://www.youtube.com/watch?v=${vid.youtubeId}`;

      itemsXml += `    <item>
      <title>${wrapCdata(rawTitle)}</title>
      <link>${vidUrl}</link>
      <guid isPermaLink="true">${vidUrl}</guid>
      <description>${wrapCdata(rawDesc)}</description>
      <category><![CDATA[વીડિયો]]></category>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[Gujarat Post Video Team]]></dc:creator>
      <author>editorial@gujaratpost.in (Gujarat Post Video Team)</author>`;

      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        const escapedImg = escapeXml(imageUrl);
        itemsXml += `
      <enclosure url="${escapedImg}" type="image/jpeg" length="0" />
      <media:content url="${escapeXml(mediaVideoUrl)}" medium="video">
        <media:title>${wrapCdata(rawTitle)}</media:title>
        <media:thumbnail url="${escapedImg}" />
      </media:content>`;
      }

      itemsXml += `
    </item>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:media="http://search.yahoo.com/mrss/" 
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${lang === 'en' ? 'Video News - Gujarat Post' : lang === 'hi' ? 'वीडियो समाचार - गुजरात पोस्ट' : 'વીડિયો સમાચાર - Gujarat Post'}</title>
    <link>${baseUrl}</link>
    <description>${lang === 'en' ? 'Latest Gujarat News Videos, Interviews, and Ground Reports from Gujarat Post' : lang === 'hi' ? 'गुजरात पोस्ट से नवीनतम वीडियो रिपोर्ट और ग्राउंड रिपोर्ट' : 'Latest Gujarat News Videos, Interviews, and Ground Reports from Gujarat Post'}</description>
    <language>${lang === 'en' ? 'en-US' : lang === 'hi' ? 'hi-IN' : 'gu-IN'}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss/videos.xml" rel="self" type="application/rss+xml" />
${itemsXml}  </channel>
</rss>`;

    const result: GeneratedFeedResult = { xml, etag, lastModified, itemCount: videos.length };
    feedCache.set(cacheKey, { result, cachedAt: nowMs });
    return result;
  }

  // ==========================================
  // Special Feed Type 3: Instagram Reels Feed
  // ==========================================
  if (categorySlug === 'instagram' || categorySlug === 'reels') {
    const reels = await prisma.reel.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        heading: true,
        headingGu: true,
        instaUrl: true,
        thumbnail: true,
        videoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const newestReel = reels[0];
    const lastModified = newestReel?.updatedAt || newestReel?.createdAt || new Date();
    const lastBuildDate = lastModified.toUTCString();
    const etagSource = `reels:${reels.length}:${lastModified.getTime()}`;
    const etag = `"${crypto.createHash('md5').update(etagSource).digest('hex')}"`;

    let itemsXml = '';
    for (const reel of reels) {
      const reelUrl = reel.instaUrl || `${baseUrl}/instagram?r=${reel.id}`;
      const pubDate = new Date(reel.createdAt).toUTCString();
      const rawTitle = reel.headingGu || reel.heading || 'Gujarat Post Instagram Reel';
      const rawDesc = stripHtmlTags(rawTitle);
      const imageUrl = (reel.thumbnail || '').trim();

      itemsXml += `    <item>
      <title>${wrapCdata(rawTitle)}</title>
      <link>${reelUrl}</link>
      <guid isPermaLink="false">${reelUrl}</guid>
      <description>${wrapCdata(rawDesc)}</description>
      <category><![CDATA[ઇન્સ્ટાગ્રામ]]></category>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[Gujarat Post Social Team]]></dc:creator>
      <author>editorial@gujaratpost.in (Gujarat Post Social Team)</author>`;

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
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${lang === 'en' ? 'Instagram Reels - Gujarat Post' : lang === 'hi' ? 'इंस्टाग्राम रील्स - गुजरात पोस्ट' : 'ઇન્સ્ટાગ્રામ રીલ્સ - Gujarat Post'}</title>
    <link>${baseUrl}</link>
    <description>${lang === 'en' ? 'Latest Instagram Reels and Visual Stories from Gujarat Post' : lang === 'hi' ? 'गुजरात पोस्ट से नवीनतम इंस्टाग्राम रील्स और विजुअल स्टोरीज' : 'Latest Instagram Reels and Visual Stories from Gujarat Post'}</description>
    <language>${lang === 'en' ? 'en-US' : lang === 'hi' ? 'hi-IN' : 'gu-IN'}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss/instagram.xml" rel="self" type="application/rss+xml" />
${itemsXml}  </channel>
</rss>`;

    const result: GeneratedFeedResult = { xml, etag, lastModified, itemCount: reels.length };
    feedCache.set(cacheKey, { result, cachedAt: nowMs });
    return result;
  }

  // ==========================================
  // Standard News Articles Feed
  // ==========================================
  const now = new Date();
  const where: any = {
    status: 'PUBLISHED',
    AND: [
      {
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
      },
    ],
  };

  let channelTitle = lang === 'en'
    ? 'Gujarat Post - Top News & Breaking Headlines'
    : lang === 'hi'
    ? 'गुजरात पोस्ट - ताजा और मुख्य समाचार'
    : 'Gujarat Post - ગુજરાત સમાચાર';
  let channelDescription = lang === 'en'
    ? 'Latest Breaking News, State, Politics, Crime, Business, Sports, and Entertainment from Gujarat Post'
    : lang === 'hi'
    ? 'गुजरात पोस्ट से राजनीति, अपराध, व्यापार, खेल और मनोरंजन के ताजा समाचार'
    : 'Latest Gujarati Breaking News, Politics, Crime, Business, Sports, and Entertainment';
  let selfRoute = '/api/public/rss';

  if (categorySlug) {
    selfRoute = `/api/public/rss/${encodeURIComponent(categorySlug)}`;
    const searchSlugs = CATEGORY_ALIASES[categorySlug] || [categorySlug];

    const categoryRecords = await prisma.category.findMany({
      where: { slug: { in: searchSlugs } },
      select: { id: true, name: true, nameGu: true, nameHi: true, slug: true, description: true, descriptionGu: true, descriptionHi: true },
    });
    const catIds = categoryRecords.map((c) => c.id);

    // Strict Category Filtering: An article ONLY belongs to this category feed if
    // this category was explicitly chosen as Primary category OR Multi-category.
    const orConditions: any[] = [];
    if (catIds.length > 0) {
      orConditions.push({ categoryId: { in: catIds } });
      orConditions.push({ categories: { some: { categoryId: { in: catIds } } } });
    }
    orConditions.push({ category: { slug: { in: searchSlugs } } });
    orConditions.push({ categories: { some: { category: { slug: { in: searchSlugs } } } } });

    // Category names in case slug differs slightly
    for (const c of categoryRecords) {
      if (c.name) {
        orConditions.push({ category: { name: c.name } });
        orConditions.push({ categories: { some: { category: { name: c.name } } } });
      }
      if (c.nameGu) {
        orConditions.push({ category: { nameGu: c.nameGu } });
        orConditions.push({ categories: { some: { category: { nameGu: c.nameGu } } } });
      }
    }

    if (categorySlug === 'trending' || categorySlug === 'popular-stories') {
      orConditions.push({ isTrending: true });
    }

    where.AND.push({ OR: orConditions });

    const primaryCat = categoryRecords[0];
    if (primaryCat) {
      const catName = lang === 'en' ? primaryCat.name : lang === 'hi' ? (primaryCat.nameHi || primaryCat.name) : (primaryCat.nameGu || primaryCat.name);
      channelTitle = lang === 'en'
        ? `${primaryCat.name} News - Gujarat Post`
        : lang === 'hi'
        ? `${catName} समाचार - गुजरात पोस्ट`
        : `${catName} સમાચાર - Gujarat Post`;
      channelDescription = lang === 'en'
        ? (primaryCat.description || `Latest ${primaryCat.name} news from Gujarat Post`)
        : lang === 'hi'
        ? (primaryCat.descriptionHi || `गुजरात पोस्ट से ${catName} के ताजा समाचार`)
        : (primaryCat.descriptionGu || `Latest ${primaryCat.name} news from Gujarat Post`);
    } else {
      channelTitle = `${categorySlug.toUpperCase()} News - Gujarat Post`;
    }
  } else if (isHomeSlug) {
    // Strict Home Filtering: An article ONLY appears in Home feed if the editor explicitly selected
    // "Home / News" (isFeatured = true in CMS) OR primary/multi category is Home OR explicitly set in Main Hero Grid.
    let heroGridIds: string[] = [];
    try {
      const heroSetting = await prisma.heroSetting.findFirst();
      if (heroSetting) {
        const parseIds = (raw: any): string[] => {
          if (!raw) return [];
          try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
          } catch {
            return [];
          }
        };
        heroGridIds = parseIds(heroSetting.heroGridIds);
        const slots = [heroSetting.slot1Id, heroSetting.slot2Id, heroSetting.slot3Id].map((s) => (s ? String(s) : '')).filter(Boolean);
        heroGridIds = Array.from(new Set([...heroGridIds, ...slots]));
      }
    } catch {}

    where.AND.push({
      OR: [
        { isFeatured: true }, // Set when editor checks "Home / News (Show in Home / News)" in CMS
        ...(heroGridIds.length > 0 ? [{ id: { in: heroGridIds } }] : []),
        { category: { slug: 'home' } },
        { category: { name: 'Home' } },
        { categories: { some: { category: { slug: 'home' } } } },
        { categories: { some: { category: { name: 'Home' } } } },
      ],
    });
  }

  const articles = await prisma.post.findMany({
    where,
    take: limit,
    orderBy: [{ articleNumber: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      titleGu: true,
      titleHi: true,
      excerpt: true,
      excerptGu: true,
      excerptHi: true,
      content: true,
      contentGu: true,
      contentHi: true,
      featuredImage: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          slug: true,
          name: true,
          nameGu: true,
          nameHi: true,
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

  const newestArticle = articles[0];
  const lastModified = newestArticle?.updatedAt || newestArticle?.createdAt || new Date();
  const lastBuildDate = lastModified.toUTCString();

  // Generate strong ETag from newest timestamp and count
  const etagSource = `${categorySlug || 'home'}:${articles.length}:${lastModified.getTime()}`;
  const etag = `"${crypto.createHash('md5').update(etagSource).digest('hex')}"`;

  let itemsXml = '';

  for (const art of articles) {
    const artUrl = `${baseUrl}/news/${art.slug}`;
    const pubDate = new Date(art.createdAt).toUTCString();

    let rawTitle = art.titleGu || art.title || 'Gujarat Post Samachar';
    let rawExcerpt = cleanRssExcerpt(art.excerptGu || art.excerpt || art.titleGu || art.title || '');
    let catName = art.category?.nameGu || art.category?.name || 'સમાચાર';
    let authorName = art.author?.nameGu || art.author?.name || 'Gujarat Post Team';
    let rawBody = art.contentGu || art.content || '';

    if (lang === 'en') {
      rawTitle = art.title || art.titleGu || 'Gujarat Post News';
      rawExcerpt = cleanRssExcerpt(art.excerpt || art.excerptGu || rawTitle);
      catName = art.category?.name || art.category?.nameGu || 'News';
      authorName = art.author?.name || art.author?.nameGu || 'Gujarat Post Team';
      rawBody = art.content || art.contentGu || '';
    } else if (lang === 'hi') {
      rawTitle = art.titleHi || art.titleGu || art.title || 'गुजरात पोस्ट समाचार';
      rawExcerpt = cleanRssExcerpt(art.excerptHi || art.excerptGu || art.excerpt || rawTitle);
      catName = art.category?.nameHi || art.category?.name || art.category?.nameGu || 'समाचार';
      authorName = art.author?.name || art.author?.nameGu || 'Gujarat Post Team';
      rawBody = art.contentHi || art.contentGu || art.content || '';
    }

    const imageUrl = (art.featuredImage || '').trim();
    const cleanedBody = stripKeyHighlights(rawBody);
    const fullHtml = sanitizeHtmlContent(cleanedBody);

    // If excerpt is empty after stripping highlights, fall back to first 280 characters of cleaned body
    if (!rawExcerpt) {
      rawExcerpt = cleanRssExcerpt(cleanedBody).slice(0, 280);
    }
    if (!rawExcerpt) {
      rawExcerpt = cleanRssExcerpt(rawTitle);
    }

    itemsXml += `    <item>
      <title>${wrapCdata(rawTitle)}</title>
      <link>${artUrl}</link>
      <guid isPermaLink="true">${artUrl}</guid>
      <description>${wrapCdata(rawExcerpt)}</description>
      <content:encoded>${wrapCdata(fullHtml)}</content:encoded>
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
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>${lang === 'en' ? 'en-US' : lang === 'hi' ? 'hi-IN' : 'gu-IN'}</language>
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

