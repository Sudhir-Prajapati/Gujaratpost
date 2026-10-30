import { cache } from 'react';
import { Article, Video, Photo } from '@/types';
import { PHOTOS } from '@/data';

export function cleanBackendUrl(rawUrl?: string, isProd = process.env.NODE_ENV === 'production'): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('/')) return '';
  try {
    const urlStr = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(urlStr);

    if (isProd && (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return '';
    }
    if (parsed.hostname === 'api') {
      return '';
    }

    let pathname = parsed.pathname.replace(/\/+$/, '');
    if (pathname.endsWith('/api/public')) {
      pathname = pathname.slice(0, -'/api/public'.length);
    } else if (pathname.endsWith('/api')) {
      pathname = pathname.slice(0, -'/api'.length);
    }
    return `${parsed.origin}${pathname}`;
  } catch {
    return '';
  }
}

function resolveBackendOrigin(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  const envUrl = cleanBackendUrl(rawUrl, isProd);
  if (isProd) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1') || envUrl === 'https://api') {
      return 'https://api.gujaratpost.in';
    }
    return envUrl;
  }
  let devUrl = envUrl || 'http://127.0.0.1:5000';
  if (devUrl.includes('localhost:')) {
    devUrl = devUrl.replace('://localhost:', '://127.0.0.1:');
  }
  return devUrl;
}

const BACKEND_ORIGIN = resolveBackendOrigin();

export const BACKEND_API_BASE = typeof window !== 'undefined'
  ? '/api'
  : `${BACKEND_ORIGIN}/api`;

export const API_BASE_URL = typeof window !== 'undefined'
  ? '/api/public'
  : `${BACKEND_ORIGIN}/api/public`;

export function getBackendApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    if (cleanPath.startsWith('/api/')) {
      return cleanPath;
    }
    return `/api${cleanPath}`;
  }
  if (cleanPath.startsWith('/api/')) {
    return `${BACKEND_API_BASE}${cleanPath.substring(4)}`;
  }
  return `${BACKEND_API_BASE}${cleanPath}`;
}

export function getAccessTokenFromCookie(): string | null {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }
  if (typeof localStorage !== 'undefined') {
    const localToken = localStorage.getItem('access_token');
    if (localToken) return localToken;
  }
  return null;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessTokenFromCookie();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

// Memory cache & In-flight request deduplication map
const apiCache = new Map<string, { timestamp: number; data: any }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 60000; // 60s memory cache

function normalizeApiUrl(url: string): string {
  try {
    const isRelative = url.startsWith('/');
    const parsed = new URL(url, 'http://localhost');
    const params = new URLSearchParams(parsed.search);
    params.sort();
    const cleanSearch = params.toString() ? `?${params.toString()}` : '';
    return isRelative ? `${parsed.pathname}${cleanSearch}` : `${parsed.origin}${parsed.pathname}${cleanSearch}`;
  } catch {
    return url;
  }
}

export function clearApiCache(): void {
  apiCache.clear();
}

/**
 * Clears the local API cache AND broadcasts a refresh signal to ALL open
 * browser tabs/windows (including the public-facing homepage) via BroadcastChannel.
 * Call this after any admin save action.
 */
export function clearApiCacheAndBroadcast(extraData?: Record<string, any>): void {
  apiCache.clear();
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('gp-articles-updated'));
    } catch {}
    if ('BroadcastChannel' in window) {
      try {
        const ch = new BroadcastChannel('gp-admin-updates');
        ch.postMessage({ type: 'HERO_UPDATED', timestamp: Date.now(), ...(extraData || {}) });
        ch.close();
      } catch {
        // BroadcastChannel not supported — graceful degradation
      }
    }
  }
}

/**
 * Fetch wrapper with caching & in-flight request deduplication
 */
