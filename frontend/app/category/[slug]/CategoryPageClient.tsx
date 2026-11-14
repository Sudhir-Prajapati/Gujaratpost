'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Play, Video as VideoIcon, ChevronDown, ChevronRight, ChevronLeft , Camera } from 'lucide-react';
import { Article } from '@/types';
import { useApp } from '@/components/AppProvider';
import {
  getLocalized,
  getArticleTitle,
  getCategoryLabel,
  formatViews,
  CategorySeoMeta,
} from '@/data';
import { getCategoryColor, toGu, sortArticlesByLatest } from '@/lib/utils';
import { getPublicVideos, getPublicArticles, getPublicGallery } from '@/lib/api';
import { safeYouTubeId, youtubeEmbedUrl } from '@/lib/youtube';
import NewsCard from '@/components/ui/NewsCard';
import MobileModernArticleCard from '@/components/ui/MobileModernArticleCard';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { SocialIcon } from '@/components/ui/SocialLinks';
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { useIsApk } from '@/lib/useIsApk';
import ApkCategoryFeed from '@/components/apk/ApkCategoryFeed';
import PhotoGallerySection from '@/components/sections/home/PhotoGallerySection';

const FALLBACK_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80',
  'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80',
  'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800&q=80',
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=90',
];

const FALLBACK_NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508921340878-ba53e1f016ec?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&auto=format&fit=crop&q=80',
];

/* ── Types ────────────────────────────────────────────────── */
interface Props {
  articles: Article[];
  category: { name: string; nameGu: string; nameHi: string };
  trending: Article[];
  currentPage: number;
  totalPages: number;
  slug: string;
  resolvedSlug: string;
  politicsArticles?: Article[];
  mixedArticles?: Article[];
  customSeo?: CategorySeoMeta;
}

interface PairedCategoryConfig {
  slug: string;
  name: string;
  gu: string;
  hi: string;
}

