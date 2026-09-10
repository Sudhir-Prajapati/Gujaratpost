import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
const CHANNEL_HANDLE = '@Gujaratpostnews';

export const revalidate = 300; // Cache for 5 minutes

function cleanTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/,\s*[\d.,]+\s*[KMkm]?\s*views.*$/i, '')
    .replace(/-\s*play\s*Short.*$/i, '')
    .replace(/\\u0026/g, '&')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\\n/g, ' ')
    .trim();
}

function parseNumericViews(viewsText: string, fallbackId = ''): number {
  if (viewsText) {
    const clean = viewsText.replace(/,/g, '').toLowerCase();
    if (clean.includes('k')) {
      return Math.round(parseFloat(clean) * 1000);
    }
    if (clean.includes('m')) {
      return Math.round(parseFloat(clean) * 1000000);
    }
    const match = clean.match(/(\d+)/);
    if (match) return parseInt(match[1]);
  }
  
  if (fallbackId) {
    let hash = 0;
    for (let i = 0; i < fallbackId.length; i++) {
      hash = (hash << 5) - hash + fallbackId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 450) + 35;
  }
  return 75;
}

/**
 * Convert YouTube relative time strings like "8 days ago", "2 months ago",
 * "1 year ago", "3 hours ago" etc. into proper ISO date strings.
 * Returns the input unchanged if it already looks like an ISO date.
 */
function parseRelativeTime(text: string): string {
  if (!text) return new Date().toISOString();
  // Already an ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text;

  const now = new Date();
  const lower = text.toLowerCase().trim();

  const num = parseInt(lower.match(/\d+/)?.[0] || '1');

  if (lower.includes('second') || lower.includes('just now')) {
    return new Date(now.getTime() - num * 1000).toISOString();
  }
  if (lower.includes('minute') || lower.includes('min')) {
    return new Date(now.getTime() - num * 60 * 1000).toISOString();
  }
  if (lower.includes('hour')) {
    return new Date(now.getTime() - num * 3600 * 1000).toISOString();
  }
  if (lower.includes('day')) {
    return new Date(now.getTime() - num * 86400 * 1000).toISOString();
  }
  if (lower.includes('week')) {
    return new Date(now.getTime() - num * 7 * 86400 * 1000).toISOString();
  }
  if (lower.includes('month')) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - num);
    return d.toISOString();
  }
  if (lower.includes('year')) {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - num);
    return d.toISOString();
  }

  return new Date().toISOString();
}

