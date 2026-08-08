import { Article, Video, Photo } from '@/types';
import { PHOTOS } from '@/data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gujaratpost.onrender.com/api/public';

export const BACKEND_API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/public\/?$/, '')
  : 'https://gujaratpost.onrender.com/api';

export function getBackendApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
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
const CACHE_TTL_MS = 60000; // 60 seconds cache TTL for public API calls

export function clearApiCache(): void {
  apiCache.clear();
}

/**
 * Fetch wrapper with caching & in-flight request deduplication
 */
async function fetchCachedJson<T = any>(url: string, cacheTtlMs: number = CACHE_TTL_MS): Promise<T | null> {
  const now = Date.now();
  const cached = apiCache.get(url);
  if (cached && now - cached.timestamp < cacheTtlMs) {
    return cached.data as T;
  }

  if (inFlightRequests.has(url)) {
    try {
      return (await inFlightRequests.get(url)) as T;
    } catch {
      return null;
    }
  }

  const fetchPromise = (async () => {
    const controller = new AbortController();
    // Increase timeout to 30s to allow remote cloud database queries to complete smoothly without premature aborts
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(url, {
        next: { revalidate: 300 },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const json = await res.json();
      apiCache.set(url, { timestamp: Date.now(), data: json });
      return json;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  })();

  inFlightRequests.set(url, fetchPromise);

  try {
    const data = await fetchPromise;
    return data as T;
  } catch (error: any) {
    console.warn(`Backend API fetch error for ${url}:`, error?.message || error);
    return null;
  } finally {
    inFlightRequests.delete(url);
  }
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

    const url = `${API_BASE_URL}/articles?${params.toString()}`;
    const json = await fetchCachedJson<any>(url);

    if (json?.success && json.data?.articles) {
      return json.data;
    }
  } catch (error: any) {
    console.warn('Backend API fetch error for articles:', error?.message || error);
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
export async function getPublicArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const url = `${API_BASE_URL}/articles/${slug}`;
    const json = await fetchCachedJson<any>(url);

    if (json?.success && json.data?.article) {
      return json.data.article;
    }
  } catch (error: any) {
    console.warn('Backend API fetch error for article detail:', error?.message || error);
  }

  return null;
}

/**
 * Fetch list of categories from Express Backend API
 */
export async function getPublicCategories(options?: { showInHeader?: boolean; showInHome?: boolean }): Promise<any[]> {
  try {
    const query = new URLSearchParams();
    if (options?.showInHeader) query.set('showInHeader', 'true');
    if (options?.showInHome) query.set('showInHome', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const url = `${API_BASE_URL}/categories${queryString}`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.categories) {
      return json.data.categories;
    }
  } catch (error: any) {
    console.warn('Backend API fetch error for categories:', error?.message || error);
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
    console.warn('Backend API fetch error for authors:', error?.message || error);
  }
  return [];
}

export const YOUTUBE_CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
export const YOUTUBE_CHANNEL_HANDLE = '@Gujaratpostnews';

/**
 * Fetch live YouTube channel videos & shorts dynamically from YouTube RSS Feed (@Gujaratpostnews)
 */
export async function fetchLiveYouTubeChannelVideos(): Promise<{ videos: Video[]; shorts: Video[] }> {
  try {
    // Call our server-side Next.js API route (avoids CORS issues with direct RSS fetch)
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://gujaratpost.vercel.app');
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
 * Fetch videos list dynamically combining live YouTube channel uploads + DB videos
 */
export async function getPublicVideos(type?: string): Promise<Video[]> {
  const combined: Video[] = [];
  const seenIds = new Set<string>();

  try {
    // 1. Fetch live YouTube channel uploads from @Gujaratpostnews RSS feed
    const liveYt = await fetchLiveYouTubeChannelVideos();
    const liveList =
      type === 'short'
        ? liveYt.shorts
        : type === 'video'
          ? liveYt.videos
          : [...liveYt.videos, ...liveYt.shorts];

    // 2. Fetch backend database videos
    const url = type ? `${API_BASE_URL}/videos?type=${type}` : `${API_BASE_URL}/videos`;
    const json = await fetchCachedJson<any>(url);
    const dbVideos: Video[] = (json?.success && Array.isArray(json.data?.videos)) ? json.data.videos : [];

    // Create lookup map for DB videos by youtubeId or id
    const dbMap = new Map<string, Video>();
    for (const dbv of dbVideos) {
      const key = dbv.youtubeId || dbv.id;
      if (key) dbMap.set(key, dbv);
    }

    // 3. FIRST: Add all DB videos that are marked as isFeatured: true
    for (const dbv of dbVideos) {
      if (dbv.isFeatured) {
        const idKey = dbv.youtubeId || dbv.id;
        if (idKey && !seenIds.has(idKey)) {
          seenIds.add(idKey);
          combined.push(dbv);
        }
      }
    }

    // 4. SECOND: Add live RSS videos, merging isFeatured and localized titles from DB if available
    for (const v of liveList) {
      if (v.youtubeId && !seenIds.has(v.youtubeId)) {
        seenIds.add(v.youtubeId);
        const dbMatch = dbMap.get(v.youtubeId);
        if (dbMatch) {
          combined.push({
            ...v,
            ...dbMatch,
            isFeatured: dbMatch.isFeatured ?? v.isFeatured,
            titleGu: dbMatch.titleGu || v.titleGu,
            titleHi: dbMatch.titleHi || v.titleHi,
          });
        } else {
          combined.push(v);
        }
      }
    }

    // 5. THIRD: Add remaining DB videos
    for (const dbv of dbVideos) {
      const idKey = dbv.youtubeId || dbv.id;
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        combined.push(dbv);
      }
    }
  } catch (error: any) {
    console.warn('Backend API fetch error for videos:', error?.message || error);
  }

  return combined;
}

/**
 * Fetch photo gallery items from Express Backend API
 */
export async function getPublicGallery(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/gallery`;
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
    const url = `${API_BASE_URL}/webstories`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.webStories) {
      return json.data.webStories;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Backend API fetch error for webstories:', error?.message || error);
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
    const url = `${API_BASE_URL}/tickers`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.tickers) {
      return json.data.tickers;
    }
  } catch (error: any) {
    console.warn('Backend API fetch error for tickers:', error?.message || error);
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
    console.warn('Backend API fetch error for astrology:', error?.message || error);
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
 * Fetch Hero section settings and slot articles from Express Backend API
 */
export async function getHeroSettings(): Promise<{ slots: (Article | null)[]; setting: any }> {
  try {
    const url = `${API_BASE_URL}/hero-settings`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.slots) {
      return json.data;
    }
  } catch (error: any) {
    console.warn('Backend API fetch error for hero-settings:', error?.message || error);
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
  trendingTopics?: string[];
  trendingNewsIds?: string[];
  popularNewsIds?: string[];
}): Promise<any> {
  const res = await authFetch('/api/admin/hero-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update hero settings');
  }
  clearApiCache();
  return res.json();
}

/**
 * Fetch Instagram Reels (Admin/Public)
 */
export async function getPublicReels(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/reels?isActive=true`;
    const json = await fetchCachedJson<any>(url);
    if (json?.success && json.data?.reels) {
      return json.data.reels;
    }
  } catch (error: any) {
    console.warn('Backend API fetch error for reels:', error?.message || error);
  }
  return [];
}