async function fetchCachedJson<T = any>(url: string, cacheTtlMs: number = CACHE_TTL_MS): Promise<T | null> {
  const normalizedKey = normalizeApiUrl(url);
  const effectiveTtl = cacheTtlMs;
  const now = Date.now();
  const cached = apiCache.get(normalizedKey);
  if (cached && now - cached.timestamp < effectiveTtl) {
    return cached.data as T;
  }

  const existing = inFlightRequests.get(normalizedKey);
  if (existing) {
    return existing as Promise<T | null>;
  }

  const fetchPromise = (async (): Promise<T | null> => {
    const isServer = typeof window === 'undefined';
    const revalidateSeconds = process.env.NODE_ENV === 'development' ? 0 : (effectiveTtl > 0 ? Math.max(10, Math.round(effectiveTtl / 1000)) : 0);
    const maxAttempts = isServer ? 2 : 3;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        // 12s for SSR to prevent server hangs; 25s in browser so concurrent client requests do not abort prematurely
        const timeoutDuration = isServer ? 12000 : 25000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        const fetchOptions: RequestInit = {
          signal: controller.signal,
        };

        if (isServer && revalidateSeconds > 0) {
          // Safe Next.js Data Cache revalidation for public read requests during SSR
          (fetchOptions as any).next = { revalidate: revalidateSeconds };
        } else if (isServer && revalidateSeconds === 0) {
          // Explicitly bypass cache for dynamic/zero-TTL SSR requests
          fetchOptions.cache = 'no-store';
        }

        try {
          const res = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);

          // Handle rate limit (e.g., Render free tier waking up with 'hibernate-rate-limited') or temporary gateway blip
          if ((res.status === 429 || res.status === 502 || res.status === 503) && attempt < maxAttempts) {
            const retryAfterHeader = res.headers.get('retry-after');
            const delayMs = retryAfterHeader ? Math.min(parseInt(retryAfterHeader, 10) * 1000, 6000) : attempt * 1500;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
          }

          const text = await res.text();
          if (!text || !text.trim()) {
            return null;
          }

          let json: any = null;
          try {
            json = JSON.parse(text);
          } catch (parseErr: any) {
            console.warn(`JSON parse error for ${url}:`, parseErr?.message || parseErr);
            return null;
          }

          apiCache.set(normalizedKey, { timestamp: Date.now(), data: json });
          return json as T;
        } catch (error: any) {
          clearTimeout(timeoutId);
          const isAbort = error?.name === 'AbortError' || error?.message?.includes('aborted');

          if (attempt < maxAttempts && !isAbort) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            continue;
          }

          if (isAbort) {
            if (isServer && process.env.NODE_ENV === 'development') {
              console.warn(`SSR fetch timed out for ${url}`);
            } else if (!isServer) {
              console.debug(`Fetch aborted for ${url}`);
            }
          } else {
            const isClientAbort = !isServer && (error?.message === 'Failed to fetch' || error?.name === 'TypeError');
            if (!isClientAbort && process.env.NODE_ENV === 'development') {
              console.warn(`Backend API fetch error for ${url}:`, error?.message || error);
            }
          }
          return null;
        }
      }
      return null;
    } finally {
      inFlightRequests.delete(normalizedKey);
    }
  })();

  inFlightRequests.set(normalizedKey, fetchPromise);
  return fetchPromise;
}

/**
 * Fetch articles list from Express Backend API
 */
export async function getPublicArticles(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  query?: string;
  isTrending?: boolean;
  isBreaking?: boolean;
  isFeatured?: boolean;
  sort?: string;
  orderBy?: string;
  includeContent?: boolean;
} = {}): Promise<{ articles: Article[]; total: number; totalPages: number }> {
  try {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));
    if (options.categorySlug) params.append('categorySlug', options.categorySlug);
    if (options.query) params.append('query', options.query);
    if (options.isTrending) params.append('isTrending', 'true');
    if (options.isBreaking) params.append('isBreaking', 'true');
    if (options.isFeatured) params.append('isFeatured', 'true');
    if (options.includeContent) params.append('includeContent', 'true');
    if ((options as any).sort) params.append('sort', (options as any).sort);
    if ((options as any).orderBy) params.append('orderBy', (options as any).orderBy);

    const url = `${API_BASE_URL}/articles?${params.toString()}`;
    const json = await fetchCachedJson<any>(url);

    if (json?.success && Array.isArray(json.data?.articles)) {
      const filtered = json.data.articles.filter(
        (a: any) => a && a.status !== 'DRAFT' && a.status !== 'ARCHIVED' && a.status !== 'IN_REVIEW' && a.isPublished !== false
      );
      return {
        articles: filtered,
        total: json.data.total ?? filtered.length,
        totalPages: json.data.totalPages ?? 1,
      };
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for articles:', error?.message || error);
    }
  }

  return {
    articles: [],
    total: 0,
    totalPages: 1,
  };
}

/**
 * Fetch single article details by slug or ID from Express Backend API
 */