// Extract full high quality thumbnail for YouTube Shorts / Videos
function extractThumbnail(node: any, videoId: string, isShort: boolean): string {
  if (isShort) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  if (node?.thumbnailViewModel?.image?.sources?.length) {
    const srcs = node.thumbnailViewModel.image.sources;
    return srcs[srcs.length - 1]?.url || srcs[0]?.url;
  }
  if (node?.thumbnail?.sources?.length) {
    const srcs = node.thumbnail.sources;
    return srcs[srcs.length - 1]?.url || srcs[0]?.url;
  }
  if (node?.thumbnail?.thumbnails?.length) {
    const thumbs = node.thumbnail.thumbnails;
    return thumbs[thumbs.length - 1]?.url || thumbs[0]?.url;
  }

  const jsonStr = typeof node === 'string' ? node : JSON.stringify(node);
  const matches = jsonStr.match(/https:\/\/i\.ytimg\.com\/[^\s"'\\]+/gi);
  if (matches && matches.length > 0) {
    const best = matches.find((m) => m.includes('hq720') || m.includes('maxresdefault') || m.includes('hqdefault_custom'));
    if (best) return best;
    return matches[0];
  }

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

// Fetch with AbortController timeout
async function fetchWithTimeout(url: string, options: RequestInit & { next?: any } = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Scrape YouTube channel page tab directly with multi-batch continuation for ALL channel Shorts/Videos
async function fetchChannelTab(tab: 'videos' | 'shorts'): Promise<any[]> {
  try {
    const url = `https://www.youtube.com/${CHANNEL_HANDLE}/${tab}`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 300 },
    }, 8000);

    if (!res.ok) return [];

    const html = await res.text();
    const items: any[] = [];
    const seen = new Set<string>();

    const match = html.match(/ytInitialData\s*=\s*({[\s\S]*?});/);
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);

    if (match) {
      try {
        const data = JSON.parse(match[1]);

        function parseNode(node: any) {
          if (!node || typeof node !== 'object') return;

          // 1. YouTube Shorts lockupViewModel / shortsLockupViewModel structure
          if (node.shortsLockupViewModel) {
            const svm = node.shortsLockupViewModel;
            const videoId =
              svm.entityId?.replace(/^shorts-shelf-item-/, '')?.replace(/^shorts-lockup-viewModel-/, '') ||
              svm.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ||
              svm.videoId;

            if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seen.has(videoId)) {
              seen.add(videoId);

              const rawAccText = svm.accessibilityText || '';
              let viewsText = '';
              const viewsMatch = rawAccText.match(/,\s*([\d.,]+\s*[KM]?\s*views)/i) || JSON.stringify(svm).match(/(\d+(?:\.\d+)?\s*[KM]?\s*views?)/i);
              if (viewsMatch) viewsText = viewsMatch[1];

              const rawTitle =
                cleanTitle(rawAccText) ||
                cleanTitle(svm.headline?.content) ||
                cleanTitle(svm.title?.content) ||
                '';

              const thumb = extractThumbnail(svm, videoId, true);

              items.push({
                id: `yt-live-${videoId}`,
                youtubeId: videoId,
                title: rawTitle || 'Gujarat Post News',
                titleGu: rawTitle || 'Gujarat Post News',
                titleHi: rawTitle || 'Gujarat Post News',
                description: rawTitle,
                thumbnail: thumb,
                publishedAt: new Date().toISOString(),
                type: 'short',
                views: parseNumericViews(viewsText, videoId),
                duration: '0:58',
                category: 'News',
                channelUrl: `https://www.youtube.com/${CHANNEL_HANDLE}`,
                videoUrl: `https://www.youtube.com/shorts/${videoId}`,
              });
              return;
            }
          }

          // 2. Modern YouTube lockupViewModel structure
          if (node.lockupViewModel) {
            const vm = node.lockupViewModel;
            const videoId = vm.contentId;
            if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seen.has(videoId)) {
              seen.add(videoId);
              const title = cleanTitle(vm.metadata?.lockupMetadataViewModel?.title?.content);

              let duration = tab === 'shorts' ? '0:58' : '0:00';
              const jsonStr = JSON.stringify(vm);
              const durationMatch = jsonStr.match(/"text":"(\d{1,2}:\d{2}(?::\d{2})?)"/);
              if (durationMatch) duration = durationMatch[1];

              const metadataRows = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
              let viewsText = '';
              let publishedTime = '';
              for (const row of metadataRows) {
                const parts = row.metadataParts || [];
                for (const p of parts) {
                  const txt = p.text?.content || '';
                  if (txt.includes('view')) viewsText = txt;
                  else if (txt.includes('ago') || txt.includes('day') || txt.includes('hour') || txt.includes('month') || txt.includes('year')) {
                    publishedTime = txt;
                  }
                }
              }

              const thumb = extractThumbnail(vm, videoId, tab === 'shorts');

              items.push({
                id: `yt-live-${videoId}`,
                youtubeId: videoId,
                title: title || 'Gujarat Post News',
                titleGu: title || 'Gujarat Post News',
                titleHi: title || 'Gujarat Post News',
                description: title,
                thumbnail: thumb,
                publishedAt: parseRelativeTime(publishedTime),
                type: tab === 'shorts' ? 'short' : 'video',
                views: parseNumericViews(viewsText, videoId),
                duration,
                category: 'News',
                channelUrl: `https://www.youtube.com/${CHANNEL_HANDLE}`,
                videoUrl: tab === 'shorts' ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`,
              });
              return;
            }
          }

          // 3. Traditional videoRenderer structure (reelItemRenderer, videoRenderer)
          const v = node.videoRenderer || node.gridVideoRenderer || node.reelItemRenderer || node.shortsItemRenderer;
          if (v && (v.videoId || v.reelId)) {
            const videoId = v.videoId || v.reelId;
            if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seen.has(videoId)) {
              seen.add(videoId);

              const rawTitle = v.title?.runs?.[0]?.text || v.title?.simpleText || v.headline?.simpleText || v.accessibility?.accessibilityData?.label || '';
              const title = cleanTitle(rawTitle);
              const duration = v.lengthText?.simpleText || v.lengthText?.runs?.[0]?.text || (tab === 'shorts' ? '0:58' : '10:00');
              const viewsText = v.viewCountText?.simpleText || v.viewCountText?.runs?.[0]?.text || '';
              const publishedTime = v.publishedTimeText?.simpleText || v.publishedTimeText?.runs?.[0]?.text || '';

              const thumb = extractThumbnail(v, videoId, tab === 'shorts');

              items.push({
                id: `yt-live-${videoId}`,
                youtubeId: videoId,
                title: title || 'Gujarat Post News',
                titleGu: title || 'Gujarat Post News',
                titleHi: title || 'Gujarat Post News',
                description: title,
                thumbnail: thumb,
                publishedAt: parseRelativeTime(publishedTime),
                type: tab === 'shorts' ? 'short' : 'video',
                views: parseNumericViews(viewsText, videoId),
                duration,
                category: 'News',
                channelUrl: `https://www.youtube.com/${CHANNEL_HANDLE}`,
                videoUrl: tab === 'shorts' ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}`,
              });
              return;
            }
          }

          for (const k of Object.keys(node)) {
            parseNode(node[k]);
          }
        }

        // Parse initial Batch 1
        parseNode(data);

        // Multi-batch continuation loop (up to 5 pages of older Shorts/Videos)
        let currentContinuation = '';
        function findToken(node: any) {
          if (!node || typeof node !== 'object') return;
          if (node.continuationCommand?.token) {
            currentContinuation = node.continuationCommand.token;
            return;
          }
          for (const k of Object.keys(node)) {
            if (currentContinuation) return;
            findToken(node[k]);
          }
        }
        findToken(data);

        const apiKey = apiKeyMatch?.[1];
        let pageCount = 0;

        while (currentContinuation && apiKey && pageCount < 2) {
          pageCount++;
          const nextToken = currentContinuation;
          currentContinuation = '';

          try {
            const contRes = await fetchWithTimeout(`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
              body: JSON.stringify({
                context: {
                  client: {
                    clientName: 'WEB',
                    clientVersion: '2.20260801.00.00',
                    hl: 'en',
                    gl: 'US',
                  },
                },
                continuation: nextToken,
              }),
              next: { revalidate: 300 },
            });

            if (contRes.ok) {
              const contData = await contRes.json();
              parseNode(contData);
              findToken(contData);
            }
          } catch (e) {
            break;
          }
        }
      } catch (e) {}
    }

    // 4. Additional Direct Regex Fallback Scan for Shorts tab
    if (tab === 'shorts') {
      const shortsIdRegex = /(?:\/shorts\/|"reelWatchEndpoint":\{\s*"videoId":\s*")([a-zA-Z0-9_-]{11})/g;
      let m;
      while ((m = shortsIdRegex.exec(html)) !== null) {
        const videoId = m[1];
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);

          items.push({
            id: `yt-live-${videoId}`,
            youtubeId: videoId,
            title: 'Gujarat Post Short',
            titleGu: 'Gujarat Post Short',
            titleHi: 'Gujarat Post Short',
            description: 'Gujarat Post Short',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            publishedAt: new Date().toISOString(),
            type: 'short',
            views: parseNumericViews('', videoId),
            duration: '0:58',
            category: 'News',
            channelUrl: `https://www.youtube.com/${CHANNEL_HANDLE}`,
            videoUrl: `https://www.youtube.com/shorts/${videoId}`,
          });
        }
      }
    }

    return items;
  } catch (err) {
    console.error(`Error scraping channel tab ${tab}:`, err);
    return [];
  }
}

