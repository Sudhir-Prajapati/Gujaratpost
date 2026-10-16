import { XMLParser } from 'fast-xml-parser';
import { prisma } from '../config/prisma.js';
import { safeFetchFeed, SafeFetchResult } from '../utils/ssrf.js';
import { stripHtmlTags, sanitizeHtmlContent, normalizeSourceUrl } from '../utils/xmlSanitizer.js';

export interface ParsedRssItem {
  guid: string;
  sourceUrl: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  imageUrl: string;
  categoryName: string;
  pubDate: Date | null;
}

export interface ParsedRssFeed {
  title: string;
  description: string;
  link: string;
  items: ParsedRssItem[];
}

// Active synchronizations lock map to prevent overlapping imports of the same source
const activeSyncs = new Set<string>();

/**
 * Extracts first image URL from HTML string.
 */
function extractImageFromHtml(html?: string | null): string {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Extracts text content from XML element that might be a string, number, or object with #text.
 */
function extractXmlText(node: any): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node.trim();
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (typeof node === 'object') {
    if (node['#text']) return String(node['#text']).trim();
    if (node['__cdata']) return String(node['__cdata']).trim();
  }
  return '';
}

/**
 * Parses raw XML string into a normalized ParsedRssFeed structure.
 */
export function parseRawXmlFeed(xmlText: string): ParsedRssFeed {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    cdataPropName: '__cdata',
    trimValues: true,
    parseTagValue: false, // Don't convert numbers/dates to avoid Gujarati unicode mangling
  });

  const parsed = parser.parse(xmlText);

  let channelTitle = 'External Feed';
  let channelDescription = '';
  let channelLink = '';
  const rawItems: any[] = [];

  // Check RSS 2.0 / 0.9x structure (<rss><channel>...)
  if (parsed.rss?.channel) {
    const channel = parsed.rss.channel;
    channelTitle = extractXmlText(channel.title) || 'External RSS Feed';
    channelDescription = extractXmlText(channel.description);
    channelLink = extractXmlText(channel.link);

    if (channel.item) {
      if (Array.isArray(channel.item)) {
        rawItems.push(...channel.item);
      } else {
        rawItems.push(channel.item);
      }
    }
  }
  // Check Atom 1.0 structure (<feed><entry>...)
  else if (parsed.feed) {
    const feed = parsed.feed;
    channelTitle = extractXmlText(feed.title) || 'External Atom Feed';
    channelDescription = extractXmlText(feed.subtitle);

    const linkNode = feed.link;
    if (Array.isArray(linkNode)) {
      const alt = linkNode.find((l: any) => l['@_rel'] === 'alternate') || linkNode[0];
      channelLink = alt?.['@_href'] || '';
    } else if (linkNode) {
      channelLink = linkNode['@_href'] || extractXmlText(linkNode);
    }

    if (feed.entry) {
      if (Array.isArray(feed.entry)) {
        rawItems.push(...feed.entry);
      } else {
        rawItems.push(feed.entry);
      }
    }
  }
  // RDF structure (<rdf:RDF>...)
  else if (parsed['rdf:RDF']) {
    const rdf = parsed['rdf:RDF'];
    const channel = rdf.channel;
    if (channel) {
      channelTitle = extractXmlText(channel.title) || 'External RDF Feed';
      channelDescription = extractXmlText(channel.description);
      channelLink = extractXmlText(channel.link);
    }
    if (rdf.item) {
      if (Array.isArray(rdf.item)) rawItems.push(...rdf.item);
      else rawItems.push(rdf.item);
    }
  } else {
    throw new Error('Unsupported XML format: Not a recognized RSS 2.0, Atom 1.0, or RDF feed.');
  }

  const items: ParsedRssItem[] = [];

  for (const raw of rawItems) {
    const rawTitle = extractXmlText(raw.title);
    if (!rawTitle) continue;

    // Link extraction
    let link = '';
    if (raw.link) {
      if (typeof raw.link === 'string') {
        link = raw.link;
      } else if (raw.link['@_href']) {
        link = raw.link['@_href'];
      } else if (Array.isArray(raw.link)) {
        const alt = raw.link.find((l: any) => l['@_rel'] === 'alternate') || raw.link[0];
        link = alt?.['@_href'] || extractXmlText(alt);
      } else {
        link = extractXmlText(raw.link);
      }
    }

    const normalizedUrl = normalizeSourceUrl(link);

    // GUID / ID
    let guid = '';
    if (raw.guid) {
      guid = extractXmlText(raw.guid);
    } else if (raw.id) {
      guid = extractXmlText(raw.id);
    }
    if (!guid) {
      guid = normalizedUrl || rawTitle;
    }

    // Excerpt / Description
    const rawDesc = extractXmlText(raw.description || raw.summary || '');
    const cleanExcerpt = stripHtmlTags(rawDesc).slice(0, 1000);

    // Full Content
    const rawContent = extractXmlText(raw['content:encoded'] || raw.content || raw.description || '');
    const cleanContent = sanitizeHtmlContent(rawContent);

    // Publication Date
    let pubDate: Date | null = null;
    const rawDateStr = extractXmlText(raw.pubDate || raw.published || raw.updated || raw['dc:date']);
    if (rawDateStr) {
      const parsedDate = new Date(rawDateStr);
      if (!isNaN(parsedDate.getTime())) {
        pubDate = parsedDate;
      }
    }

    // Author
    let author = extractXmlText(raw['dc:creator'] || raw.author);
    if (!author && raw.author && typeof raw.author === 'object') {
      author = extractXmlText(raw.author.name);
    }

    // Category
    let categoryName = '';
    if (raw.category) {
      if (Array.isArray(raw.category)) {
        categoryName = extractXmlText(raw.category[0]);
      } else if (raw.category['@_term']) {
        categoryName = raw.category['@_term'];
      } else {
        categoryName = extractXmlText(raw.category);
      }
    }

    // Media / Image
    let imageUrl = '';
    if (raw.enclosure && raw.enclosure['@_url']) {
      imageUrl = raw.enclosure['@_url'];
    } else if (raw['media:content'] && raw['media:content']['@_url']) {
      imageUrl = raw['media:content']['@_url'];
    } else if (raw['media:thumbnail'] && raw['media:thumbnail']['@_url']) {
      imageUrl = raw['media:thumbnail']['@_url'];
    } else {
      imageUrl = extractImageFromHtml(rawContent) || extractImageFromHtml(rawDesc);
    }

    items.push({
      guid: String(guid).slice(0, 490),
      sourceUrl: normalizedUrl,
      title: rawTitle,
      excerpt: cleanExcerpt,
      content: cleanContent,
      author: author.slice(0, 100),
      imageUrl: imageUrl.trim(),
      categoryName: categoryName.slice(0, 100),
      pubDate,
    });
  }

  return {
    title: channelTitle,
    description: channelDescription,
    link: channelLink,
    items,
  };
}