export const getPublicArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  try {
    const cleanSlug = encodeURIComponent(decodeURIComponent(slug).trim());
    const url = `${API_BASE_URL}/articles/${cleanSlug}`;
    const json = await fetchCachedJson<any>(url, 120 * 1000);

    if (json?.success && json.data?.article) {
      return json.data.article;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for article detail:', error?.message || error);
    }
  }

  // Fallback article detail lookup for weather/rain/AQI news items
  const fallbackArticles: Article[] = [
    {
      id: 'news-1',
      slug: 'gujarat-seven-day-rain-forecast',
      title: 'રાજ્યમાં હજુ સાત દિવસ વરસાદી માહોલ રહેવાની હવામાન વિભાગની આગાહી',
      titleGu: 'રાજ્યમાં હજુ સાત દિવસ વરસાદી માહોલ રહેવાની હવામાન વિભાગની આગાહી',
      excerpt: 'હવામાન વિભાગ દ્વારા આગામી 7 દિવસ દરમિયાન ગુજરાતના વિવિધ જિલ્લાઓમાં મધ્યમથી ભારે વરસાદની આગાહી કરવામાં આવી છે.',
      content: '<p>હવામાન વિભાગ દ્વારા આગામી 7 દિવસ દરમિયાન ગુજરાતના વિવિધ જિલ્લાઓમાં મધ્યમથી ભારે વરસાદની આગાહી કરવામાં આવી છે. દક્ષિણ ગુજરાત અને સૌરાષ્ટ્રના દરિયાકાંઠાના વિસ્તારોમાં પવન સાથે વરસાદ પડાવાની શક્યતા છે.</p><p>બંગાળની ખાડીમાં સર્જાયેલા લો પ્રેશરના કારણે રાજ્યમાં ચોમાસું ફરી સક્રિય બન્યું છે.</p>',
      image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80',
      category: 'WEATHER',
      author: { id: 'team', name: 'Gujarat Post Team' },
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1240,
      tags: ['Weather', 'Rain', 'Gujarat'],
    },
    {
      id: 'news-2',
      slug: 'ahmedabad-aqi-moderate-category',
      title: 'અમદાવાદમાં AQI 100 પાર, હવા ગુણવત્તા મધ્યમ શ્રેણીમાં નોંધાઈ',
      titleGu: 'અમદાવાદમાં AQI 100 પાર, હવા ગુણવત્તા મધ્યમ શ્રેણીમાં નોંધાઈ',
      excerpt: 'અમદાવાદ શહેરનો સરેરાશ એર ક્વોલિટી ઈન્ડેક્સ (AQI) 103 નોંધાયો છે, જે મધ્યમ શ્રેણીમાં આવે છે.',
      content: '<p>અમદાવાદ શહેરનો સરેરાશ એર ક્વોલિટી ઈન્ડેક્સ (AQI) 103 નોંધાયો છે, જે મધ્યમ શ્રેણીમાં આવે છે. શહેરના નવરંગપુરા અને ચાંદખેડા વિસ્તારમાં PM 2.5 અને PM 10નું પ્રમાણ વધારે જોવા મળ્યું છે.</p>',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
      category: 'WEATHER',
      author: { id: 'team', name: 'Gujarat Post Team' },
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 890,
      tags: ['AQI', 'Air Quality', 'Ahmedabad'],
    },
    {
      id: 'news-3',
      slug: 'north-gujarat-red-alert-rain',
      title: 'આગામી ત્રણ કલાક અતિભારે વરસાદની હવામાન વિભાગની આગાહી',
      titleGu: 'આગામી ત્રણ કલાક અતિભારે વરસાદની હવામાન વિભાગની આગાહી',
      excerpt: 'ઉત્તર ગુજરાતના બનાસકાંઠા, પાટણ અને મહેસાણા જિલ્લાઓમાં અતિભારે વરસાદનું રેડ એલર્ટ જાહેર કરાયું છે.',
      content: '<p>ઉત્તર ગુજરાતના બનાસકાંઠા, પાટણ અને મહેસાણા જિલ્લાઓમાં અતિભારે વરસાદનું રેડ એલર્ટ જાહેર કરાયું છે. તંત્ર દ્વારા નાગરિકોને સલામત સ્થળે રહેવા અપીલ કરાઈ છે.</p>',
      image: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=600&q=80',
      category: 'WEATHER',
      author: { id: 'team', name: 'Gujarat Post Team' },
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1560,
      tags: ['Rain Alert', 'North Gujarat'],
    },
    {
      id: 'news-4',
      slug: 'gujarat-rainfall-surat-details',
      title: 'જુઓ ગુજરાતમાં ક્યાં કેટલો વરસાદ ખાબક્યો: સુરતમાં 4 ઈંચ અનરાધાર વરસાદ - Video',
      titleGu: 'જુઓ ગુજરાતમાં ક્યાં કેટલો વરસાદ ખાબક્યો: સુરતમાં 4 ઈંચ અનરાધાર વરસાદ - Video',
      excerpt: 'સુરતમાં મેઘરાજાએ તોફાની બેટિંગ કરતા 4 ઈંચ જેટલો પાણી ખાબક્યું છે.',
      content: '<p>સુરત શહેરમાં અનરાધાર વરસાદ પડતા નીચાણવાળા વિસ્તારોમાં પાણી ભરાયા છે. રસ્તાઓ પર પાણી ફરી વળતા વાહનવ્યવહારને અસર પહોંચી છે.</p>',
      image: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=600&q=80',
      category: 'WEATHER',
      author: { id: 'team', name: 'Gujarat Post Team' },
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 2100,
      tags: ['Surat', 'Rainfall'],
    },
  ];

  const match = fallbackArticles.find(a => a.slug === slug);
  if (match) return match;

  return null;
});

/**
 * Fetch list of categories from Express Backend API
 */
export async function getPublicCategories(options?: { showInHeader?: boolean; showInHome?: boolean; headerType?: string }): Promise<any[]> {
  try {
    const query = new URLSearchParams();
    if (options?.showInHeader) query.set('showInHeader', 'true');
    if (options?.showInHome) query.set('showInHome', 'true');
    if (options?.headerType) query.set('headerType', options.headerType);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const url = `${API_BASE_URL}/categories${queryString}`;
    const json = await fetchCachedJson<any>(url, 5000);
    if (json?.success && json.data?.categories) {
      return json.data.categories;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for categories:', error?.message || error);
    }
  }
  return [];
}

/**
 * Fetch list of authors from Express Backend API
 */
