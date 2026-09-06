import { Article, Video, Photo } from '@/types';
import { PHOTOS } from '@/data';

export const BACKEND_API_BASE = typeof window !== 'undefined'
  ? '/api'
  : (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/public\/?$/, '')
    : 'http://127.0.0.1:5000/api');

export const API_BASE_URL = typeof window !== 'undefined'
  ? '/api/public'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/public');

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
const CACHE_TTL_MS = 180000; // 3 minutes cache TTL for public API calls

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
    // 15-second timeout so API calls fail fast and trigger fallbacks without hanging Next.js SSR
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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
  sort?: string;
  orderBy?: string;
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
}

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

  try {
    // 1. Fetch backend database videos (already ordered by isFeatured desc, publishedAt desc)
    const url = type ? `${API_BASE_URL}/videos?type=${type}` : `${API_BASE_URL}/videos`;
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
        if (liveMatch) {
          combined.push({
            ...liveMatch,
            ...dbv,
            // ✅ CRITICAL: Always prefer LIVE scraped views over DB zeros
            // DB stores views=0 (never updated from YouTube), live has real counts
            views: (liveMatch.views && liveMatch.views > 0) ? liveMatch.views : (dbv.views || 0),
            // ✅ Prefer live duration over DB generic "10:00" / "0:00" defaults
            duration: (liveMatch.duration && liveMatch.duration !== '10:00' && liveMatch.duration !== '0:00' && liveMatch.duration !== '0:58')
              ? liveMatch.duration
              : (dbv.duration || liveMatch.duration),
            thumbnail: dbv.thumbnail || liveMatch.thumbnail,
            titleGu: dbv.titleGu || liveMatch.titleGu || dbv.title,
            titleHi: dbv.titleHi || liveMatch.titleHi || dbv.title,
            isFeatured: dbv.isFeatured ?? liveMatch.isFeatured ?? false,
          });
        } else {
          combined.push(dbv);
        }
      }
    }

    // 4. SECOND: Add any remaining live YouTube videos not yet in DB
    for (const lv of liveList) {
      const key = getCleanKey(lv);
      if (key && !seenIds.has(key)) {
        seenIds.add(key);
        combined.push(lv);
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

export async function fetchLiveInstagramReels(): Promise<any[]> {
  try {
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const apiUrl = `${baseUrl}/api/instagram-reels`;

    const res = await fetchCachedJson<any>(apiUrl, 300000); // 5-minute cache
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('Failed to fetch live Instagram reels feed:', err);
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
    console.warn('Backend API fetch error for reels:', error?.message || error);
  }

  // Fallback: fetch directly from live Instagram scrape (12 reels max)
  return fetchLiveInstagramReels();
}

/**
 * Fetch live Gold & Silver market rates
 */
export async function getMarketRates(): Promise<any> {
  try {
    const url = `${API_BASE_URL}/market-rates`;
    const json = await fetchCachedJson<any>(url, 5 * 60 * 1000);
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    console.warn('Failed to fetch market rates from API:', error?.message || error);
  }
  return {
    gold: { price: '₹74,850', priceNumber: 74850, change: '▲ ₹450', purity: '24 Karat', unit: '10 Grams' },
    silver: { price: '₹84,200', priceNumber: 84200, change: '— Stable', purity: '999 Fine', unit: '1 Kg' },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetch live Weather data
 */
export async function getPublicWeather(city?: string): Promise<any> {
  return {
    city: 'અમદાવાદ',
    cityEn: 'Ahmedabad',
    temp: 32,
    humidity: 68,
    windSpeed: 14,
    conditionGu: 'આંશિક વાદળછાયું',
    conditionEn: 'Partly cloudy',
    weatherCode: 2,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetch public advertisements for sections
 */
export async function getPublicAds(): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/ads`;
    const json = await fetchCachedJson<any>(url, 5 * 60 * 1000); // 5 minutes cache
    if (json && json.success && json.data?.ads) {
      return json.data.ads;
    }
  } catch (error: any) {
    console.warn('Failed to fetch public ads from API:', error?.message || error);
  }
  return [];
}

export async function getPublicAdBySection(section: string): Promise<any | null> {
  try {
    const url = `${API_BASE_URL}/ads/${encodeURIComponent(section)}`;
    const json = await fetchCachedJson<any>(url, 5 * 60 * 1000); // 5 minutes cache
    if (json && json.success && json.data?.ad) {
      return json.data.ad;
    }
  } catch (error: any) {
    console.warn(`Failed to fetch public ad for section ${section}:`, error?.message || error);
  }
  return null;
}

/**
 * Fetch public Support QR Code & Bank details
 */
export async function getPublicSupportDetails(): Promise<any | null> {
  try {
    const url = `${API_BASE_URL}/support?t=${Date.now()}`;
    const json = await fetchCachedJson<any>(url, 0);
    if (json && json.success && json.data) {
      return json.data;
    }
  } catch (error: any) {
    console.warn('Failed to fetch public support details:', error?.message || error);
  }
  return null;
}