/**
 * Tests an external feed URL safely without database persistence.
 */
export async function testExternalFeed(targetUrl: string): Promise<{
  success: boolean;
  title: string;
  description: string;
  link: string;
  itemCount: number;
  previewItems: Array<{
    title: string;
    link: string;
    pubDate: string | null;
    excerpt: string;
    imageUrl: string;
  }>;
}> {
  const fetchResult = await safeFetchFeed(targetUrl, { timeoutMs: 10000 });
  if (!fetchResult.data) {
    throw new Error('Feed returned an empty response body.');
  }

  const parsed = parseRawXmlFeed(fetchResult.data);

  return {
    success: true,
    title: parsed.title,
    description: parsed.description,
    link: parsed.link,
    itemCount: parsed.items.length,
    previewItems: parsed.items.slice(0, 10).map((it) => ({
      title: it.title,
      link: it.sourceUrl,
      pubDate: it.pubDate ? it.pubDate.toISOString() : null,
      excerpt: it.excerpt.slice(0, 200),
      imageUrl: it.imageUrl,
    })),
  };
}

/**
 * Synchronizes an existing RssSource: retrieves feed, deduplicates, and creates pending RssItem records.
 */
export async function syncRssSource(sourceId: string): Promise<{
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED_NOT_MODIFIED';
  itemsFound: number;
  itemsImported: number;
  errorMessage?: string;
}> {
  if (activeSyncs.has(sourceId)) {
    return {
      status: 'SKIPPED_NOT_MODIFIED',
      itemsFound: 0,
      itemsImported: 0,
      errorMessage: 'Sync already in progress for this source.',
    };
  }

  activeSyncs.add(sourceId);
  const startTime = Date.now();

  try {
    const source = await prisma.rssSource.findUnique({
      where: { id: sourceId },
      include: { category: true },
    });

    if (!source) {
      throw new Error(`RSS Source with ID "${sourceId}" not found.`);
    }

    if (!source.isActive) {
      return {
        status: 'SKIPPED_NOT_MODIFIED',
        itemsFound: 0,
        itemsImported: 0,
        errorMessage: 'Source is currently inactive.',
      };
    }

    let fetchResult: SafeFetchResult;
    try {
      fetchResult = await safeFetchFeed(source.url, {
        timeoutMs: 12000,
        etag: source.etag,
        lastModified: source.lastModified,
      });
    } catch (fetchErr: any) {
      const durationMs = Date.now() - startTime;
      const errMsg = fetchErr.message || String(fetchErr);

      await prisma.rssSource.update({
        where: { id: sourceId },
        data: {
          lastFetchedAt: new Date(),
          lastError: errMsg,
        },
      });

      await prisma.rssFetchLog.create({
        data: {
          sourceId,
          status: 'ERROR',
          errorMessage: errMsg,
          durationMs,
        },
      });

      return {
        status: 'ERROR',
        itemsFound: 0,
        itemsImported: 0,
        errorMessage: errMsg,
      };
    }

    const durationMs = Date.now() - startTime;

    // Handle 304 Not Modified
    if (fetchResult.notModified) {
      await prisma.rssSource.update({
        where: { id: sourceId },
        data: {
          lastFetchedAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
        },
      });

      await prisma.rssFetchLog.create({
        data: {
          sourceId,
          status: 'SKIPPED_NOT_MODIFIED',
          durationMs,
        },
      });

      return {
        status: 'SKIPPED_NOT_MODIFIED',
        itemsFound: 0,
        itemsImported: 0,
      };
    }

    const parsedFeed = parseRawXmlFeed(fetchResult.data);
    const items = parsedFeed.items.slice(0, 100); // Process max 100 entries per batch

    let newItemsCount = 0;

    for (const item of items) {
      // 1. Check if item already exists by sourceId + guid
      const existingItem = await prisma.rssItem.findUnique({
        where: {
          sourceId_guid: {
            sourceId,
            guid: item.guid,
          },
        },
      });

      if (existingItem) {
        continue; // Do not overwrite existing entries
      }

      // 2. Also check if article was already created on the main Post table with matching source link
      if (item.sourceUrl) {
        const existingPost = await prisma.post.findFirst({
          where: {
            OR: [
              { canonicalUrl: item.sourceUrl },
              { excerpt: { contains: item.sourceUrl } },
            ],
          },
          select: { id: true },
        });

        if (existingPost) {
          continue;
        }
      }

      // 3. Create new RssItem with PENDING status for editor review
      await prisma.rssItem.create({
        data: {
          sourceId,
          guid: item.guid,
          sourceUrl: item.sourceUrl,
          title: item.title,
          titleGu: item.title,
          excerpt: item.excerpt,
          content: item.content,
          author: item.author,
          imageUrl: item.imageUrl,
          categoryName: item.categoryName || source.category?.name || 'General',
          targetCategoryId: source.categoryId,
          pubDate: item.pubDate,
          status: 'PENDING',
        },
      });

      newItemsCount++;
    }

    // Update source status
    await prisma.rssSource.update({
      where: { id: sourceId },
      data: {
        lastFetchedAt: new Date(),
        lastSuccessAt: new Date(),
        lastError: null,
        etag: fetchResult.etag,
        lastModified: fetchResult.lastModified,
        itemCount: { increment: newItemsCount },
      },
    });

    // Record success log
    await prisma.rssFetchLog.create({
      data: {
        sourceId,
        status: 'SUCCESS',
        itemsFound: items.length,
        itemsImported: newItemsCount,
        durationMs,
      },
    });

    return {
      status: 'SUCCESS',
      itemsFound: items.length,
      itemsImported: newItemsCount,
    };
  } finally {
    activeSyncs.delete(sourceId);
  }
}

/**
 * Background worker task to poll active RSS sources that have reached their polling interval.
 */
export async function pollDueRssFeeds(): Promise<void> {
  try {
    const sources = await prisma.rssSource.findMany({
      where: { isActive: true },
    });

    const now = Date.now();
    for (const source of sources) {
      const intervalMs = Math.max(source.pollingInterval, 15) * 60 * 1000;
      const lastFetchedMs = source.lastFetchedAt ? new Date(source.lastFetchedAt).getTime() : 0;

      if (now - lastFetchedMs >= intervalMs) {
        syncRssSource(source.id).catch((err) => {
          console.warn(`[RSS Background Sync] Non-fatal error syncing source ${source.name}:`, err?.message || err);
        });
      }
    }
  } catch (err: any) {
    console.warn('[RSS Background Sync] Error checking due feeds:', err?.message || err);
  }
}