export async function getPublicAuthors(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/authors`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.authors) {
      return json.data.authors;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for authors:', error?.message || error);
    }
  }
  return [];
}

export const YOUTUBE_CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
export const YOUTUBE_CHANNEL_HANDLE = '@Gujaratpostnews';

export interface YouTubeChannelInfo {
  handle: string;
  title: string;
  subscribers: string;
  subscribersCount: number;
  videosCount: string;
  videosCountNum: number;
  avatar: string;
  banner: string;
  description: string;
  channelUrl: string;
  verified: boolean;
}

/**
 * Fetch live YouTube channel metadata (@Gujaratpostnews)
 */
export async function fetchYouTubeChannelInfo(): Promise<YouTubeChannelInfo> {
  const fallback: YouTubeChannelInfo = {
    handle: '@Gujaratpostnews',
    title: 'Gujarat Post',
    subscribers: '2.57K',
    subscribersCount: 2570,
    videosCount: '554',
    videosCountNum: 554,
    avatar: 'https://yt3.googleusercontent.com/qzwNL3_hxc_KE_Y1WjMB4mUraPhWool5jeSwNndMqHK3NoFSKYjcIij-BU1xVXmyz5SNX6jYmA=s900',
    banner: '',
    description: 'Gujarat Post – Real Stories. Real Gujarat. Your digital hub for Gujarat news, Indian politics, entertainment, lifestyle, national & international updates, and sharp geopolitical insights.',
    channelUrl: 'https://www.youtube.com/@Gujaratpostnews',
    verified: true,
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/youtube-channel`;
    const res = await fetchCachedJson<any>(apiUrl, 600000); // 10-minute cache
    if (res?.success && res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn('Failed to fetch YouTube channel info:', err);
  }

  return fallback;
}

/**
 * Fetch live YouTube channel videos & shorts dynamically from YouTube RSS Feed (@Gujaratpostnews)
 */
export async function fetchLiveYouTubeChannelVideos(): Promise<{ videos: Video[]; shorts: Video[] }> {
  // During server-side rendering (SSR), do not block HTML generation by scraping external YouTube.
  // The database videos already provide immediate content. Client-side components fetch fresh live YouTube uploads dynamically.
  if (typeof window === 'undefined') {
    return { videos: [], shorts: [] };
  }

  try {
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/youtube-videos`;

    const res = await fetchCachedJson<any>(apiUrl, 300000); // 5-minute cache
    if (res?.success && Array.isArray(res.data)) {
      const videos: Video[] = res.data.filter((v: any) => v.type === 'video');
      const shorts: Video[] = res.data.filter((v: any) => v.type === 'short');
      return { videos, shorts };
    }
  } catch (err) {
    console.warn('Failed to fetch live YouTube channel feed:', err);
  }

  return { videos: [], shorts: [] };
}


/**
 * Fetch videos list dynamically combining DB videos + live YouTube channel uploads
 * Strictly deduplicated by youtubeId.
 */
export async function getPublicVideos(type?: string): Promise<Video[]> {

  const combined: Video[] = [];
  const seenIds = new Set<string>();

  const getCleanKey = (item: any): string => {
    if (item?.youtubeId) return item.youtubeId.trim();
    if (item?.id) return item.id.replace(/^yt-live-/, '').trim();
    return '';
  };

  // Fix broken frame0.jpg thumbnails → hqdefault.jpg (frame0 returns gray placeholder)
  const fixThumbnail = (thumb: string | null | undefined, youtubeId?: string): string => {
    if (!thumb || thumb.includes('frame0.jpg')) {
      const id = youtubeId || '';
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : (thumb || '');
    }
    return thumb;
  };

  const getFallbackViews = (fallbackKey: string): number => {
    let hash = 0;
    const str = fallbackKey || 'video';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 760) + 180;
  };

  const getFallbackDuration = (fallbackKey: string): string => {
    let hash = 0;
    const str = fallbackKey || 'video';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const mins = (Math.abs(hash) % 7) + 2;
    const secs = (Math.abs(hash >> 3) % 50) + 10;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  try {
    // 1. Fetch backend database videos (already ordered by isFeatured desc, publishedAt desc)
    const url = type
      ? `${API_BASE_URL}/videos?type=${type}${type === 'short' ? '&limit=100' : ''}`
      : `${API_BASE_URL}/videos`;
    const json = await fetchCachedJson<any>(url, 60 * 1000);
    const dbVideos: Video[] = (json?.success && Array.isArray(json.data?.videos)) ? json.data.videos : [];

    // 2. Fetch live YouTube channel uploads from @Gujaratpostnews
    const liveYt = await fetchLiveYouTubeChannelVideos();
    const liveList =
      type === 'short'
        ? liveYt.shorts
        : type === 'video'
          ? liveYt.videos
          : [...liveYt.videos, ...liveYt.shorts];

    // Create lookup map for live videos by youtubeId
    const liveMap = new Map<string, Video>();
    for (const lv of liveList) {
      const key = getCleanKey(lv);
      if (key) liveMap.set(key, lv);
    }

    // 3. FIRST: Add DB videos (which already prioritize top 20 isFeatured), merging fresh live thumbnails/views
    for (const dbv of dbVideos) {
      const key = getCleanKey(dbv);
      if (key && !seenIds.has(key)) {
        seenIds.add(key);
        const liveMatch = liveMap.get(key);
        const cleanViews = (liveMatch?.views && liveMatch.views > 0)
          ? liveMatch.views
          : (dbv.views && dbv.views > 0)
            ? dbv.views
            : getFallbackViews(key);
        const cleanDuration = (liveMatch?.duration && liveMatch.duration !== '10:00' && liveMatch.duration !== '0:00' && liveMatch.duration !== '0:58')
          ? liveMatch.duration
          : (dbv.duration && dbv.duration !== '10:00' && dbv.duration !== '0:00')
            ? dbv.duration
            : getFallbackDuration(key);

        if (liveMatch) {
          combined.push({
            ...liveMatch,
            ...dbv,
            views: cleanViews,
            duration: cleanDuration,
            thumbnail: fixThumbnail(dbv.thumbnail || liveMatch.thumbnail, key),
            titleGu: dbv.titleGu || liveMatch.titleGu || dbv.title,
            titleHi: dbv.titleHi || liveMatch.titleHi || dbv.title,
            isFeatured: dbv.isFeatured ?? liveMatch.isFeatured ?? false,
          });
        } else {
          combined.push({
            ...dbv,
            views: cleanViews,
            duration: cleanDuration,
            thumbnail: fixThumbnail(dbv.thumbnail, key),
          });
        }
      }
    }

    // 4. SECOND: Add any remaining live YouTube videos not yet in DB
    for (const lv of liveList) {
      const key = getCleanKey(lv);
      if (key && !seenIds.has(key)) {
        seenIds.add(key);
        combined.push({
          ...lv,
          views: (lv.views && lv.views > 0) ? lv.views : getFallbackViews(key),
          duration: (lv.duration && lv.duration !== '10:00' && lv.duration !== '0:00') ? lv.duration : getFallbackDuration(key),
          thumbnail: fixThumbnail(lv.thumbnail, key),
        });
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for videos:', error?.message || error);
    }
  }

  return combined;
}


/**
 * Fetch photo gallery items from Express Backend API
 */
export async function getPublicGallery(params?: { limit?: number; page?: number; relatedToId?: string }): Promise<any[]> {
  try {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.page) query.set('page', String(params.page));
    if (params?.relatedToId) query.set('relatedToId', params.relatedToId);
    const qs = query.toString();
    const url = `${API_BASE_URL}/gallery${qs ? `?${qs}` : ''}`;
    const json = await fetchCachedJson<any>(url, 60 * 1000);
    if (json?.success && json.data?.photos && json.data.photos.length > 0) {
      return json.data.photos;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for gallery:', error?.message || error);
    }
  }

  return PHOTOS;
}

/**
 * Fetch single photo gallery item from Express Backend API
 */
export async function getPublicGalleryPhoto(id: string): Promise<any | null> {
  try {
    const url = `${API_BASE_URL}/gallery/${encodeURIComponent(id)}`;
    const json = await fetchCachedJson<any>(url, 0);
    if (json?.success && json.data?.photo) {
      return json.data.photo;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for single photo:', error?.message || error);
    }
  }

  return null;
}

/**
 * Fetch Instagram stories from Express Backend API
 */
export async function getPublicStories(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/stories`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.stories) {
      return json.data.stories;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for stories:', error?.message || error);
    }
  }
  return [];
}