// Fallback RSS parser if page scraping fails
async function fetchRssFeed(): Promise<{ videos: any[]; shorts: any[] }> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
  const rssRes = await fetchWithTimeout(rssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GujaratPost/1.0)' },
    next: { revalidate: 300 },
  }, 6000);

  if (!rssRes.ok) return { videos: [], shorts: [] };

  const xmlText = await rssRes.text();
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const videos: any[] = [];
  const shorts: any[] = [];
  let match;

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryXml = match[1];

    const getTag = (tag: string) => {
      const m = entryXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/[tag]>`));
      return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : '';
    };
    const getAttr = (tag: string, attr: string) => {
      const m = entryXml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"[^>]*>`));
      return m ? m[1] : '';
    };

    const videoId = getAttr('yt:videoId', 'url') || getTag('yt:videoId');
    const title = cleanTitle(getTag('title'));
    const link = getAttr('link', 'href') || `https://www.youtube.com/watch?v=${videoId}`;
    const published = getTag('published') || new Date().toISOString();
    const thumbnail = getAttr('media:thumbnail', 'url') || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const viewsMatch = entryXml.match(/views="(\d+)"/);
    const viewsCount = viewsMatch ? parseInt(viewsMatch[1]) : parseNumericViews('', videoId);

    if (!videoId) continue;

    const itemIsShort =
      link.includes('/shorts/') ||
      title.toLowerCase().includes('#short') ||
      title.toLowerCase().includes('#shorts');

    const videoObj = {
      id: `yt-live-${videoId}`,
      youtubeId: videoId,
      title,
      titleGu: title,
      titleHi: title,
      description: title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: published,
      type: itemIsShort ? 'short' : 'video',
      views: viewsCount,
      duration: itemIsShort ? '0:58' : '10:00',
      category: 'News',
      channelUrl: `https://www.youtube.com/${CHANNEL_HANDLE}`,
      videoUrl: link,
    };

    if (itemIsShort) shorts.push(videoObj);
    else videos.push(videoObj);
  }

  return { videos, shorts };
}