export const CATEGORY_PAIRS: Record<string, PairedCategoryConfig> = {
  // in the gujarat show the world
  gujarat: { slug: 'world', name: 'World', gu: 'વિશ્વ', hi: 'विश्व' },
  state: { slug: 'world', name: 'World', gu: 'વિશ્વ', hi: 'विश्व' },

  // and in the bharat show the crime
  national: { slug: 'crime', name: 'Crime', gu: 'ક્રાઇમ', hi: 'क्राइम' },
  india: { slug: 'crime', name: 'Crime', gu: 'ક્રાઇમ', hi: 'क्राइम' },

  // and in the world show the gujarat
  world: { slug: 'gujarat', name: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' },
  international: { slug: 'gujarat', name: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' },

  // and in the rajaniti show the fact check
  politics: { slug: 'fact-check', name: 'Fact Check', gu: 'ફેક્ટ ચેક', hi: 'फैक्ट चेक' },

  // and in the crime show the bharat
  crime: { slug: 'national', name: 'Bharat', gu: 'ભારત', hi: 'भारत' },

  // in manoranjan set technology
  entertainment: { slug: 'technology', name: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },
  manoranjan: { slug: 'technology', name: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },
  'entertainment-life-style': { slug: 'technology', name: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },
  'entertainment-lifestyle': { slug: 'technology', name: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },

  // in technology set manoranjan
  technology: { slug: 'entertainment', name: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' },
  tech: { slug: 'entertainment', name: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' },

  // adn in the helth tech
  health: { slug: 'technology', name: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },

  // in the factcheck add the rajniti
  'fact-check': { slug: 'politics', name: 'Politics', gu: 'રાજનીતિ', hi: 'राजनीति' },
  factcheck: { slug: 'politics', name: 'Politics', gu: 'રાજનીતિ', hi: 'राजनीति' },

  // and in the tranding ad the fact check
  trending: { slug: 'fact-check', name: 'Fact Check', gu: 'ફેક્ટ ચેક', hi: 'फैक्ट चेक' },
  tranding: { slug: 'fact-check', name: 'Fact Check', gu: 'ફેક્ટ ચેક', hi: 'फैक्ट चेक' },

  // City Pairs:
  // in ahmedabad want surat (instead of taza samachar)
  ahmedabad: { slug: 'surat', name: 'Surat', gu: 'સુરત', hi: 'सूरत' },

  // in surat want vadodara
  surat: { slug: 'vadodara', name: 'Vadodara', gu: 'વડોદરા', hi: 'वडोदरा' },

  // in rajkot want ahmedabad
  rajkot: { slug: 'ahmedabad', name: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' },

  // in vadodara want rajkot
  vadodara: { slug: 'rajkot', name: 'Rajkot', gu: 'રાજકોટ', hi: 'राजकोट' },
  vadodra: { slug: 'rajkot', name: 'Rajkot', gu: 'રાજકોટ', hi: 'राजकोट' },

  // in gandhinagar want other cities
  gandhinagar: { slug: 'other-cities', name: 'Other Cities', gu: 'અન્ય શહેરો', hi: 'अन्य शहर' },
  gandhinager: { slug: 'other-cities', name: 'Other Cities', gu: 'અન્ય શહેરો', hi: 'अन्य शहर' },

  // in other-cities want ahmedabad
  'other-cities': { slug: 'ahmedabad', name: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' },
  othercities: { slug: 'ahmedabad', name: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' },
  'other-city': { slug: 'ahmedabad', name: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' },
  other: { slug: 'ahmedabad', name: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' },
};

export const ALSO_READ_CATEGORY_CONFIG: Record<string, [string, string]> = {
  // Gujarat page (upper: gujarat, world) -> Crime & Bharat
  gujarat: ['crime', 'national'],
  state: ['crime', 'national'],

  // Bharat/National page (upper: national, crime) -> World & Fact-Check
  national: ['world', 'fact-check'],
  india: ['world', 'fact-check'],

  // World page (upper: world, gujarat) -> Bharat & Crime
  world: ['national', 'crime'],
  international: ['national', 'crime'],

  // Politics page (upper: politics, fact-check) -> Crime & Bharat
  politics: ['crime', 'national'],

  // Crime page (upper: crime, national) -> World & Fact-Check
  crime: ['world', 'fact-check'],

  // Entertainment page (upper: entertainment, technology) -> Crime & Fact-Check
  entertainment: ['crime', 'fact-check'],
  manoranjan: ['crime', 'fact-check'],
  'entertainment-life-style': ['crime', 'fact-check'],
  'entertainment-lifestyle': ['crime', 'fact-check'],

  // Technology page (upper: technology, entertainment) -> Crime & Fact-Check
  technology: ['crime', 'fact-check'],
  tech: ['crime', 'fact-check'],

  // Health page (upper: health, technology) -> Crime & Fact-Check
  health: ['crime', 'fact-check'],

  // Fact-Check page (upper: fact-check, politics) -> Crime & Bharat
  'fact-check': ['crime', 'national'],
  factcheck: ['crime', 'national'],

  // Trending page (upper: trending, fact-check) -> Crime & Bharat
  trending: ['crime', 'national'],
  tranding: ['crime', 'national'],

  // City Pages (upper: city1, city2) -> Alternating main news categories (Crime & Bharat / World & Fact-Check)
  ahmedabad: ['crime', 'national'],
  surat: ['world', 'fact-check'],
  vadodara: ['world', 'fact-check'],
  vadodra: ['world', 'fact-check'],
  rajkot: ['crime', 'national'],
  gandhinagar: ['crime', 'national'],
  gandhinager: ['crime', 'national'],
  'other-cities': ['world', 'fact-check'],
  othercities: ['world', 'fact-check'],
  'other-city': ['world', 'fact-check'],
  other: ['world', 'fact-check'],
};

export const ALSO_READ_CATEGORY_LABELS: Record<string, { en: string; gu: string; hi: string }> = {
  crime: { en: 'Crime', gu: 'ક્રાઇમ', hi: 'क्राइम' },
  'fact-check': { en: 'Fact Check', gu: 'ફેક્ટ ચેક', hi: 'फैक्ट चेक' },
  national: { en: 'Bharat', gu: 'ભારત', hi: 'भारत' },
  world: { en: 'World', gu: 'વિશ્વ', hi: 'विश्व' },
  politics: { en: 'Politics', gu: 'રાજનીતિ', hi: 'राजनीति' },
  entertainment: { en: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' },
  gujarat: { en: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' },
  technology: { en: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },
  health: { en: 'Health', gu: 'હેલ્થ', hi: 'हेल्थ' },
  trending: { en: 'Trending', gu: 'ટ્રેન્ડિંગ', hi: 'ट्रेंडिंग' },
};

/**
 * Returns two distinct category slugs for "Also Read" (Ae Pan Vacho),
 * mathematically guaranteeing zero overlap with the page's upper 2 categories (ownCategory & secondCategory).
 */
export function getAlsoReadCategories(ownSlug: string, pairedSlug?: string): [string, string] {
  const normOwn = (ownSlug || '').toLowerCase().trim();
  const normPaired = (pairedSlug || '').toLowerCase().trim();

  const pool = ['crime', 'fact-check', 'national', 'world', 'politics', 'entertainment', 'gujarat'];
  const excluded = new Set<string>([normOwn, normPaired]);

  // Handle common aliases for exclusions
  if (['state'].includes(normOwn) || ['state'].includes(normPaired)) excluded.add('gujarat');
  if (['india'].includes(normOwn) || ['india'].includes(normPaired)) excluded.add('national');
  if (['international'].includes(normOwn) || ['international'].includes(normPaired)) excluded.add('world');
  if (['tech'].includes(normOwn) || ['tech'].includes(normPaired)) excluded.add('technology');
  if (['factcheck'].includes(normOwn) || ['factcheck'].includes(normPaired)) excluded.add('fact-check');
  if (['tranding'].includes(normOwn) || ['tranding'].includes(normPaired)) excluded.add('trending');
  if (
    ['manoranjan', 'entertainment-life-style', 'entertainment-lifestyle'].includes(normOwn) ||
    ['manoranjan', 'entertainment-life-style', 'entertainment-lifestyle'].includes(normPaired)
  ) {
    excluded.add('entertainment');
  }

  const mapped = ALSO_READ_CATEGORY_CONFIG[normOwn];
  if (mapped && !excluded.has(mapped[0]) && !excluded.has(mapped[1]) && mapped[0] !== mapped[1]) {
    return mapped;
  }

  const selected: string[] = [];
  for (const cat of pool) {
    if (!excluded.has(cat)) {
      selected.push(cat);
      if (selected.length === 2) break;
    }
  }

  return [selected[0] || 'national', selected[1] || 'world'];
}

type FilterTab = 'all' | 'paired' | 'latest' | 'video';

const GUJARAT_MOCK_TAGS = {
  gu: ['ચૂંટણી 2027', 'વરસાદ', 'સોના-ચાંદી', 'ક્રિકેટ', 'મેટ્રો', 'સેમિકન્ડક્ટર', 'ડાયમંડ ઉદ્યોગ', 'ટ્રાફિક'],
  hi: ['चुनाव 2027', 'बारिश', 'सोना-चांदी', 'क्रिकेट', 'मेट्रो', 'सेमीकंडक्टर', 'डायमंड उद्योग', 'ट्रैफिक'],
  en: ['Election 2027', 'Rain', 'Gold-Silver', 'Cricket', 'Metro', 'Semiconductor', 'Diamond Industry', 'Traffic']
};

/* ══════════════════════════════════════════════════════════════
   CATEGORY PAGE CLIENT (Dispatcher: APK vs Web)
   ══════════════════════════════════════════════════════════════ */
export default function CategoryPageClient(props: Props) {
  const { isApk } = useIsApk();

  // DEDICATED ANDROID MOBILE APK VIEW:
  // Delivers instant, native mobile app performance and clean design for Android APK.
  if (isApk) {
    return (
      <ApkCategoryFeed
        articles={props.articles}
        category={props.category}
        trending={props.trending}
        slug={props.slug}
      />
    );
  }

  // STANDARD WEB & MOBILE BROWSER VIEW (100% UNTOUCHED):
  return <WebCategoryPageClient {...props} />;
}

/* ── Helpers for Video Detection and YouTube URLs ── */
function isVideoItem(item: any, isVideoTab = false): boolean {
  if (!item) return false;
  if (isVideoTab) return true;
  if (item.isVideoItem || item.isYouTube || item.mediaType === 'video' || item.isVideo) return true;
  if (item.videoId || item.youtubeId) return true;
  if (typeof item.videoUrl === 'string' && item.videoUrl.trim().length > 0) return true;
  if (typeof item.youtubeUrl === 'string' && item.youtubeUrl.trim().length > 0) return true;
  return false;
}

function getArticleYouTubeUrl(item: any): string {
  if (!item) return 'https://www.youtube.com/@Gujaratpostnews';

  const rawCandidate = item.videoId || item.youtubeId || item.videoUrl || item.youtubeUrl || '';
  if (rawCandidate) {
    const ytId = safeYouTubeId(rawCandidate);
    if (ytId && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
      return `https://www.youtube.com/watch?v=${ytId}`;
    }
  }

  for (const urlProp of [item.videoUrl, item.youtubeUrl, item.url, item.embedUrl]) {
    if (typeof urlProp === 'string') {
      if (urlProp.includes('youtube.com/watch') || urlProp.includes('youtu.be/') || urlProp.includes('youtube.com/shorts/')) {
        return urlProp;
      }
    }
  }

  if (item.slug) {
    const slugId = safeYouTubeId(item.slug);
    if (slugId && /^[a-zA-Z0-9_-]{11}$/.test(slugId)) {
      return `https://www.youtube.com/watch?v=${slugId}`;
    }
  }

  const title = (item.titleGu || item.title || item.titleHi || '').trim();
  if (title) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent('Gujarat Post ' + title)}`;
  }

  return 'https://www.youtube.com/@Gujaratpostnews';
}

/* ── Reusable Mobile Category Article Card (Modern Separated Design) ── */
function MobileCategoryArticleCard({
  article,
  language,
  fallbackImage,
  defaultCategorySlug,
  defaultCategoryLabel,
  index = 0,
  isVideo = false,
}: {
  article: any;
  language: any;
  fallbackImage?: string;
  defaultCategorySlug?: string;
  defaultCategoryLabel?: string;
  index?: number;
  isVideo?: boolean;
}) {
  return (
    <MobileModernArticleCard
      article={article}
      language={language}
      fallbackImage={fallbackImage}
      defaultCategorySlug={defaultCategorySlug}
      defaultCategoryLabel={defaultCategoryLabel}
      index={index}
      isVideo={isVideo}
    />
  );
}

function WebCategoryPageClient({ articles, category, slug, resolvedSlug, trending, currentPage, totalPages, politicsArticles: initialPolitics, mixedArticles: initialMixedArticles, customSeo }: Props) {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  // On page 2+: show all articles immediately; on page 1: start with 12 then load more
  const [visibleCount, setVisibleCount] = useState(currentPage > 1 ? 9999 : 12);
  // On page 2+: skip "View More" and show pagination right away
  const [hasLoadedMore, setHasLoadedMore] = useState(currentPage > 1);
  const articlesGridRef = useRef<HTMLDivElement>(null);

  // Main category articles and pagination state
  const [mainArticles, setMainArticles] = useState<Article[]>(articles || []);
  const [mainPage, setMainPage] = useState<number>(currentPage);
  const [mainTotalPages, setMainTotalPages] = useState<number>(totalPages);
  const [pageLoading, setPageLoading] = useState(false);

  // Mixed articles stream across multiple categories for the Video tab news grid
  const [mixedNews, setMixedNews] = useState<Article[]>(initialMixedArticles || []);

  // Client-side pagination cache keyed by `${categorySlug}:${page}`
  const pageCacheRef = useRef<Record<string, { articles: Article[]; totalPages: number }>>({
    [`${resolvedSlug}:${currentPage}`]: { articles: articles || [], totalPages },
  });

  // Videos state for Video filter
  const [videos, setVideos] = useState<any[]>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Also Read: 2 dynamic category article streams strictly distinct from the upper 2 categories
  const [alsoReadCat1Articles, setAlsoReadCat1Articles] = useState<any[]>([]);
  const [alsoReadCat2Articles, setAlsoReadCat2Articles] = useState<any[]>([]);
  const [trendingStories, setTrendingStories] = useState<Article[]>(trending || []);
  const [politicsStories, setPoliticsStories] = useState<Article[]>(initialPolitics || []);

  // Photo Gallery
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [galleryPage, setGalleryPage] = useState(3);
  const [hasMoreGalleryPhotos, setHasMoreGalleryPhotos] = useState(true);
  const [loadingMoreGalleryPhotos, setLoadingMoreGalleryPhotos] = useState(false);

  // Paired category configuration based on current category slug
  const normSlug = (resolvedSlug || slug || '').toLowerCase().trim();
  const usePublishDate = ['entertainment', 'entertainment-life-style', 'manoranjan'].includes(normSlug);
  const pairedCategory = CATEGORY_PAIRS[normSlug];

  // Derive the 2 Also Read categories (strictly avoiding own category and paired category)
  const [alsoReadCat1, alsoReadCat2] = useMemo(() => {
    return getAlsoReadCategories(normSlug, pairedCategory?.slug);
  }, [normSlug, pairedCategory?.slug]);

  // Articles & pagination for the paired category tab (e.g. World on Gujarat, Crime on Bharat)
  const [pairedArticles, setPairedArticles] = useState<Article[]>([]);
  const [pairedPage, setPairedPage] = useState<number>(1);
  const [pairedTotalPages, setPairedTotalPages] = useState<number>(1);
  const [pairedLoading, setPairedLoading] = useState(false);

  useEffect(() => {
    if (!pairedCategory?.slug) {
      setPairedArticles([]);
      setPairedPage(1);
      setPairedTotalPages(1);
      return;
    }
    const cacheKey = `${pairedCategory.slug}:1`;
    if (pageCacheRef.current[cacheKey]) {
      setPairedArticles(pageCacheRef.current[cacheKey].articles);
      setPairedTotalPages(pageCacheRef.current[cacheKey].totalPages);
      return;
    }
    let isMounted = true;
    setPairedLoading(true);
    getPublicArticles({ categorySlug: pairedCategory.slug, page: 1, limit: 42 })
      .then((res) => {
        if (!isMounted) return;
        const fetched = sortArticlesByLatest(res?.articles || []);
        const tPages = res?.totalPages || 1;
        pageCacheRef.current[cacheKey] = { articles: fetched, totalPages: tPages };
        setPairedArticles(fetched);
        setPairedTotalPages(tPages);
      })
      .catch(() => { })
      .finally(() => {
        if (isMounted) setPairedLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [pairedCategory?.slug]);

  // Reset states whenever category slug or resolvedSlug changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    pageCacheRef.current[`${resolvedSlug}:${currentPage}`] = { articles: articles || [], totalPages };
    setMainArticles(articles || []);
    setMainPage(currentPage);
    setMainTotalPages(totalPages);
    setPairedArticles([]);
    setPairedPage(1);
    setPairedTotalPages(1);
    setAlsoReadCat1Articles([]);
    setAlsoReadCat2Articles([]);
    setActiveTab('all');
    setPlayingVideoId(null);
    if (initialMixedArticles && initialMixedArticles.length > 0) {
      setMixedNews(initialMixedArticles);
    }
  }, [slug, resolvedSlug, currentPage, totalPages, initialMixedArticles]);

  // Ensure mixed news pool across categories is loaded for Video tab
  useEffect(() => {
    if (mixedNews.length === 0) {
      getPublicArticles({ page: 1, limit: 48, sort: 'latest' })
        .then((res) => {
          if (res?.articles?.length) {
            setMixedNews(sortArticlesByLatest(res.articles));
          }
        })
        .catch(() => { });
    }
  }, [mixedNews.length]);

  // Derived active tab state for unified article rendering and pagination
  const isPairedTab = activeTab === 'paired' && Boolean(pairedCategory?.slug);
  const activePage = isPairedTab ? pairedPage : mainPage;
  const activeTotalPages = isPairedTab ? pairedTotalPages : mainTotalPages;

  // Active articles for current page & tab (updates dynamically when page or tab changes)
  const currentArticles = useMemo(() => {
    if (isPairedTab) {
      return pairedArticles;
    }
    return mainArticles;
  }, [isPairedTab, pairedArticles, mainArticles]);

  // Fetch public videos stream for Video tab
  useEffect(() => {
    getPublicVideos('video')
      .then((res) => {
        if (res && Array.isArray(res)) {
          setVideos(res);
        }
      })
      .catch(() => { });
  }, []);

  // Fetch articles for "Also Read" section from 2 categories strictly different from the upper 2 categories
  useEffect(() => {
    let isMounted = true;
    if (!alsoReadCat1 || !alsoReadCat2) return;

    const label1 = ALSO_READ_CATEGORY_LABELS[alsoReadCat1] || { en: alsoReadCat1, gu: alsoReadCat1, hi: alsoReadCat1 };
    const label2 = ALSO_READ_CATEGORY_LABELS[alsoReadCat2] || { en: alsoReadCat2, gu: alsoReadCat2, hi: alsoReadCat2 };

    Promise.all([
      getPublicArticles({ categorySlug: alsoReadCat1, limit: 16 }),
      getPublicArticles({ categorySlug: alsoReadCat2, limit: 16 }),
    ])
      .then(([res1, res2]) => {
        if (!isMounted) return;
        const list1 = (res1?.articles || []).map((art: any) => ({
          ...art,
          customCategoryLabel: language === 'gu' ? label1.gu : language === 'hi' ? label1.hi : label1.en,
          categorySlug: art.categorySlug || alsoReadCat1,
        }));
        const list2 = (res2?.articles || []).map((art: any) => ({
          ...art,
          customCategoryLabel: language === 'gu' ? label2.gu : language === 'hi' ? label2.hi : label2.en,
          categorySlug: art.categorySlug || alsoReadCat2,
        }));
        setAlsoReadCat1Articles(list1);
        setAlsoReadCat2Articles(list2);
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, [alsoReadCat1, alsoReadCat2, language]);

  // Fetch Top 5 Rajniti / Politics stories specifically for trending category right sidebar
  useEffect(() => {
    if (normSlug !== 'trending') return;
    if (politicsStories.length >= 5) return;
    let active = true;
    getPublicArticles({ categorySlug: 'politics', limit: 10 })
      .then((res) => {
        if (active && res?.articles?.length) setPoliticsStories(sortArticlesByLatest(res.articles));
      })
      .catch(() => { });
    return () => { active = false; };
  }, [normSlug, politicsStories.length]);

  useEffect(() => {
    if (trending && trending.length > 0) {
      setTrendingStories(trending);
    }
  }, [trending]);

  // Load the sidebar after the main category feed has rendered for other categories.
  useEffect(() => {
    if (normSlug === 'trending') return;
    let active = true;

    const fetchTrending = () => {
      getPublicArticles({ isTrending: true, limit: 10 })
        .then((res) => {
          if (active && res?.articles && res.articles.length > 0) {
            setTrendingStories(res.articles);
          }
        })
        .catch(() => { });
    };

    if (trendingStories.length === 0) {
      fetchTrending();
    }

    const handleArticlesUpdated = () => {
      fetchTrending();
    };

    window.addEventListener('gp-articles-updated', handleArticlesUpdated);
    return () => {
      active = false;
      window.removeEventListener('gp-articles-updated', handleArticlesUpdated);
    };
  }, [normSlug, trendingStories.length]);

  // Fetch Photo Gallery
  useEffect(() => {
    getPublicGallery({ page: 1, limit: 8 })
      .then((res) => {
        if (Array.isArray(res)) {
          setGalleryPhotos(res.slice(0, 8));
          setHasMoreGalleryPhotos(res.length >= 8);
        }
      })
      .catch(() => { });
  }, []);

  const loadMoreGalleryPhotos = async () => {
    if (loadingMoreGalleryPhotos || !hasMoreGalleryPhotos) return;
    setLoadingMoreGalleryPhotos(true);
    try {
      const nextPhotos = await getPublicGallery({ page: galleryPage, limit: 4 });
      const knownIds = new Set(galleryPhotos.map((photo: any) => photo.id || photo.src || photo.url));
      const newPhotos = nextPhotos.filter((photo: any) => {
        const id = photo.id || photo.src || photo.url;
        if (!id || knownIds.has(id)) return false;
        knownIds.add(id);
        return true;
      });
      if (newPhotos.length) {
        setGalleryPhotos((photos) => [...photos, ...newPhotos]);
        setGalleryPage((page) => page + 1);
      }
      setHasMoreGalleryPhotos(newPhotos.length === 4);
    } catch {
      // Keep the control available so a failed request can be retried.
    } finally {
      setLoadingMoreGalleryPhotos(false);
    }
  };

  // Interleave Category 1 & Category 2 articles for "Also Read" (24 articles total: 12 Cat1 + 12 Cat2)
  const alsoReadArticles = useMemo(() => {
    const currentArticleIds = new Set(
      [...(mainArticles || []), ...(pairedArticles || []), ...(activeTab === 'video' ? mixedNews : [])]
        .map((a: any) => a.id)
        .filter(Boolean)
    );
    const combined: any[] = [];
    const seenIds = new Set<string>();
    const maxLen = Math.max(alsoReadCat1Articles.length, alsoReadCat2Articles.length);
    for (let i = 0; i < maxLen; i++) {
      const a1 = alsoReadCat1Articles[i];
      if (a1 && a1.id && !currentArticleIds.has(a1.id) && !seenIds.has(a1.id)) {
        seenIds.add(a1.id);
        combined.push(a1);
      }
      const a2 = alsoReadCat2Articles[i];
      if (a2 && a2.id && !currentArticleIds.has(a2.id) && !seenIds.has(a2.id)) {
        seenIds.add(a2.id);
        combined.push(a2);
      }
    }
    return combined.slice(0, 24);
  }, [alsoReadCat1Articles, alsoReadCat2Articles, mainArticles, pairedArticles, activeTab, mixedNews]);

  // Get localized category name aligned exactly with header menu links
  const getCategoryTitleLocalized = () => {
    if (slug === 'other-cities' || slug === 'otherCities' || slug === 'othercities' || slug === 'other-city' || slug === 'other') {
      return getLocalized(language, { en: 'Other Cities', gu: 'અન્ય શહેરો', hi: 'अन्य शहर' });
    }
    if (slug === 'ahmedabad') {
      return getLocalized(language, { en: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' });
    }
    if (slug === 'surat') {
      return getLocalized(language, { en: 'Surat', gu: 'સુરત', hi: 'सूरत' });
    }
    if (slug === 'vadodara' || slug === 'vadodra') {
      return getLocalized(language, { en: 'Vadodara', gu: 'વડોદરા', hi: 'वडोदरा' });
    }
    if (slug === 'rajkot') {
      return getLocalized(language, { en: 'Rajkot', gu: 'રાજકોટ', hi: 'राजकोट' });
    }
    if (slug === 'gandhinagar' || slug === 'gandhinager') {
      return getLocalized(language, { en: 'Gandhinagar', gu: 'ગાંધીનગર', hi: 'गांधीनगर' });
    }
    if (slug === 'gujarat' || slug === 'state') {
      return getLocalized(language, { en: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' });
    }
    if (slug === 'national') {
      return getLocalized(language, { en: 'Bharat', gu: 'ભારત', hi: 'भारत' });
    }
    if (slug === 'crime') {
      return getLocalized(language, { en: 'Crime', gu: 'ક્રાઈમ', hi: 'क्राइम' });
    }
    if (slug === 'technology') {
      return getLocalized(language, { en: 'Technology', gu: 'ટેક્નોલોજી', hi: 'ટેક્નોલોજી' });
    }
    if (slug === 'lifestyle') {
      return getLocalized(language, { en: 'Lifestyle', gu: 'લાઈફસ્ટાઈલ', hi: 'લાઈફસ્ટાઈલ' });
    }
    return getLocalized(language, {
      en: category?.name || '',
      gu: category?.nameGu || '',
      hi: category?.nameHi || '',
    });
  };

  const categoryName = getCategoryTitleLocalized();
  const currentActiveCatSlug = activeTab === 'paired' && pairedCategory ? pairedCategory.slug : slug;
  const currentActiveCatLabel = activeTab === 'paired' && pairedCategory
    ? getLocalized(language, { en: pairedCategory.name, gu: pairedCategory.gu, hi: pairedCategory.hi })
    : categoryName;

  const getCategoryNewsTitle = () => {
    const baseName = currentActiveCatLabel;
    if (language === 'gu') {
      if (baseName.includes('સમાચાર')) return baseName;
      if (baseName === 'અન્ય શહેરો') return 'અન્ય શહેરોના સમાચાર';
      return `${baseName} સમાચાર`;
    }
    if (language === 'hi') {
      if (baseName.includes('समाचार')) return baseName;
      if (baseName === 'अन्य शहर') return 'अन्य शहरों के समाचार';
      return `${baseName} समाचार`;
    }
    if (baseName.toLowerCase().includes('news')) return baseName;
    return `${baseName} News`;
  };

  /* Get localized location */
  const getArticleLocation = (art: Article) => {
    if (activeTab === 'video') {
      return categoryName;
    }
    if (activeTab === 'paired' && pairedCategory) {
      return (art as any).categoryGu || getLocalized(language, { en: pairedCategory.name, gu: pairedCategory.gu, hi: pairedCategory.hi });
    }
    if (language === 'gu') {
      return (art as any).categoryGu || art.tagsGu?.[0] || getCategoryLabel(art, language);
    }
    if (language === 'hi') {
      return (art as any).categoryHi || art.tagsHi?.[0] || getCategoryLabel(art, language);
    }
    return art.category || art.tags?.[0] || getCategoryLabel(art, language);
  };

  /* Get localized views */
  const getArticleViews = (art: Article) => {
    if (language === 'gu') return (art as any).viewsGu || toGu(formatViews(art.views));
    if (language === 'hi') return (art as any).viewsHi || formatViews(art.views);
    return (art as any).views || formatViews(art.views);
  };

  const getArticleTimeMs = (art: Article) => {
    const updatedVal = (art as any).updatedAt;
    const publishedVal = art.publishedAt || (art as any).createdAt;
    const updatedMs = updatedVal ? new Date(updatedVal).getTime() : 0;
    const publishedMs = publishedVal ? new Date(publishedVal).getTime() : 0;
    const t = !usePublishDate && !isNaN(updatedMs) && updatedMs > 0 ? updatedMs : publishedMs;
    return isNaN(t) ? 0 : t;
  };

  /* Filter & Sort logic based on activeTab specifically for Section (Hero + Sub-Hero + Top Stories) */

  // 1. Articles with Video OR YouTube videos
  const categoryVideoItems = useMemo<any[]>(() => {
    const catNameLower = (category?.name || '').toLowerCase().trim();
    const catGuLower = (category?.nameGu || '').toLowerCase().trim();
    const slugLower = (slug || '').toLowerCase().trim();

    // Articles in this category with video
    const videoArticles = (currentArticles || [])
      .filter((a: any) => a.videoUrl || a.youtubeUrl || a.mediaType === 'video' || a.isVideo)
      .map((a: any) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        titleGu: a.titleGu,
        titleHi: a.titleHi,
        image: a.image || a.featuredImage,
        category: categoryName,
        categoryGu: categoryName,
        categoryHi: categoryName,
        publishedAt: a.publishedAt,
        relativeTimeGu: a.relativeTimeGu,
        relativeTime: a.relativeTime,
        videoUrl: a.videoUrl || a.youtubeUrl,
        videoId: safeYouTubeId(a.videoUrl || a.youtubeUrl),
        youtubeId: safeYouTubeId(a.videoUrl || a.youtubeUrl),
        isVideoItem: true,
        isArticle: true,
      }));

    // Freshness filter: Drop any video older than 1 year (strictly exclude 4-year-old or legacy videos)
    const oneYearAgoMs = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const isFreshVideo = (v: any) => {
      if (!v) return false;
      const dateVal = v.publishedAt || v.createdAt || v.date;
      if (dateVal) {
        const t = new Date(dateVal).getTime();
        if (!isNaN(t) && t > 0 && t < oneYearAgoMs) return false;
      }
      const rel = `${v.relativeTime || ''} ${v.relativeTimeGu || ''} ${v.relativeTimeHi || ''}`.toLowerCase();
      if (rel.includes('year') || rel.includes('વર્ષ') || rel.includes('साल')) {
        return false;
      }
      return true;
    };

    const freshVideos = (videos || []).filter(isFreshVideo);

    // YouTube videos ONLY if title/description contains category title/slug (e.g. Surat / સુરત, Bharat / ભારત, etc.)
    const categoryMatchingYouTubeVideos = freshVideos
      .filter((v: any) => {
        if (!v) return false;
        const textToSearch = `${v.title || ''} ${v.titleGu || ''} ${v.description || ''} ${v.categoryName || ''} ${v.category || ''}`.toLowerCase();
        return (
          (catNameLower && textToSearch.includes(catNameLower)) ||
          (catGuLower && textToSearch.includes(catGuLower)) ||
          (slugLower && textToSearch.includes(slugLower))
        );
      })
      .map((v: any) => ({
        id: v.id || v.youtubeId || v.videoId,
        slug: v.slug || `video-${v.youtubeId || v.id}`,
        title: v.title || v.titleGu,
        titleGu: v.titleGu || v.title,
        titleHi: v.titleHi || v.title,
        image: v.thumbnail || v.image,
        category: categoryName,
        categoryGu: categoryName,
        categoryHi: categoryName,
        publishedAt: v.publishedAt || new Date().toISOString(),
        relativeTimeGu: v.relativeTimeGu || 'હમણાં જ',
        relativeTime: v.relativeTime || 'Just now',
        videoUrl: v.youtubeUrl || (v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : ''),
        videoId: v.youtubeId || v.videoId || safeYouTubeId(v.youtubeUrl || v.embedUrl),
        youtubeId: v.youtubeId || v.videoId || safeYouTubeId(v.youtubeUrl || v.embedUrl),
        isVideoItem: true,
        isYouTube: true,
      }));

    // Other YouTube videos from the channel to ensure the top section has 6 REAL videos in EVERY category
    const otherYouTubeVideos = freshVideos
      .filter((v: any) => !categoryMatchingYouTubeVideos.some((mv: any) => (mv.youtubeId || mv.id) === (v.youtubeId || v.id)))
      .map((v: any) => ({
        id: v.id || v.youtubeId || v.videoId,
        slug: v.slug || `video-${v.youtubeId || v.id}`,
        title: v.title || v.titleGu,
        titleGu: v.titleGu || v.title,
        titleHi: v.titleHi || v.title,
        image: v.thumbnail || v.image,
        category: categoryName,
        categoryGu: categoryName,
        categoryHi: categoryName,
        publishedAt: v.publishedAt || new Date().toISOString(),
        relativeTimeGu: v.relativeTimeGu || 'હમણાં જ',
        relativeTime: v.relativeTime || 'Just now',
        videoUrl: v.youtubeUrl || (v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : ''),
        videoId: v.youtubeId || v.videoId || safeYouTubeId(v.youtubeUrl || v.embedUrl),
        youtubeId: v.youtubeId || v.videoId || safeYouTubeId(v.youtubeUrl || v.embedUrl),
        isVideoItem: true,
        isYouTube: true,
      }));

    const sortByDateDesc = (a: any, b: any) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    };

    // Sort videos newest-first
    categoryMatchingYouTubeVideos.sort(sortByDateDesc);
    otherYouTubeVideos.sort(sortByDateDesc);

    // 1. Top Section: Exactly 6 real fresh videos
    const allAvailableVideos = [...videoArticles, ...categoryMatchingYouTubeVideos, ...otherYouTubeVideos].sort(sortByDateDesc);
    const top6Videos = allAvailableVideos.slice(0, 6);

    return top6Videos;
  }, [currentArticles, videos, category, slug, categoryName]);

  // Helper to normalize category name/slug of any article
  const getArticleNormCat = useCallback((art: any): string => {
    const raw = (
      (typeof art.category === 'string' ? art.category : (art.category as any)?.slug || (art.category as any)?.name) ||
      art.categorySlug ||
      art.categoryGu ||
      art.categoryHi ||
      ''
    ).toLowerCase().trim();

    if (raw.includes('gujarat') || raw.includes('ગુજરાત') || raw.includes('state')) return 'gujarat';
    if (raw.includes('national') || raw.includes('bharat') || raw.includes('ભારત') || raw.includes('india')) return 'national';
    if (raw.includes('world') || raw.includes('vishva') || raw.includes('વિશ્વ') || raw.includes('international')) return 'world';
    if (raw.includes('politic') || raw.includes('rajniti') || raw.includes('રાજનીતિ')) return 'politics';
    if (raw.includes('crime') || raw.includes('ક્રાઇમ') || raw.includes('ક્રાઈમ')) return 'crime';
    if (raw.includes('entertain') || raw.includes('manoranjan') || raw.includes('મનોરંજન') || raw.includes('bollywood') || raw.includes('cinema')) return 'entertainment';
    if (raw.includes('sport') || raw.includes('cricket') || raw.includes('રમત') || raw.includes('રમતો')) return 'sports';
    if (raw.includes('tech') || raw.includes('ટેક') || raw.includes('ટેક્નોલોજી')) return 'technology';
    if (raw.includes('business') || raw.includes('વેપાર') || raw.includes('બિઝનેસ') || raw.includes('માર્કેટ')) return 'business';
    if (raw.includes('health') || raw.includes('lifestyle') || raw.includes('હેલ્થ') || raw.includes('લાઈફસ્ટાઈલ')) return 'health';
    if (raw.includes('fact') || raw.includes('ફેક્ટ')) return 'fact-check';
    return raw || 'news';
  }, []);

  // Mixed articles from different categories specifically for the Video tab news section
  const mixedCategoryArticles = useMemo(() => {
    if (!mixedNews || mixedNews.length === 0) {
      return [];
    }

    const currentCatNorm = getArticleNormCat({ categorySlug: normSlug });
    const seenIds = new Set<string>();
    const otherCatPool: Article[] = [];
    const sameCatPool: Article[] = [];

    for (const art of mixedNews) {
      if (!art || !art.id || seenIds.has(art.id)) continue;
      seenIds.add(art.id);

      const artCatNorm = getArticleNormCat(art);
      if (artCatNorm !== currentCatNorm) {
        otherCatPool.push(art);
      } else {
        sameCatPool.push(art);
      }
    }

    // Group other-category articles by category for round-robin interleaving
    const categoryBuckets: Record<string, Article[]> = {};
    for (const art of otherCatPool) {
      const cat = getArticleNormCat(art);
      if (!categoryBuckets[cat]) categoryBuckets[cat] = [];
      categoryBuckets[cat].push(art);
    }

    const bucketKeys = Object.keys(categoryBuckets);
    const interleaved: Article[] = [];
    let hasMore = true;
    let round = 0;

    while (hasMore && interleaved.length < 36) {
      hasMore = false;
      for (const catKey of bucketKeys) {
        const bucket = categoryBuckets[catKey];
        if (bucket && round < bucket.length) {
          interleaved.push(bucket[round]);
          hasMore = true;
          if (interleaved.length >= 36) break;
        }
      }
      round++;
    }

    // Fill remaining up to 36 articles from otherCatPool and then sameCatPool if needed
    const usedInterleavedIds = new Set(interleaved.map((a) => a.id));
    for (const art of otherCatPool) {
      if (interleaved.length >= 36) break;
      if (!usedInterleavedIds.has(art.id)) {
        interleaved.push(art);
        usedInterleavedIds.add(art.id);
      }
    }

    for (const art of sameCatPool) {
      if (interleaved.length >= 36) break;
      if (!usedInterleavedIds.has(art.id)) {
        interleaved.push(art);
        usedInterleavedIds.add(art.id);
      }
    }

    return interleaved;
  }, [mixedNews, normSlug, getArticleNormCat]);

  // Items for category news articles (no YouTube videos injected)
  const allSectionItems = useMemo(() => {
    return sortArticlesByLatest(currentArticles || []);
  }, [currentArticles]);

  // Dynamic Section Items (Hero + Sub-Hero + Top Stories) driven by activeTab
  const currentSectionItems = useMemo<any[]>(() => {
    if (activeTab === 'video') {
      return categoryVideoItems;
    }
    // Default 'all', 'paired', and 'latest': Pure category news articles
    return allSectionItems;
  }, [activeTab, categoryVideoItems, allSectionItems]);

  // Section Hero Article / Item
  const heroArticle: any = currentSectionItems[0] || currentArticles[0];

  // Section Sub-Hero Small Article
  const subHeroArticle: any = currentSectionItems[1];

  // Section 4 Top Stories (Items 3 to 6)
  const topStories = useMemo<any[]>(() => {
    const sliced = currentSectionItems.slice(2, 6);
    if (sliced.length >= 4) return sliced;

    const usedIds = new Set([heroArticle?.id, subHeroArticle?.id, ...sliced.map((a: any) => a.id)].filter(Boolean));
    const pool = currentSectionItems.length > 2 ? currentSectionItems : sliced;
    const fallbacks = pool.filter((a: any) => !usedIds.has(a.id));
    return [...sliced, ...fallbacks].slice(0, 4);
  }, [currentSectionItems, heroArticle, subHeroArticle]);

  const topStoriesFirstThree = useMemo<any[]>(() => topStories.slice(0, 3), [topStories]);
  const fourthStory: any = topStories[3];

  const topStoriesIds = useMemo(() => new Set([heroArticle?.id, subHeroArticle?.id, ...topStories.map((a: any) => a.id)].filter(Boolean)), [heroArticle, subHeroArticle, topStories]);

  // Remaining articles for Popular News grid (steady view)
  const popularArticles = useMemo<any[]>(() => {
    if (activeTab === 'video') {
      return mixedCategoryArticles;
    }
    return currentSectionItems.filter((art) => !topStoriesIds.has(art.id));
  }, [activeTab, mixedCategoryArticles, currentSectionItems, topStoriesIds]);

  // Fast background prefetch of adjacent pages for instant 0ms clicking
  useEffect(() => {
    const targetSlug = isPairedTab ? pairedCategory!.slug : resolvedSlug;
    const prefetch = (p: number) => {
      if (p >= 1 && p <= activeTotalPages) {
        const cacheKey = `${targetSlug}:${p}`;
        if (!pageCacheRef.current[cacheKey]) {
          getPublicArticles(targetSlug === 'trending'
            ? { isTrending: true, page: p, limit: 42 }
            : { categorySlug: targetSlug, page: p, limit: 42 })
            .then((res) => {
              if (res?.articles?.length) {
                const sorted = sortArticlesByLatest(res.articles as any[]);
                const tPages = res.totalPages || activeTotalPages;
                pageCacheRef.current[cacheKey] = { articles: sorted, totalPages: tPages };
              }
            })
            .catch(() => { });
        }
      }
    };
    prefetch(activePage + 1);
    if (activePage > 1) prefetch(activePage - 1);
  }, [isPairedTab, pairedCategory, resolvedSlug, activePage, activeTotalPages]);

  const handlePageChange = useCallback(async (page: number) => {
    const isPaired = activeTab === 'paired' && Boolean(pairedCategory?.slug);
    const targetSlug = isPaired ? pairedCategory!.slug : resolvedSlug;
    const curActivePage = isPaired ? pairedPage : mainPage;
    const curActiveTotalPages = isPaired ? pairedTotalPages : mainTotalPages;

    if (page === curActivePage || page < 1 || page > curActiveTotalPages || pageLoading) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const cacheKey = `${targetSlug}:${page}`;

    // 1. Instant switch if page is cached (0ms delay)
    if (pageCacheRef.current[cacheKey]) {
      const cached = pageCacheRef.current[cacheKey];
      if (isPaired) {
        setPairedArticles(cached.articles);
        setPairedPage(page);
        if (cached.totalPages) setPairedTotalPages(cached.totalPages);
      } else {
        setMainArticles(cached.articles);
        setMainPage(page);
        if (cached.totalPages) setMainTotalPages(cached.totalPages);
      }
      setHasLoadedMore(true);
      setVisibleCount(9999);
      const url = page > 1 ? `/category/${slug}?page=${page}` : `/category/${slug}`;
      window.history.pushState({}, '', url);
      return;
    }

    // 2. Otherwise fetch from API with fast loading indicator
    setPageLoading(true);
    try {
      const res = await getPublicArticles(targetSlug === 'trending'
        ? { isTrending: true, page, limit: 42 }
        : { categorySlug: targetSlug, page, limit: 42 });
      const fetched = sortArticlesByLatest(res?.articles || []);
      const tPages = res?.totalPages || curActiveTotalPages;
      pageCacheRef.current[cacheKey] = { articles: fetched, totalPages: tPages };

      if (isPaired) {
        setPairedArticles(fetched);
        setPairedPage(page);
        if (tPages) setPairedTotalPages(tPages);
      } else {
        setMainArticles(fetched);
        setMainPage(page);
        if (tPages) setMainTotalPages(tPages);
      }
      setHasLoadedMore(true);
      setVisibleCount(9999);
      const url = page > 1 ? `/category/${slug}?page=${page}` : `/category/${slug}`;
      window.history.pushState({}, '', url);
    } catch {
      // silent fail — keep current articles visible
    } finally {
      setPageLoading(false);
    }
  }, [activeTab, pairedCategory, resolvedSlug, pairedPage, mainPage, pairedTotalPages, mainTotalPages, pageLoading, slug]);

  const handleTabClick = useCallback((tabId: FilterTab) => {
    if (activeTab === tabId) return;
    setActiveTab(tabId);
    setPlayingVideoId(null);

    if (tabId === 'paired') {
      // Switched to paired category tab (e.g. World on Gujarat) -> reset to page 1
      setPairedPage(1);
      setHasLoadedMore(true);
      setVisibleCount(9999);
      const cacheKey = `${pairedCategory?.slug}:1`;
      if (pageCacheRef.current[cacheKey]) {
        setPairedArticles(pageCacheRef.current[cacheKey].articles);
        setPairedTotalPages(pageCacheRef.current[cacheKey].totalPages);
      } else if (pairedCategory?.slug) {
        setPairedLoading(true);
        getPublicArticles({ categorySlug: pairedCategory.slug, page: 1, limit: 42 })
          .then((res) => {
            const fetched = sortArticlesByLatest(res?.articles || []);
            const tPages = res?.totalPages || 1;
            pageCacheRef.current[cacheKey] = { articles: fetched, totalPages: tPages };
            setPairedArticles(fetched);
            setPairedTotalPages(tPages);
          })
          .catch(() => { })
          .finally(() => setPairedLoading(false));
      }
      window.history.pushState({}, '', `/category/${slug}`);
    } else if (tabId === 'all') {
      // Switched back to main category tab (e.g. Gujarat) -> reset to page 1
      setMainPage(1);
      setHasLoadedMore(false);
      setVisibleCount(12);
      const cacheKey = `${resolvedSlug}:1`;
      if (pageCacheRef.current[cacheKey]) {
        setMainArticles(pageCacheRef.current[cacheKey].articles);
        setMainTotalPages(pageCacheRef.current[cacheKey].totalPages);
      } else if (currentPage === 1 && articles?.length) {
        setMainArticles(articles);
        setMainTotalPages(totalPages);
      } else {
        getPublicArticles(resolvedSlug === 'trending'
          ? { isTrending: true, page: 1, limit: 42 }
          : { categorySlug: resolvedSlug, page: 1, limit: 42 }
        ).then((res) => {
          if (res?.articles?.length) {
            const fetched = sortArticlesByLatest(res.articles);
            const tPages = res.totalPages || totalPages;
            pageCacheRef.current[cacheKey] = { articles: fetched, totalPages: tPages };
            setMainArticles(fetched);
            setMainTotalPages(tPages);
          }
        }).catch(() => { });
      }
      window.history.pushState({}, '', `/category/${slug}`);
    } else if (tabId === 'latest') {
      setHasLoadedMore(true);
      setVisibleCount(9999);
    } else if (tabId === 'video') {
      setHasLoadedMore(false);
      setVisibleCount(12);
      if (!mixedNews || mixedNews.length === 0) {
        getPublicArticles({ page: 1, limit: 48, sort: 'latest' })
          .then((res) => {
            if (res?.articles?.length) {
              setMixedNews(sortArticlesByLatest(res.articles));
            }
          })
          .catch(() => { });
      }
    }
  }, [activeTab, pairedCategory, resolvedSlug, slug, currentPage, articles, totalPages, mixedNews]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get('page') || '1', 10);
      const isPaired = activeTab === 'paired' && Boolean(pairedCategory?.slug);
      const curActivePage = isPaired ? pairedPage : mainPage;
      if (p !== curActivePage) {
        handlePageChange(p);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeTab, pairedCategory, pairedPage, mainPage, handlePageChange]);

  // Compute display articles for the grid
  const displayArticles = useMemo<any[]>(() => {
    return popularArticles;
  }, [popularArticles]);

  /* 3 Filter tabs: Badhu, Paired Category (or Latest fallback), Video */
  const tabs = useMemo(() => {
    const list: { id: FilterTab; gu: string; hi: string; en: string }[] = [
      { id: 'all', gu: 'બધું', hi: 'सभी', en: 'All' },
    ];

    if (pairedCategory) {
      list.push({
        id: 'paired',
        gu: pairedCategory.gu,
        hi: pairedCategory.hi,
        en: pairedCategory.name,
      });
    } else {
      list.push({
        id: 'latest',
        gu: 'લેટેસ્ટ સમાચાર',
        hi: 'તાઝા સમાચાર',
        en: 'Latest',
      });
    }

    list.push({ id: 'video', gu: 'વીડિયો', hi: 'वीडियो', en: 'Video' });
    return list;
  }, [pairedCategory]);

  if (!heroArticle && videos.length === 0) {
    if (pageLoading || (activeTab === 'paired' && pairedLoading)) {
      return (
        <div className="mx-auto max-w-screen-xl px-4 py-24 flex justify-center items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
            <span className="text-sm font-bold text-muted-foreground">
              {getLocalized(language, { en: 'Loading...', gu: 'લોડ થઈ રહ્યું છે...', hi: 'लोड हो रहा है...' })}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 text-center text-muted-foreground">
        {getLocalized(language, { en: 'No stories found.', gu: 'કોઈ સમાચાર મળ્યા નહીં.', hi: 'कोई खबर नहीं मिली.' })}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Search Engine Optimization Headings (Crawlable by Googlebot / Bingbot, invisible to users so design remains untouched) */}
      {customSeo && (customSeo.h1 || customSeo.h2) && (
        <div
          className="sr-only"
          aria-hidden="false"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {customSeo.h1 && <h1>{customSeo.h1}</h1>}
          {customSeo.h2 && <h2>{customSeo.h2}</h2>}
        </div>
      )}
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-2 md:pb-4">

        {/* ── TOP ROW: Category name ─────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <div className="flex items-center gap-3">
            {customSeo?.h1 ? (
              <h2 className="flex items-center gap-0 select-none leading-none">
                <span className="inline-block w-1.5 self-stretch rounded-sm bg-[#B3121B] mr-2.5 my-0.5" style={{ minHeight: '1.4em' }} aria-hidden="true" />
                <span className="text-[26px] sm:text-[23px] md:text-[21px] font-black tracking-tight text-foreground">
                  {categoryName}
                </span>
              </h2>
            ) : (
              <h1 className="flex items-center gap-0 select-none leading-none">
                <span className="inline-block w-1.5 self-stretch rounded-sm bg-[#B3121B] mr-2.5 my-0.5" style={{ minHeight: '1.4em' }} aria-hidden="true" />
                <span className="text-[26px] sm:text-[23px] md:text-[21px] font-black tracking-tight text-foreground">
                  {categoryName}
                </span>
              </h1>
            )}
          </div>

        </div>

        {/* ── FILTER TABS (3 Options: Badhu, Taja Samachar, Video) ────── */}
        <div className="flex gap-2 flex-wrap mb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-black transition cursor-pointer ${activeTab === tab.id
                ? 'bg-accent text-white font-black shadow-sm'
                : 'border border-border bg-card text-foreground hover:border-accent hover:text-accent font-semibold'
                }`}
            >
              {getLocalized(language, { en: tab.en, gu: tab.gu, hi: tab.hi })}
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT + SIDEBAR ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── LEFT: Hero + Top Stories (Controlled by activeTab) ── */}
          <div className={`grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-x-8 gap-y-0 min-w-0 transition-opacity duration-200 ${pageLoading || (activeTab === 'paired' && pairedLoading && pairedArticles.length === 0) ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {/* Row 1, Col 1: Main Big Hero Article / Video Card */}
            <div className="order-1 md:col-start-1 md:row-start-1 flex flex-col justify-start pb-4">
              {heroArticle && (
                <div>
                  {activeTab === 'video' || isVideoItem(heroArticle) ? (
                    <div className="relative aspect-[16/10] md:aspect-video w-full overflow-hidden rounded-sm bg-black shadow-sm mb-3">
                      <a
                        href={getArticleYouTubeUrl(heroArticle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block w-full h-full cursor-pointer group"
                      >
                        <ArticleMedia
                          src={heroArticle.image || (heroArticle as any).thumbnail || (heroArticle.videoId ? `https://img.youtube.com/vi/${heroArticle.videoId}/hqdefault.jpg` : undefined)}
                          alt={getArticleTitle(heroArticle, language)}
                          className="transition-transform duration-500"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition">
                          <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                            <Play className="w-7 h-7 fill-current ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                          <VideoIcon className="w-3 h-3 text-red-500" /> VIDEO
                        </span>
                      </a>
                    </div>
                  ) : (
                    <Link href={heroArticle.slug ? `/news/${heroArticle.slug}` : '#'} className="group block">
                      <div className="relative aspect-[16/10] md:aspect-video w-full overflow-hidden rounded-sm bg-muted shadow-sm">
                        <ArticleMedia
                          src={heroArticle.image || (heroArticle as any).featuredImage}
                          alt={getArticleTitle(heroArticle, language)}
                          className="transition-transform duration-500"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </div>
                    </Link>
                  )}

                  {activeTab === 'video' || isVideoItem(heroArticle) ? (
                    <a
                      href={getArticleYouTubeUrl(heroArticle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block mt-3"
                    >
                      <span className="text-xs font-black uppercase tracking-wide text-accent flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current text-red-600" />
                        {getArticleLocation(heroArticle)}
                      </span>
                      <h2 className="mt-1 text-[21.5px] md:text-[23.5px] font-black leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        <AutoArticleTitle article={heroArticle} language={language} />
                      </h2>
                    </a>
                  ) : (
                    <Link href={heroArticle.slug ? `/news/${heroArticle.slug}` : '#'} className="group block mt-3">
                      <span className="text-xs font-black uppercase tracking-wide text-accent">
                        {getArticleLocation(heroArticle)}
                      </span>
                      <h2 className="mt-1 text-[21.5px] md:text-[23.5px] font-black leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        <AutoArticleTitle article={heroArticle} language={language} />
                      </h2>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Row 1, Col 2: Top Stories (Items 1-3) */}
            <div className="order-3 md:col-start-2 md:row-start-1 flex flex-col justify-start pb-0 md:pb-4 mt-4 md:mt-0">
              {/* Mobile (< md): Modern separated cards */}
              <div className="flex flex-col gap-3.5 md:hidden">
                {topStoriesFirstThree.map((art: any, idx: number) => (
                  <MobileCategoryArticleCard
                    key={art.id || idx}
                    article={art}
                    language={language}
                    defaultCategorySlug={currentActiveCatSlug}
                    defaultCategoryLabel={currentActiveCatLabel}
                    index={idx}
                    isVideo={activeTab === 'video' || isVideoItem(art)}
                  />
                ))}
              </div>

              {/* Desktop (>= md): UNTOUCHED */}
              <div className="hidden md:flex flex-1 flex-col justify-start divide-y divide-border">
                {topStories.slice(0, 3).map((art: any) => {
                  const isVid = activeTab === 'video' || isVideoItem(art);
                  const ytUrl = isVid ? getArticleYouTubeUrl(art) : '';
                  const cardBody = (
                    <>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-accent flex items-center gap-1">
                          {isVid && <Play className="w-2.5 h-2.5 fill-current text-red-600" />}
                          {getArticleLocation(art)}
                        </span>
                        <h3 className="mt-0.5 text-[14.5px] md:text-[15px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-3">
                          <AutoArticleTitle article={art} language={language} />
                        </h3>
                      </div>
                      <div className="relative w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm self-start">
                        <ArticleMedia
                          src={art.image || art.featuredImage || art.thumbnail}
                          alt={getArticleTitle(art, language)}
                          className="transition-transform duration-300"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                        {isVid && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-all">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow">
                              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  );

                  return isVid ? (
                    <a
                      key={art.id}
                      href={ytUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 py-2.5 first:pt-0"
                    >
                      {cardBody}
                    </a>
                  ) : (
                    <Link
                      key={art.id}
                      href={art.slug ? `/news/${art.slug}` : '#'}
                      className="group flex items-start gap-4 py-2.5 first:pt-0"
                    >
                      {cardBody}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Row 2, Col 1: Small Sub-Hero Article below Hero Article */}
            <div className={`order-2 md:col-start-1 md:row-start-2 md:-mt-12 ${subHeroArticle ? 'border-t border-border/60 md:border-0 md:pt-3.5 md:pb-2' : ''}`}>
              {subHeroArticle && (
                <>
                  {/* Mobile view (< md): Divya Bhaskar / Hero section style card */}
                  <div className="md:hidden">
                    <MobileCategoryArticleCard
                      article={subHeroArticle}
                      language={language}
                      defaultCategorySlug={currentActiveCatSlug}
                      defaultCategoryLabel={currentActiveCatLabel}
                      index={0}
                      isVideo={activeTab === 'video' || isVideoItem(subHeroArticle)}
                    />
                  </div>

                  {/* Desktop view (>= md) */}
                  {activeTab === 'video' || isVideoItem(subHeroArticle) ? (
                    <a
                      href={getArticleYouTubeUrl(subHeroArticle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:flex group items-start gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-accent flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-current text-red-600" />
                          {getArticleLocation(subHeroArticle)}
                        </span>
                        <h3 className="mt-0.5 text-[14.5px] md:text-[15px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-3">
                          <AutoArticleTitle article={subHeroArticle} language={language} />
                        </h3>
                      </div>
                      <div className="relative w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm self-start">
                        <ArticleMedia
                          src={subHeroArticle.image || (subHeroArticle as any).featuredImage || (subHeroArticle as any).thumbnail}
                          alt={getArticleTitle(subHeroArticle, language)}
                          className="transition-transform duration-300"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-all">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow">
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <Link href={subHeroArticle.slug ? `/news/${subHeroArticle.slug}` : '#'} className="hidden md:flex group items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-accent">
                          {getArticleLocation(subHeroArticle)}
                        </span>
                        <h3 className="mt-0.5 text-[14.5px] md:text-[15px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-3">
                          <AutoArticleTitle article={subHeroArticle} language={language} />
                        </h3>
                      </div>
                      <div className="relative w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm self-start">
                        <ArticleMedia
                          src={subHeroArticle.image || (subHeroArticle as any).featuredImage || (subHeroArticle as any).thumbnail}
                          alt={getArticleTitle(subHeroArticle, language)}
                          className="transition-transform duration-300"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Row 2, Col 2: Fourth Top Story (Aligned perfectly with Sub-Hero Article) */}
            <div className={`order-4 md:col-start-2 md:row-start-2 md:-mt-12 ${fourthStory ? 'border-t border-border/60 pt-3.5 pb-2 md:border-t md:border-border md:pt-3.5 md:pb-2' : ''}`}>
              {fourthStory && (
                <>
                  {/* Mobile view (< md): Divya Bhaskar / Hero section style card */}
                  <div className="md:hidden">
                    <MobileCategoryArticleCard
                      article={fourthStory}
                      language={language}
                      defaultCategorySlug={currentActiveCatSlug}
                      defaultCategoryLabel={currentActiveCatLabel}
                      index={3}
                      isVideo={activeTab === 'video' || isVideoItem(fourthStory)}
                    />
                  </div>
                  {activeTab === 'video' || isVideoItem(fourthStory) ? (
                    <a
                      href={getArticleYouTubeUrl(fourthStory)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:flex group items-start gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-accent flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-current text-red-600" />
                          {getArticleLocation(fourthStory)}
                        </span>
                        <h3 className="mt-0.5 text-[14.5px] md:text-[15px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-3">
                          <AutoArticleTitle article={fourthStory} language={language} />
                        </h3>
                      </div>
                      <div className="relative w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm self-start">
                        <ArticleMedia
                          src={fourthStory.image || fourthStory.featuredImage || fourthStory.thumbnail}
                          alt={getArticleTitle(fourthStory, language)}
                          className="transition-transform duration-300"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-all">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow">
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <Link href={fourthStory.slug ? `/news/${fourthStory.slug}` : '#'} className="hidden md:flex group items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-accent">
                          {getArticleLocation(fourthStory)}
                        </span>
                        <h3 className="mt-0.5 text-[14.5px] md:text-[15px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-3">
                          <AutoArticleTitle article={fourthStory} language={language} />
                        </h3>
                      </div>
                      <div className="relative w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm self-start">
                        <ArticleMedia
                          src={fourthStory.image || fourthStory.featuredImage || fourthStory.thumbnail}
                          alt={getArticleTitle(fourthStory, language)}
                          className="transition-transform duration-300"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Trending Stories (or Top 5 Rajniti / Politics stories on Trending page) */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-border">
              <span className="w-2 h-2 bg-accent rotate-45 shrink-0 inline-block" />
              <span className="text-sm font-black text-foreground">
                {normSlug === 'trending'
                  ? getLocalized(language, { en: 'Politics', gu: 'રાજનીતિ', hi: 'राजनीति' })
                  : getLocalized(language, { en: 'Trending Story', gu: 'ટ્રેન્ડિંગ સ્ટોરી', hi: 'ट्रेंडिंग स्टोरी' })}
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {(normSlug === 'trending' ? politicsStories : trendingStories).slice(0, 5).map((art: any, i: number) => (
                <Link key={art.id || i} href={`/news/${art.slug}`} className="group flex items-start gap-3 py-3 first:pt-1.5 last:pb-1.5">
                  <span
                    className="text-[28px] font-extrabold leading-none select-none w-8 shrink-0 text-center"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: 'transparent',
                      WebkitTextStroke: '1.5px var(--ink-3)',
                    }}
                  >
                    {language === 'gu' ? toGu(i + 1) : i + 1}
                  </span>
                  <p className="min-h-[4.125em] text-[14px] md:text-[14.5px] font-bold leading-snug text-foreground/90 group-hover:text-accent transition-colors line-clamp-3">
                    <AutoArticleTitle article={art} language={language} />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CATEGORY NEWS ARTICLES SECTION HEADER (Separates News from Videos above) */}
        {displayArticles.length > 0 && (
          <div className={`mt-7 md:mt-10 mb-4 md:mb-5 ${activeTab === 'video' ? 'pt-6 border-t-2 border-border/80' : 'pt-4 border-t border-border/40'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-1.5 self-stretch rounded-sm bg-[#B3121B] mr-1 my-0.5" style={{ minHeight: '1.2em' }} aria-hidden="true" />
                <h2 className="text-[20px] sm:text-[22px] md:text-[23px] font-black tracking-tight text-foreground flex items-center flex-wrap gap-2">
                  <span>
                    {activeTab === 'video'
                      ? getLocalized(language, { gu: 'મુખ્ય સમાચાર', hi: 'प्रमुख समाचार', en: 'Top Stories' })
                      : getCategoryNewsTitle()}
                  </span>
                  {activeTab === 'video' && (
                    <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-[#B3121B] dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                      {getLocalized(language, { gu: 'વિવિધ કેટેગરીના સમાચાર', hi: 'विभिन्न कैटेगरी के समाचार', en: 'Across Categories' })}
                    </span>
                  )}
                </h2>
              </div>
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline-block">
                {activeTab === 'video'
                  ? getLocalized(language, {
                    gu: 'ગુજરાત, દેશ અને વિશ્વના મહત્વના સમાચારો',
                    hi: 'गुजरात, देश और दुनिया के महत्वपूर्ण समाचार',
                    en: 'Important updates across categories',
                  })
                  : getLocalized(language, { gu: 'બધા સમાચાર અને વિગતો', hi: 'सभी समाचार और विवरण', en: 'All News & Updates' })}
              </span>
            </div>
          </div>
        )}

        {/* POPULAR ARTICLES GRID */}
        <div className="mt-2" ref={articlesGridRef}>
          {/* Loading spinner during page fetch */}
          {(pageLoading || (activeTab === 'paired' && pairedLoading && pairedArticles.length === 0)) && (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
                <span className="text-sm font-bold text-muted-foreground">
                  {getLocalized(language, { en: 'Loading...', gu: 'લોડ થઈ રહ્યું છે...', hi: 'लोड हो रहा है...' })}
                </span>
              </div>
            </div>
          )}

          {!(pageLoading || (activeTab === 'paired' && pairedLoading && pairedArticles.length === 0)) && (
            <>
              {/* Mobile view (< md): Modern separated cards */}
              <div className="md:hidden flex flex-col gap-3.5">
                {displayArticles.slice(0, visibleCount).map((art, idx) => (
                  <MobileCategoryArticleCard
                    key={art.id || idx}
                    article={art}
                    language={language}
                    defaultCategorySlug={activeTab === 'video' ? undefined : currentActiveCatSlug}
                    defaultCategoryLabel={activeTab === 'video' ? undefined : currentActiveCatLabel}
                    index={idx}
                    isVideo={false}
                  />
                ))}
              </div>

              {/* Desktop view (>= md): 3-column clean news grid (actual articles, not videos) */}
              <div className="hidden md:grid md:grid-cols-3 gap-x-5 gap-y-8">
                {displayArticles.slice(0, visibleCount).map((article) => (
                  <NewsCard key={article.id} article={article} variant="flat" />
                ))}
              </div>

              {/* View More — page 1 only, before pagination appears */}
              {visibleCount < displayArticles.length && !hasLoadedMore && (
                <div className="mt-4 md:mt-6 mb-2 md:mb-0 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount(9999);
                      setHasLoadedMore(true);
                    }}
                    className="group inline-flex items-center gap-2.5 rounded-full border-2 border-accent px-9 py-3 text-accent hover:bg-accent hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
                  >
                    <span className="text-lg md:text-xl font-black tracking-wide leading-none">
                      {getLocalized(language, { en: 'View More', gu: 'વધુ જુઓ', hi: 'और देखें' })}
                    </span>
                    <ChevronDown className="w-5 h-5 transition-transform duration-200 group-hover:translate-y-0.5 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* Pagination — shown after "View More" or on page 2+ */}
              {activeTab !== 'video' && hasLoadedMore && activeTotalPages > 1 && (
                <div className="mt-4 md:mt-8 mb-2 md:mb-0 flex items-center justify-center gap-1.5 flex-wrap">
                  {/* Prev */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(activePage - 1)}
                    disabled={activePage <= 1 || pageLoading}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border font-bold text-sm transition-all duration-150 ${activePage <= 1
                      ? 'border-border/40 text-muted-foreground/40 cursor-not-allowed'
                      : 'border-border bg-card hover:border-accent hover:text-accent hover:bg-accent/5 cursor-pointer shadow-sm active:scale-95'
                      }`}
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: activeTotalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (activeTotalPages <= 7) return true;
                      if (p === 1 || p === activeTotalPages) return true;
                      if (Math.abs(p - activePage) <= 2) return true;
                      return false;
                    })
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm font-bold select-none">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handlePageChange(item as number)}
                          disabled={pageLoading}
                          className={`flex items-center justify-center w-9 h-9 rounded-full border text-sm font-black transition-all duration-150 ${item === activePage
                            ? 'bg-accent border-accent text-white shadow-sm'
                            : 'border-border bg-card hover:border-accent hover:text-accent hover:bg-accent/5 cursor-pointer shadow-sm active:scale-95'
                            }`}
                        >
                          {language === 'gu' ? toGu(item as number) : item}
                        </button>
                      )
                    )}

                  {/* Next */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(activePage + 1)}
                    disabled={activePage >= activeTotalPages || pageLoading}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border font-bold text-sm transition-all duration-150 ${activePage >= activeTotalPages
                      ? 'border-border/40 text-muted-foreground/40 cursor-not-allowed'
                      : 'border-border bg-card hover:border-accent hover:text-accent hover:bg-accent/5 cursor-pointer shadow-sm active:scale-95'
                      }`}
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>



        {/* ── AE PAN VACHO: Also Read (24 Articles: 12 Crime + 12 Fact-Check) ─────── */}
        {alsoReadArticles.length > 0 && (
          <div className="mt-4 md:mt-8 border-t border-border pt-3 md:pt-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="section-heading-badge bg-[#B3121B] text-white px-6 sm:px-7 py-2.5 sm:py-3 text-base sm:text-lg md:text-[20px] font-black rounded-xl select-none leading-none tracking-wide shadow-lg">
                {getLocalized(language, { en: 'Also Read', gu: 'આ પણ વાંચો', hi: 'यह भी पढ़ें' })}
              </span>
            </div>

            {/* Mobile view (< md): Modern separated cards */}
            <div className="md:hidden flex flex-col gap-3.5">
              {alsoReadArticles.map((article: any, idx: number) => {
                const fallbackImg = FALLBACK_NEWS_IMAGES[idx % FALLBACK_NEWS_IMAGES.length];
                return (
                  <MobileCategoryArticleCard
                    key={article.id || idx}
                    article={article}
                    language={language}
                    fallbackImage={fallbackImg}
                    defaultCategorySlug={article.categorySlug || 'news'}
                    defaultCategoryLabel={article.categoryGu || article.category}
                    index={idx}
                  />
                );
              })}
            </div>

            {/* Desktop view (>= md): 3-column grid with date */}
            <div className="hidden md:grid md:grid-cols-3 gap-x-5 gap-y-6">
              {alsoReadArticles.map((article: any, idx: number) => {
                const artTitle = language === 'gu'
                  ? (article.titleGu || article.title)
                  : language === 'hi'
                    ? (article.titleHi || article.title)
                    : article.title;
                const artCategory =
                  article.customCategoryLabel ||
                  (language === 'gu'
                    ? (article.categoryGu || article.category)
                    : language === 'hi'
                      ? (article.categoryHi || article.category)
                      : article.category);
                const fallbackImg = FALLBACK_NEWS_IMAGES[idx % FALLBACK_NEWS_IMAGES.length];
                const artImg = article.image || article.featuredImage || article.thumbnail || fallbackImg;

                return (
                  <Link key={article.id || idx} href={`/news/${article.slug}`} className="group flex flex-col">
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '6px', background: '#e5e7eb' }}>
                      <img
                        src={artImg}
                        alt={artTitle}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] font-black text-accent uppercase tracking-wider mt-2">
                      <AutoTranslateString text={artCategory} language={language} />
                    </span>
                    <h4 className="text-[14px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2 mt-0.5">
                      <AutoArticleTitle article={article} language={language} />
                    </h4>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PHOTO GALLERY (8 Photos with Text Inside, Red Border matching user design) ── */}
        {galleryPhotos.length > 0 && (
          <div className="mt-4 md:mt-8 border-t border-border pt-3 md:pt-6 pb-1 md:pb-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="section-heading-badge bg-[#B3121B] text-white px-4 py-1.5 text-sm md:text-base font-black rounded-lg select-none leading-none tracking-tight">
                  {getLocalized(language, { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' })}
                </span>
              </div>
              {hasMoreGalleryPhotos && (
                <button
                  type="button"
                  onClick={loadMoreGalleryPhotos}
                  disabled={loadingMoreGalleryPhotos}
                  className="inline-flex items-center gap-1 text-base md:text-lg font-black tracking-wide leading-none text-accent hover:underline disabled:opacity-60"
                >
                  {loadingMoreGalleryPhotos
                    ? getLocalized(language, { en: 'Loading...', gu: 'લોડ થઈ રહ્યું છે...', hi: 'लोड हो रहा है...' })
                    : getLocalized(language, { en: 'View More', gu: 'વધુ જુઓ', hi: 'और देखें' })}
                  {!loadingMoreGalleryPhotos && <ChevronRight className="h-4 w-4" />}
                </button>
              )}
            </div>

            {/* Mobile view (< md): Photo on top, heading below */}
            <div className="md:hidden flex flex-col gap-4">
              {galleryPhotos.map((photo: any, idx: number) => {
                const photoTitle = language === 'gu'
                  ? (photo.captionGu || photo.caption || photo.titleGu || photo.title || photo.alt || '')
                  : language === 'hi'
                    ? (photo.captionHi || (photo.caption && /[\u0900-\u097F]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.titleHi || photo.title || photo.alt || '')
                    : (photo.captionEn || (photo.caption && !/[\u0A80-\u0AFF]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.title || photo.alt || '');
                const fallbackImg = FALLBACK_GALLERY_IMAGES[idx % FALLBACK_GALLERY_IMAGES.length];
                const photoSrc = photo.src || photo.coverImage || photo.image || photo.url || photo.thumbnail || fallbackImg;
                const photoCount = Array.isArray(photo.images) && photo.images.length > 1
                  ? photo.images.length
                  : (photo.imageCount && photo.imageCount > 1 ? photo.imageCount : 0);

                return (
                  <Link
                    key={photo.id || idx}
                    href={`/photos/${photo.id || ''}`}
                    className="group relative flex flex-col w-full overflow-hidden rounded-2xl bg-card dark:bg-[#161822] border border-border/80 dark:border-white/[0.08] shadow-md hover:shadow-xl transition-all duration-300 hover:border-[#B3121B]/40 active:scale-[0.99]"
                  >
                    {/* Top Section: Photo */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                      <img
                        src={photoSrc}
                        alt={typeof photoTitle === 'string' ? photoTitle : 'Gallery'}
                        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                        style={{ objectPosition: 'top center' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                        loading="lazy"
                      />

                      {/* Top photo count badge */}
                      {photoCount > 1 && (
                        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-black text-white shadow-md border border-white/20">
                            <Camera className="w-3 h-3 text-red-400" />
                            <span>{photoCount}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Title below photo */}
                    <div className="p-3 sm:p-3.5 flex flex-col justify-center flex-1 min-w-0 bg-card dark:bg-[#161822]">
                      <p className="text-foreground group-hover:text-[#B3121B] text-[15px] sm:text-[16px] font-extrabold leading-snug line-clamp-2 transition-colors cursor-pointer">
                        <AutoTranslateString text={photoTitle} language={language as any} />
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop view (>= md): 4-column photo grid with photo on top and title below */}
            <div className="hidden md:grid sm:grid-cols-4 gap-4 sm:gap-5">
              {galleryPhotos.map((photo: any, idx: number) => {
                const photoTitle = language === 'gu'
                  ? (photo.captionGu || photo.caption || photo.titleGu || photo.title || photo.alt || '')
                  : language === 'hi'
                    ? (photo.captionHi || (photo.caption && /[\u0900-\u097F]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.titleHi || photo.title || photo.alt || '')
                    : (photo.captionEn || (photo.caption && !/[\u0A80-\u0AFF]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.title || photo.alt || '');
                const fallbackImg = FALLBACK_GALLERY_IMAGES[idx % FALLBACK_GALLERY_IMAGES.length];
                const photoSrc = photo.src || photo.coverImage || photo.image || photo.url || photo.thumbnail || fallbackImg;
                const photoCount = Array.isArray(photo.images) && photo.images.length > 1
                  ? photo.images.length
                  : (photo.imageCount && photo.imageCount > 1 ? photo.imageCount : 0);

                return (
                  <Link
                    key={photo.id || idx}
                    href={`/photos/${photo.id || ''}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 dark:border-white/[0.08] hover:border-[#B3121B]/40 bg-card dark:bg-[#161822] shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Top Section: Photo */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                      <img
                        src={photoSrc}
                        alt={typeof photoTitle === 'string' ? photoTitle : 'Gallery'}
                        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                        style={{ objectPosition: 'top center' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                        loading="lazy"
                      />

                      {/* Top photo count badge */}
                      {photoCount > 1 && (
                        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-black text-white shadow-md border border-white/20">
                            <Camera className="w-3 h-3 text-red-400" />
                            <span>{photoCount}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Title below photo */}
                    <div className="p-3 sm:p-3.5 flex flex-col justify-center flex-1 min-w-0 bg-card dark:bg-[#161822]">
                      <p className="text-foreground group-hover:text-[#B3121B] text-[13.5px] sm:text-[14.5px] font-extrabold leading-snug line-clamp-2 transition-colors cursor-pointer">
                        <AutoTranslateString text={photoTitle} language={language as any} />
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