/**
 * Fetch Web stories from Express Backend API
 */
export async function getPublicWebStories(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/web-stories`;
    const json = await fetchCachedJson<any>(url, 5 * 60 * 1000);
    if (json && json.success && Array.isArray(json.data?.stories)) {
      return json.data.stories;
    }
    if (json && json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for web-stories:', error?.message || error);
    }
  }
  return [];
}

/**
 * Fetch Live Center data (Fuel, Market, Cricket, Football) from Express Backend API
 */
export async function getLiveCenterData(): Promise<any> {
  try {
    const url = `${API_BASE_URL}/live-center`;
    const json = await fetchCachedJson<any>(url, 60 * 1000);
    if (json?.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for live center:', error?.message || error);
    }
  }
  return null;
}

/**
 * Fetch Breaking tickers from Express Backend API
 */
export async function getPublicTickers(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/tickers?_t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (json?.success && json.data) {
      const isHidden = Boolean(json.data.tickerHidden);
      const arr = json.data.tickers || [];
      (arr as any).tickerLabel = json.data.tickerLabel;
      (arr as any).tickerBadge = json.data.tickerBadge;
      (arr as any).tickerMode = json.data.tickerMode || 'scroll';
      (arr as any).tickerSpeed = json.data.tickerSpeed || 5000;
      (arr as any).selectedArticleIds = json.data.selectedArticleIds || [];
      (arr as any).tickerHidden = isHidden;
      return arr;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for tickers:', error?.message || error);
    }
  }
  return [];
}

/**
 * Fetch Astrology signs predictions from Express Backend API
 */
export async function getPublicAstrology(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/astrology`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.signs) {
      return json.data.signs;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for astrology:', error?.message || error);
    }
  }
  return [];
}

/**
 * Update Astrology sign details (Admin)
 */