// Memory cache & in-flight deduplication to prevent duplicate scraping and ensure instant responses
interface CacheStore {
  timestamp: number;
  data: any[];
}
const memoryCache = new Map<string, CacheStore>();
const inFlightRequests = new Map<string, Promise<any[]>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'video' | 'short' | null for all
  const cacheKey = type || 'all';

  // 1. Check in-memory cache
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, data: cached.data, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  }

  // 2. In-flight request deduplication (prevents 5 simultaneous requests from doing 5 YouTube scrapes)
  if (inFlightRequests.has(cacheKey)) {
    try {
      const data = await inFlightRequests.get(cacheKey)!;
      return NextResponse.json(
        { success: true, data, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    } catch {
      // Fall through to perform fresh fetch
    }
  }

  // 3. Perform fetch
  const fetchTask = (async () => {
    let result: any[] = [];

    if (type === 'video') {
      const channelVideos = await fetchChannelTab('videos');
      if (channelVideos.length > 0) {
        result = channelVideos.filter((v) => v.type === 'video');
      } else {
        const rss = await fetchRssFeed();
        result = rss.videos;
      }
    } else if (type === 'short') {
      const [channelShorts, rss] = await Promise.all([
        fetchChannelTab('shorts').catch(() => []),
        fetchRssFeed().catch(() => ({ videos: [], shorts: [] })),
      ]);
      const combined = [...channelShorts];
      const seen = new Set(channelShorts.map((s) => s.youtubeId));
      for (const r of (rss.shorts || [])) {
        if (!seen.has(r.youtubeId)) {
          combined.push(r);
        }
      }
      result = combined.map((item) => ({
        ...item,
        type: 'short',
        videoUrl: `https://www.youtube.com/shorts/${item.youtubeId}`,
      }));
    } else {
      const [v, s] = await Promise.all([
        fetchChannelTab('videos').catch(() => []),
        fetchChannelTab('shorts').catch(() => []),
      ]);
      if (v.length > 0 || s.length > 0) {
        result = [...v, ...s];
      } else {
        const rss = await fetchRssFeed().catch(() => ({ videos: [], shorts: [] }));
        result = [...(rss.videos || []), ...(rss.shorts || [])];
      }
    }

    // Save to memory cache if we got results, or if cache is empty
    if (result.length > 0 || !memoryCache.has(cacheKey)) {
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: result });
    }

    return result;
  })();

  inFlightRequests.set(cacheKey, fetchTask);

  try {
    const result = await fetchTask;
    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (err: any) {
    console.warn('YouTube fetch error:', err?.message || err);
    // If we have stale cache, serve it instead of failing
    if (cached) {
      return NextResponse.json({ success: true, data: cached.data, stale: true });
    }
    return NextResponse.json({ success: false, data: [], error: err?.message }, { status: 200 });
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