export async function updateAdminAstrologySign(slug: string, payload: any): Promise<any> {
  const res = await authFetch(`/api/admin/astrology/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update astrology sign');
  }
  clearApiCache();
  return res.json();
}


/**
 * Fetch Hero section settings and slot articles from Express Backend API.
 * TTL = 0 so the user-facing homepage always gets fresh hero data with no delay.
 */
export async function getHeroSettings(bypassCache = false): Promise<{ slots: (Article | null)[]; setting: any }> {
  try {
    const query = bypassCache ? `?t=${Date.now()}` : '';
    const url = `${API_BASE_URL}/hero-settings${query}`;
    // 15s cache TTL prevents concurrent SSR fetches from hammering the backend; admin saves immediately invalidate via clearApiCacheAndBroadcast()
    const json = await fetchCachedJson<any>(url, bypassCache ? 0 : 15 * 1000);
    if (json?.success && json.data?.slots) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for hero-settings:', error?.message || error);
    }
  }
  return { slots: [null, null, null], setting: null };
}

/**
 * Update Hero section settings (Admin)
 */
export async function updateHeroSettings(payload: {
  slot1Id?: string | null;
  slot2Id?: string | null;
  slot3Id?: string | null;
  trendingTopics?: string[] | string;
  trendingNewsIds?: string[] | string;
  popularNewsIds?: string[] | string;
  mostReadIds?: string[] | string;
  mostReadMode?: 'auto' | 'manual';
  heroGridIds?: string[] | string;
  heroGridMode?: 'auto' | 'manual';
  heroSliderMode?: 'auto' | 'manual';
  heroSliderIds?: string[];
  tickerLabel?: string | Record<string, string> | null;
  electionBannerEnabled?: boolean;
  electionBannerJson?: any;
}): Promise<any> {
  const res = await authFetch('/api/admin/hero-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update hero settings');
  }
  // Clear local cache AND broadcast to all open tabs (user-facing pages) to re-fetch immediately
  clearApiCacheAndBroadcast();
  return res.json();
}

export async function fetchLiveInstagramReels(): Promise<any[]> {
  try {
    const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
    const validAppUrl = (appUrlEnv && (!appUrlEnv.includes('localhost') || process.env.NODE_ENV !== 'production'))
      ? appUrlEnv
      : (process.env.NODE_ENV === 'production' ? 'https://guj-stg.gujaratpost.in' : 'http://localhost:3000');
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : validAppUrl;
    const apiUrl = `${baseUrl}/api/instagram-reels`;

    const res = await fetchCachedJson<any>(apiUrl, 300000); // 5-minute cache
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch live Instagram reels feed:', err);
    }
  }

  return [];
}

/**
 * Fetch Instagram Reels — serves all synced DB reels (up to 50).
 * Falls back to live Instagram scrape if DB is empty.
 */
export async function getPublicReels(): Promise<any[]> {
  try {
    // Primary: serve top 50 newest active reels synced into the database
    const dbUrl = `${API_BASE_URL}/reels?isActive=true&limit=50`;
    const json = await fetchCachedJson<any>(dbUrl, 60 * 1000); // 60s cache
    const dbReels: any[] = (json?.success && Array.isArray(json.data?.reels)) ? json.data.reels : [];

    if (dbReels.length > 0) {
      // Return all DB reels — they are already sorted newest-first by the backend
      return dbReels;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for reels:', error?.message || error);
    }
  }

  // Fallback: fetch directly from live Instagram scrape (12 reels max)
  return fetchLiveInstagramReels();
}

/**
 * Fetch live Gold & Silver market rates
 */
import { fetchLiveMarketRates } from './marketRates';

/**
 * Fetch live Gold & Silver market rates
 */
export async function getMarketRates(forceRefresh = false): Promise<any> {
  try {
    const url = `${API_BASE_URL}/market-rates${forceRefresh ? `?_t=${Date.now()}` : ''}`;
    const ttl = forceRefresh ? 0 : 5 * 60 * 1000;
    const json = await fetchCachedJson<any>(url, ttl);
    if (json && json.success && json.data && json.data.gold?.priceNumber > 50000) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch market rates from API:', error?.message || error);
    }
  }
  return fetchLiveMarketRates(forceRefresh);
}

import { fetchLiveCityWeather } from './weather';

/**
 * Fetch live Weather data
 */
export async function getPublicWeather(city?: string): Promise<any> {
  const live = await fetchLiveCityWeather(city);
  return {
    city: live.city,
    cityEn: live.cityEn,
    temp: parseInt(live.currentTemp.replace(/[^0-9]/g, ''), 10) || 32,
    high: live.high,
    low: live.low,
    humidity: parseInt(live.humidity?.replace(/[^0-9]/g, '') || '60', 10),
    windSpeed: parseInt(live.windSpeed?.replace(/[^0-9]/g, '') || '12', 10),
    conditionGu: live.condition,
    conditionEn: live.conditionEn,
    weatherCode: live.weatherCode,
    icon: live.icon,
    updatedAt: live.updatedAt,
  };
}

/**
 * Fetch public advertisements for sections
 */
export async function getPublicAds(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/ads`;
    const json = await fetchCachedJson<any>(url, 5 * 1000); // 5 seconds cache for fast admin sync
    if (json && json.success && json.data?.ads) {
      return json.data.ads;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch public ads from API:', error?.message || error);
    }
  }
  return [];
}

export async function getPublicAdBySection(section: string): Promise<any | null> {
  try {
    const formatted = (section || '').toUpperCase().trim();
    if (!formatted) return null;

    // 1. Check allAds from GET /api/public/ads
    const allAds = await getPublicAds();
    if (Array.isArray(allAds) && allAds.length > 0) {
      // Direct exact match by section identifier
      const exactMatch = allAds.find((ad: any) => (ad?.section || '').toUpperCase().trim() === formatted);
      if (exactMatch) {
        // If the admin disabled this section, strictly return null (no fallback)
        if (exactMatch.isActive === false || exactMatch.isActive === 0 || exactMatch.isActive === '0') {
          return null;
        }
        // If active from admin, verify it has actual media uploaded
        const hasMedia =
          (exactMatch.image1 && typeof exactMatch.image1 === 'string' && exactMatch.image1.trim() !== '') ||
          (exactMatch.image2 && typeof exactMatch.image2 === 'string' && exactMatch.image2.trim() !== '') ||
          (exactMatch.image3 && typeof exactMatch.image3 === 'string' && exactMatch.image3.trim() !== '');
        return hasMedia ? exactMatch : null;
      }
    }

    // 2. Fetch specific section directly from backend API: GET /api/public/ads/:section
    const url = `${API_BASE_URL}/ads/${encodeURIComponent(section)}`;
    const json = await fetchCachedJson<any>(url, 5 * 1000);
    if (json && json.success && json.data?.ad) {
      const ad = json.data.ad;
      if (ad.isActive === false || ad.isActive === 0 || ad.isActive === '0') {
        return null;
      }
      const hasMedia =
        (ad.image1 && typeof ad.image1 === 'string' && ad.image1.trim() !== '') ||
        (ad.image2 && typeof ad.image2 === 'string' && ad.image2.trim() !== '') ||
        (ad.image3 && typeof ad.image3 === 'string' && ad.image3.trim() !== '');
      return hasMedia ? ad : null;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to fetch public ad for section ${section}:`, error?.message || error);
    }
  }
  return null;
}

/**
 * Fetch public Support QR Code & Bank details
 */
export async function getPublicSupportDetails(): Promise<any | null> {
  try {
    const url = `${API_BASE_URL}/support`;
    const json = await fetchCachedJson<any>(url, 5 * 1000);
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch public support details:', error?.message || error);
    }
  }
  return null;
}

export interface TributeItem {
  id: string;
  type: 'BIRTHDAY' | 'SHRADHANJALI';
  name: string;
  photo?: string | null;
  date?: string | null;
  info?: string | null;
  templateId: string;
  isActive: boolean;
  order: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicTributesResponse {
  birthdays: TributeItem[];
  shradhanjalis: TributeItem[];
  all: TributeItem[];
}

/**
 * Fetch public Birthday & Shradhanjali tributes for the homepage ad carousel
 */
export async function getPublicTributes(): Promise<PublicTributesResponse> {
  try {
    const url = `${API_BASE_URL}/tributes?t=${Date.now()}`;
    const json = await fetchCachedJson<any>(url, 30 * 1000); // 30 sec cache
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch public tributes:', error?.message || error);
    }
  }
  return { birthdays: [], shradhanjalis: [], all: [] };
}

/**
 * Fetch public About Us page details
 */
export async function getPublicAbout(): Promise<any | null> {
  try {
    const url = `${API_BASE_URL}/about?t=${Date.now()}`;
    const json = await fetchCachedJson<any>(url, 30 * 1000); // 30 sec cache
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch public about details:', error?.message || error);
    }
  }
  return null;
}

/**
 * Fetch About Us page details for Admin
 */
export async function getAdminAbout(): Promise<any | null> {
  const res = await authFetch('/api/admin/about');
  if (!res.ok) {
    throw new Error('Failed to fetch admin about settings');
  }
  const json = await res.json();
  return json?.data || null;
}

/**
 * Update About Us page details (Admin)
 */
export async function updateAdminAbout(payload: any): Promise<any> {
  const res = await authFetch('/api/admin/about', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update about settings');
  }
  clearApiCache();
  return res.json();
}

/**
 * Fetch public Contact Us page details
 */
export async function getPublicContact(): Promise<any | null> {
  try {
    const url = `${API_BASE_URL}/contact?t=${Date.now()}`;
    const json = await fetchCachedJson<any>(url, 30 * 1000); // 30 sec cache
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch public contact details:', error?.message || error);
    }
  }
  return null;
}

/**
 * Submit contact message (Public)
 */
export async function submitContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  subject: string;
  message: string;
}): Promise<any> {
  const url = `${API_BASE_URL}/contact/message`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to submit message');
  }
  return json;
}

/**
 * Fetch Contact Us page details for Admin
 */
export async function getAdminContact(): Promise<any | null> {
  const res = await authFetch('/api/admin/contact');
  if (!res.ok) {
    throw new Error('Failed to fetch admin contact settings');
  }
  const json = await res.json();
  return json?.data || null;
}

/**
 * Update Contact Us page details (Admin)
 */
export async function updateAdminContact(payload: any): Promise<any> {
  const res = await authFetch('/api/admin/contact', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update contact settings');
  }
  clearApiCache();
  return res.json();
}

/**
 * Fetch received contact messages (Admin)
 */
export async function getAdminContactMessages(): Promise<any[]> {
  const res = await authFetch('/api/admin/contact/messages');
  if (!res.ok) {
    throw new Error('Failed to fetch contact messages');
  }
  const json = await res.json();
  return json?.data || [];
}

/**
 * Mark contact message as read/unread (Admin)
 */
export async function toggleAdminContactMessageRead(id: string, isRead: boolean): Promise<any> {
  const res = await authFetch(`/api/admin/contact/messages/${id}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isRead }),
  });
  if (!res.ok) {
    throw new Error('Failed to update message status');
  }
  return res.json();
}

/**
 * Delete contact message (Admin)
 */
export async function deleteAdminContactMessage(id: string): Promise<any> {
  const res = await authFetch(`/api/admin/contact/messages/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete contact message');
  }
  return res.json();
}

/**
 * Mark all contact messages as read (Admin)
 */
export async function markAllAdminContactMessagesRead(): Promise<any> {
  const res = await authFetch('/api/admin/contact/messages/mark-all-read', {
    method: 'PUT',
  });
  if (!res.ok) {
    throw new Error('Failed to mark all messages as read');
  }
  return res.json();
}

/**
 * Submit Feedback or Complaint (Public)
 */
export async function submitFeedback(payload: {
  type: 'FEEDBACK' | 'COMPLAINT';
  name: string;
  email: string;
  phone?: string;
  category?: string;
  subject: string;
  message: string;
  articleUrl?: string;
}): Promise<any> {
  const url = `${API_BASE_URL}/feedback`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to submit feedback');
  }
  return json;
}

/**
 * Fetch received feedbacks & complaints (Admin)
 */
export async function getAdminFeedbacks(params?: {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.type && params.type !== 'ALL') query.set('type', params.type);
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const url = `/api/admin/feedback${qs ? `?${qs}` : ''}`;
  const res = await authFetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch feedback records');
  }
  const json = await res.json();
  return json?.data || { items: [], total: 0, stats: {} };
}

/**
 * Update feedback/complaint status and notes (Admin)
 */
export async function updateAdminFeedbackStatus(
  id: string,
  payload: { status?: string; adminNotes?: string }
): Promise<any> {
  const res = await authFetch(`/api/admin/feedback/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update feedback status');
  }
  return res.json();
}

/**
 * Delete feedback or complaint (Admin)
 */
export async function deleteAdminFeedback(id: string): Promise<any> {
  const res = await authFetch(`/api/admin/feedback/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete feedback record');
  }
  return res.json();
}


/**
 * Fetch public Advertise With Us page details
 */
export async function getPublicAdvertise(): Promise<any | null> {
  try {
    const url = `${API_BASE_URL}/advertise?t=${Date.now()}`;
    const json = await fetchCachedJson<any>(url, 30 * 1000); // 30 sec cache
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch public advertise details:', error?.message || error);
    }
  }
  return null;
}

/**
 * Fetch Advertise With Us details for Admin
 */
export async function getAdminAdvertise(): Promise<any | null> {
  const res = await authFetch('/api/admin/advertise');
  if (!res.ok) {
    throw new Error('Failed to fetch admin advertise settings');
  }
  const json = await res.json();
  return json?.data || null;
}

/**
 * Update Advertise With Us details (Admin)
 */
export async function updateAdminAdvertise(payload: any): Promise<any> {
  const res = await authFetch('/api/admin/advertise', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update advertise settings');
  }
  clearApiCache();
  return res.json();
}

/**
 * Public Legal / Policy Page by slug
 */
export async function getPublicLegalPage(slug: string): Promise<any | null> {
  const url = getBackendApiUrl(`/api/public/legal/${encodeURIComponent(slug)}`);
  const json = await fetchCachedJson<any>(url, 60000);
  return json?.data || null;
}

/**
 * Admin: Get all legal pages
 */
export async function getAdminLegalPages(): Promise<any[]> {
  const res = await authFetch(getBackendApiUrl('/api/admin/legal'));
  if (!res.ok) {
    throw new Error('Failed to fetch admin legal pages');
  }
  const json = await res.json();
  return json?.data || [];
}

/**
 * Admin: Get single legal page by slug
 */
export async function getAdminLegalPage(slug: string): Promise<any | null> {
  const res = await authFetch(getBackendApiUrl(`/api/admin/legal/${encodeURIComponent(slug)}`));
  if (!res.ok) {
    throw new Error(`Failed to fetch admin legal page: ${slug}`);
  }
  const json = await res.json();
  return json?.data || null;
}

/**
 * Admin: Update legal page by slug
 */
export async function updateAdminLegalPage(slug: string, payload: any): Promise<any> {
  const res = await authFetch(getBackendApiUrl(`/api/admin/legal/${encodeURIComponent(slug)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.message || 'Failed to update legal page');
  }
  clearApiCache();
  return res.json();
}




