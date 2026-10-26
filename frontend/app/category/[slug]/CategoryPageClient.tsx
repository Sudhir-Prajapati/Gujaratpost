'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Play, Video as VideoIcon, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { Article } from '@/types';
import { useApp } from '@/components/AppProvider';
import {
  getLocalized,
  getArticleTitle,
  getCategoryLabel,
  formatViews,
  getPhotoCategoryBadge,
} from '@/data';
import { getCategoryColor, toGu, sortArticlesByLatest } from '@/lib/utils';
import { getPublicVideos, getPublicArticles, getPublicGallery } from '@/lib/api';
import { safeYouTubeId, youtubeEmbedUrl } from '@/lib/youtube';
import NewsCard from '@/components/ui/NewsCard';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { SocialIcon } from '@/components/ui/SocialLinks';
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { useIsApk } from '@/lib/useIsApk';
import ApkCategoryFeed from '@/components/apk/ApkCategoryFeed';

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

  // and in the crime show the bharat
  crime: { slug: 'national', name: 'Bharat', gu: 'ભારત', hi: 'भारत' },

  // adn in the helth tech
  health: { slug: 'technology', name: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },

  // adn in the manoranjan show the fact check

  // in the factcheck add the rajniti
  'fact-check': { slug: 'politics', name: 'Politics', gu: 'રાજનીતિ', hi: 'राजनीति' },
  factcheck: { slug: 'politics', name: 'Politics', gu: 'રાજનીતિ', hi: 'राजनीति' },

  // and in the tranding ad the fact check
  trending: { slug: 'fact-check', name: 'Fact Check', gu: 'ફેક્ટ ચેક', hi: 'फैक्ट चेक' },
  tranding: { slug: 'fact-check', name: 'Fact Check', gu: 'ફેક્ટ ચેક', hi: 'फैक्ट चेक' },
};

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

/* ── Reusable Mobile Category Article Card (Identical to Hero Section Mobile Box) ── */
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
  if (!article) return null;

  const isVideoCard = isVideo || isVideoItem(article);
  const ytUrl = isVideoCard ? getArticleYouTubeUrl(article) : '';

  const rawTitle =
    (language === 'hi'
      ? article.titleHi
      : language === 'gu'
      ? (article.titleGu || article.title)
      : (article.titleEn || article.title)) ||
    article.title ||
    '';

  const colonIdx = rawTitle.indexOf(':');
  const hasPrefix = colonIdx > 3 && colonIdx <= 48;
  const prefixText = hasPrefix ? rawTitle.substring(0, colonIdx + 1) : '';
  const restText = hasPrefix ? rawTitle.substring(colonIdx + 1).trim() : '';

  const catLabel =
    (isVideoCard && defaultCategoryLabel)
      ? defaultCategoryLabel
      : (getCategoryLabel(article, language) ||
         defaultCategoryLabel ||
         (language === 'gu' ? 'સમાચાર' : language === 'hi' ? 'समाचार' : 'News'));

  const catSlug =
    article.category?.slug ||
    article.categorySlug ||
    (typeof article.category === 'string' && article.category.length < 30
      ? article.category.toLowerCase().replace(/\s+/g, '-')
      : '') ||
    defaultCategorySlug ||
    'news';

  const imgSrc =
    article.image ||
    article.featuredImage ||
    article.thumbnail ||
    fallbackImage ||
    '/assets/gujarat-post-logo.png';

  const href = isVideoCard ? ytUrl : (article.slug ? `/news/${article.slug}` : '#');

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const title = getArticleTitle(article, language);
    const url = isVideoCard ? ytUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${href}`;
    const text = `${title}\n\n${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title, url, text }).catch(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const cardContent = (
    <>
      <div className="flex-1 min-w-0 pr-1">
        {isVideoCard && (
          <span className="text-[11px] font-black uppercase tracking-wide text-accent flex items-center gap-1 mb-1">
            <Play className="w-2.5 h-2.5 fill-current text-red-600" />
            <AutoTranslateString text={catLabel} language={language} />
          </span>
        )}
        <h3 className="text-[17px] sm:text-[18px] font-black leading-[1.38] text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
          {hasPrefix && language === 'gu' ? (
            <>
              <span
                className={
                  index % 2 === 0
                    ? 'text-[#0284c7] dark:text-[#38bdf8] font-black mr-1'
                    : 'text-[#d97706] dark:text-[#fbbf24] font-black mr-1'
                }
              >
                {prefixText}
              </span>
              <span>{restText}</span>
            </>
          ) : (
            <AutoArticleTitle article={article} language={language} />
          )}
        </h3>
      </div>

      <div className="relative aspect-[16/10] w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-lg border border-border/10 bg-muted">
        <ArticleMedia
          src={imgSrc}
          alt={rawTitle || ''}
          className="h-full w-full"
          style={{ objectFit: 'contain', objectPosition: 'center' }}
        />
        {isVideoCard && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow">
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="group flex flex-col py-3.5 first:pt-1.5 last:pb-1 min-w-0">
      {/* Top: Headline (left) + Thumbnail (right) */}
      {isVideoCard ? (
        <a
          href={ytUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-row items-start justify-between gap-3 min-w-0"
        >
          {cardContent}
        </a>
      ) : (
        <Link
          href={href}
          className="flex flex-row items-start justify-between gap-3 min-w-0"
        >
          {cardContent}
        </Link>
      )}

      {/* Bottom Row: Category Pill (Left) + WhatsApp Share Button (Right) */}
      <div className="flex items-center justify-between mt-3.5 pt-0.5">
        <Link
          href={`/category/${catSlug}`}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-muted/30 hover:bg-muted text-[12px] font-extrabold text-foreground/80 hover:text-foreground transition-colors shadow-2xs"
        >
          <span>{catLabel}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-muted-foreground hover:text-emerald-600 active:scale-95 transition-colors cursor-pointer select-none"
          aria-label="Share"
        >
          <SocialIcon platform="whatsapp" className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'શેર' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}

function WebCategoryPageClient({ articles, category, slug, resolvedSlug, trending, currentPage, totalPages }: Props) {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  // On page 2+: show all articles immediately; on page 1: start with 12 then load more
  const [visibleCount, setVisibleCount] = useState(currentPage > 1 ? 9999 : 12);
  // On page 2+: skip "View More" and show pagination right away
  const [hasLoadedMore, setHasLoadedMore] = useState(currentPage > 1);
  const articlesGridRef = useRef<HTMLDivElement>(null);

  // Client-side pagination — no SSR round-trip, instant updates
  const pageCacheRef = useRef<Record<number, Article[]>>({
    [currentPage]: articles || [],
  });
  const [pagedArticles, setPagedArticles] = useState<Article[]>([]);
  const [pagedPage, setPagedPage] = useState(currentPage);
  const [pagedTotalPages, setPagedTotalPages] = useState(totalPages);
  const [pageLoading, setPageLoading] = useState(false);

  // Active articles for the current page (updates dynamically when page changes)
  const currentArticles = useMemo(() => {
    if (pagedArticles && pagedArticles.length > 0) {
      return pagedArticles;
    }
    return articles || [];
  }, [pagedArticles, articles]);

  // Videos state for Video filter
  const [videos, setVideos] = useState<any[]>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Also Read: Crime & Fact Check articles
  const [crimeArticles, setCrimeArticles] = useState<any[]>([]);
  const [factCheckArticles, setFactCheckArticles] = useState<any[]>([]);
  const [trendingStories, setTrendingStories] = useState<Article[]>(trending || []);

  // Photo Gallery
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [galleryPage, setGalleryPage] = useState(3);
  const [hasMoreGalleryPhotos, setHasMoreGalleryPhotos] = useState(true);
  const [loadingMoreGalleryPhotos, setLoadingMoreGalleryPhotos] = useState(false);

  // Paired category configuration based on current category slug
  const normSlug = (resolvedSlug || slug || '').toLowerCase().trim();
  const usePublishDate = ['entertainment', 'entertainment-life-style', 'manoranjan'].includes(normSlug);
  const pairedCategory = CATEGORY_PAIRS[normSlug];

  // Articles for the paired category tab (e.g. World on Gujarat, Crime on Bharat)
  const [pairedArticles, setPairedArticles] = useState<Article[]>([]);
  const [pairedLoading, setPairedLoading] = useState(false);

  useEffect(() => {
    if (!pairedCategory?.slug) {
      setPairedArticles([]);
      return;
    }
    let isMounted = true;
    setPairedLoading(true);
    getPublicArticles({ categorySlug: pairedCategory.slug, page: 1, limit: 30 })
      .then((res) => {
        if (!isMounted) return;
        const fetched = sortArticlesByLatest(res?.articles || []);
        setPairedArticles(fetched);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setPairedLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [pairedCategory?.slug]);

  // Reset active tab to 'all' whenever category changes
  useEffect(() => {
    setActiveTab('all');
    setPlayingVideoId(null);
  }, [slug, resolvedSlug]);

  // Scroll page to top instantly whenever category page mounts or slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    pageCacheRef.current = { [currentPage]: articles || [] };
    setPagedArticles([]);
    setPagedPage(currentPage);
  }, [slug]);

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

  // Fetch Crime & Fact Check articles for "Also Read" section (12 Crime + 12 Fact Check = 24 articles)
  useEffect(() => {
    getPublicArticles({ categorySlug: 'crime', limit: 20 })
      .then((res) => { if (res?.articles) setCrimeArticles(res.articles); })
      .catch(() => {});
    getPublicArticles({ categorySlug: 'fact-check', limit: 20 })
      .then((res) => { if (res?.articles) setFactCheckArticles(res.articles); })
      .catch(() => {});
  }, []);

  // Load the sidebar after the main category feed has rendered.
  useEffect(() => {
    if (trendingStories.length > 0) return;
    let active = true;
    getPublicArticles({ isTrending: true, limit: 10 })
      .then((res) => {
        if (active && res?.articles) setTrendingStories(res.articles);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [trendingStories.length]);

  // Fetch Photo Gallery
  useEffect(() => {
    getPublicGallery({ page: 1, limit: 8 })
      .then((res) => {
        if (Array.isArray(res)) {
          setGalleryPhotos(res.slice(0, 8));
          setHasMoreGalleryPhotos(res.length >= 8);
        }
      })
      .catch(() => {});
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

  // Interleave Crime & Fact-Check articles for "Also Read" (24 articles total: 12 Crime + 12 Fact-Check)
  const alsoReadArticles = useMemo(() => {
    const combined: any[] = [];
    const maxLen = Math.max(crimeArticles.length, factCheckArticles.length);
    for (let i = 0; i < maxLen; i++) {
      if (crimeArticles[i]) combined.push(crimeArticles[i]);
      if (factCheckArticles[i]) combined.push(factCheckArticles[i]);
    }
    return combined.slice(0, 24);
  }, [crimeArticles, factCheckArticles]);

  // Get localized category name aligned exactly with header menu links
  const getCategoryTitleLocalized = () => {
    if (slug === 'other-cities' || slug === 'otherCities') {
      return getLocalized(language, { en: 'Other Cities', gu: 'અન્ય શહેરો', hi: 'अन्य शहर' });
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

  /* Get localized location */
  const getArticleLocation = (art: Article) => {
    if (activeTab === 'video') {
      return categoryName;
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
  const categoryVideoItems = useMemo(() => {
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

    // YouTube videos ONLY if title/description contains category title/slug (e.g. Surat / સુરત, Bharat / ભારત, etc.)
    const categoryMatchingYouTubeVideos = (videos || [])
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
    const otherYouTubeVideos = (videos || [])
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

    // 1. Top Section (Image 1): Exactly 6 real videos
    const allAvailableVideos = [...videoArticles, ...categoryMatchingYouTubeVideos, ...otherYouTubeVideos];
    const top6Videos = allAvailableVideos.slice(0, 6);
    const top6Ids = new Set(top6Videos.map((item) => item.id).filter(Boolean));

    // 2. Second Section (Image 2): That category's articles
    const categoryArticles = (currentArticles || [])
      .filter((art) => !top6Ids.has(art.id))
      .map((art: any) => ({
        ...art,
        category: art.category || categoryName,
        categoryGu: art.categoryGu || categoryName,
        categoryHi: art.categoryHi || categoryName,
        isVideoItem: true,
      }));

    return [...top6Videos, ...categoryArticles];
  }, [currentArticles, videos, category, slug, categoryName]);

  // Items for "બધું" (All) tab: Pure category news articles (no YouTube videos injected)
  const allSectionItems = useMemo(() => {
    return sortArticlesByLatest(currentArticles || []);
  }, [currentArticles]);

  // Dynamic Section Items (Hero + Sub-Hero + Top Stories) driven by activeTab
  const currentSectionItems = useMemo(() => {
    if (activeTab === 'paired') {
      return pairedArticles.length > 0 ? pairedArticles : (currentArticles || []);
    }

    if (activeTab === 'latest') {
      // Strictly latest uploaded articles sorted by time descending
      return sortArticlesByLatest(currentArticles || []);
    }

    if (activeTab === 'video') {
      return categoryVideoItems;
    }

    // Default 'all' (બધું): Pure category news articles
    return allSectionItems;
  }, [activeTab, pairedArticles, currentArticles, categoryVideoItems, allSectionItems]);

  // Section Hero Article / Item
  const heroArticle = currentSectionItems[0] || currentArticles[0];

  // Section Sub-Hero Small Article
  const subHeroArticle = currentSectionItems[1];

  // Section 4 Top Stories (Items 3 to 6)
  const topStories = useMemo(() => {
    const sliced = currentSectionItems.slice(2, 6);
    if (sliced.length >= 4) return sliced;

    const usedIds = new Set([heroArticle?.id, subHeroArticle?.id, ...sliced.map((a: any) => a.id)].filter(Boolean));
    const pool = currentSectionItems.length > 2 ? currentSectionItems : sliced;
    const fallbacks = pool.filter((a: any) => !usedIds.has(a.id));
    return [...sliced, ...fallbacks].slice(0, 4);
  }, [currentSectionItems, heroArticle, subHeroArticle]);

  const topStoriesFirstThree = useMemo(() => topStories.slice(0, 3), [topStories]);
  const fourthStory = topStories[3];

  const topStoriesIds = useMemo(() => new Set([heroArticle?.id, subHeroArticle?.id, ...topStories.map((a: any) => a.id)].filter(Boolean)), [heroArticle, subHeroArticle, topStories]);

  // Remaining articles for Popular News grid (steady view)
  const popularArticles = useMemo(() => {
    const baseList = (activeTab === 'paired' && pairedArticles.length > 0)
      ? pairedArticles
      : (activeTab === 'video' && categoryVideoItems.length > 0)
        ? categoryVideoItems
        : currentSectionItems;
    return baseList.filter((art) => !topStoriesIds.has(art.id));
  }, [activeTab, pairedArticles, categoryVideoItems, currentSectionItems, topStoriesIds]);

  // Fast background prefetch of adjacent pages for instant 0ms clicking
  useEffect(() => {
    const prefetch = (p: number) => {
      if (p >= 1 && p <= pagedTotalPages && !pageCacheRef.current[p]) {
        getPublicArticles(resolvedSlug === 'trending'
          ? { isTrending: true, page: p, limit: 40 }
          : { categorySlug: resolvedSlug, page: p, limit: 40 })
          .then((res) => {
            if (res?.articles?.length) {
              const sorted = sortArticlesByLatest(res.articles as any[]);
              pageCacheRef.current[p] = sorted;
            }
          })
          .catch(() => {});
      }
    };
    prefetch(pagedPage + 1);
    if (pagedPage > 1) prefetch(pagedPage - 1);
  }, [pagedPage, pagedTotalPages, resolvedSlug]);

  const handlePageChange = useCallback(async (page: number) => {
    if (page === pagedPage || pageLoading) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Instant switch if page is 1
    if (page === 1) {
      const p1 = pageCacheRef.current[1] || articles;
      setPagedArticles(p1);
      setPagedPage(1);
      setHasLoadedMore(true);
      setVisibleCount(9999);
      window.history.pushState({}, '', `/category/${slug}`);
      return;
    }

    // 2. Instant switch if page is cached (0ms delay)
    if (pageCacheRef.current[page]) {
      setPagedArticles(pageCacheRef.current[page]);
      setPagedPage(page);
      setHasLoadedMore(true);
      setVisibleCount(9999);
      window.history.pushState({}, '', `/category/${slug}?page=${page}`);
      return;
    }

    // 3. Otherwise fetch from API with fast loading indicator
    setPageLoading(true);
    try {
      const res = await getPublicArticles(resolvedSlug === 'trending'
        ? { isTrending: true, page, limit: 40 }
        : { categorySlug: resolvedSlug, page, limit: 40 });
      const fetched = sortArticlesByLatest(res?.articles || []);
      pageCacheRef.current[page] = fetched;
      setPagedArticles(fetched);
      setPagedPage(page);
      if (res?.totalPages) setPagedTotalPages(res.totalPages);
      setHasLoadedMore(true);
      setVisibleCount(9999);
      window.history.pushState({}, '', `/category/${slug}?page=${page}`);
    } catch {
      // silent fail — keep current articles visible
    } finally {
      setPageLoading(false);
    }
  }, [pagedPage, pageLoading, resolvedSlug, slug, articles]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = parseInt(params.get('page') || '1', 10);
      if (p !== pagedPage) {
        handlePageChange(p);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [pagedPage, handlePageChange]);

  // Compute display articles for the grid
  const displayArticles = useMemo(() => {
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
        gu: 'તાજા સમાચાર',
        hi: 'તાઝા સમાચાર',
        en: 'Latest',
      });
    }

    list.push({ id: 'video', gu: 'વીડિયો', hi: 'वीडियो', en: 'Video' });
    return list;
  }, [pairedCategory]);

  if (!heroArticle && videos.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 text-center text-muted-foreground">
        {getLocalized(language, { en: 'No stories found.', gu: 'કોઈ સમાચાર મળ્યા નહીં.', hi: 'कोई खबर नहीं मिली.' })}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-screen-xl px-4 py-2">

        {/* ── TOP ROW: Category name ─────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-0 select-none leading-none">
              <span className="inline-block w-1 self-stretch rounded-sm bg-[#B3121B] mr-2" style={{minHeight: '1.5em'}} aria-hidden="true" />
              <span className="text-[19px] md:text-[21px] font-black tracking-tight text-foreground">
                {categoryName}
              </span>
            </h1>
          </div>

        </div>

        {/* ── FILTER TABS (3 Options: Badhu, Taja Samachar, Video) ────── */}
        <div className="flex gap-2 flex-wrap mb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPlayingVideoId(null);
              }}
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
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
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
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
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
              {/* Mobile (< md): Divya Bhaskar / Hero section style list with divide-y */}
              <div className="flex flex-col divide-y divide-border/60 md:hidden">
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
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
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
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
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
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
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
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
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
                        style={{ objectFit: 'contain', objectPosition: 'center' }}
                        />
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Trending Stories */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-border">
              <span className="w-2 h-2 bg-accent rotate-45 shrink-0 inline-block" />
              <span className="text-sm font-black text-foreground">
                {normSlug === 'trending'
                  ? getLocalized(language, { en: 'Story', gu: 'સ્ટોરી', hi: 'स्टोरी' })
                  : getLocalized(language, { en: 'Trending Story', gu: 'ટ્રેન્ડિંગ સ્ટોરી', hi: 'ट्रेंडिंग स्टोरी' })}
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {trendingStories.slice(0, 5).map((art: any, i: number) => (
                <Link key={art.id} href={`/news/${art.slug}`} className="group flex items-start gap-3 py-3 first:pt-1.5 last:pb-1.5">
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

        {/* POPULAR ARTICLES GRID */}
        <div className="mt-6" ref={articlesGridRef}>
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
              {/* Mobile view (< md) */}
              <div className="md:hidden flex flex-col divide-y divide-border/60">
                {displayArticles.slice(0, visibleCount).map((art, idx) => (
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

              {/* Desktop view (>= md): 3-column grid */}
              <div className="hidden md:grid md:grid-cols-3 gap-x-5 gap-y-8">
                {displayArticles.slice(0, visibleCount).map((article) => {
                  const isVid = activeTab === 'video' || isVideoItem(article);
                  if (isVid) {
                    const ytUrl = getArticleYouTubeUrl(article);
                    return (
                      <a
                        key={article.id}
                        href={ytUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col cursor-pointer"
                      >
                        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted shadow-sm">
                          <ArticleMedia
                            src={article.image || (article as any).featuredImage || (article as any).thumbnail}
                            alt={getArticleTitle(article, language)}
                            className="transition-transform duration-300"
                          style={{ objectFit: 'contain', objectPosition: 'center' }}
                        />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-all">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90 text-white shadow group-hover:scale-110 transition-transform">
                              <Play className="h-5 w-5 fill-current ml-0.5" />
                            </span>
                          </div>
                          <span className="absolute top-2 right-2 bg-black/80 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                            <VideoIcon className="w-3 h-3 text-red-500" /> VIDEO
                          </span>
                        </div>
                        <div className="mt-2.5 flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wide text-accent flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current text-red-600" />
                            {getArticleLocation(article)}
                          </span>
                          <h3 className="mt-1 text-[15px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">
                            <AutoArticleTitle article={article} language={language} />
                          </h3>
                        </div>
                      </a>
                    );
                  }
                  return <NewsCard key={article.id} article={article} variant="flat" />;
                })}
              </div>

              {/* View More — page 1 only, before pagination appears */}
              {visibleCount < displayArticles.length && !hasLoadedMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount(9999);
                      setHasLoadedMore(true);
                    }}
                    className="group inline-flex items-center gap-2 rounded-full border-2 border-accent px-8 py-2.5 text-accent hover:bg-accent hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
                  >
                    <span className="text-base md:text-lg font-black tracking-wide leading-none">
                      {getLocalized(language, { en: 'View More', gu: 'વધુ જુઓ', hi: 'और देखें' })}
                    </span>
                    <ChevronDown className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-y-0.5 stroke-[2.5]" />
                  </button>
                </div>
              )}

              {/* Pagination — shown after "View More" or on page 2+ */}
              {hasLoadedMore && pagedTotalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5 flex-wrap">
                  {/* Prev */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagedPage - 1)}
                    disabled={pagedPage <= 1 || pageLoading}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border font-bold text-sm transition-all duration-150 ${
                      pagedPage <= 1
                        ? 'border-border/40 text-muted-foreground/40 cursor-not-allowed'
                        : 'border-border bg-card hover:border-accent hover:text-accent hover:bg-accent/5 cursor-pointer shadow-sm active:scale-95'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: pagedTotalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (pagedTotalPages <= 7) return true;
                      if (p === 1 || p === pagedTotalPages) return true;
                      if (Math.abs(p - pagedPage) <= 2) return true;
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
                          className={`flex items-center justify-center w-9 h-9 rounded-full border text-sm font-black transition-all duration-150 ${
                            item === pagedPage
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
                    onClick={() => handlePageChange(pagedPage + 1)}
                    disabled={pagedPage >= pagedTotalPages || pageLoading}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border font-bold text-sm transition-all duration-150 ${
                      pagedPage >= pagedTotalPages
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
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="section-heading-badge bg-[#B3121B] text-white px-4 py-1.5 text-sm md:text-base font-black rounded-lg select-none leading-none tracking-tight">
                {getLocalized(language, { en: 'Also Read', gu: 'આ પણ વાંચો', hi: 'यह भी पढ़ें' })}
              </span>
            </div>

            {/* Mobile view (< md): Single column hero section style list */}
            <div className="md:hidden flex flex-col divide-y divide-border/60">
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
                const artCategory = language === 'gu'
                  ? (article.categoryGu || article.category)
                  : language === 'hi'
                  ? (article.categoryHi || article.category)
                  : article.category;
                const fallbackImg = FALLBACK_NEWS_IMAGES[idx % FALLBACK_NEWS_IMAGES.length];
                const artImg = article.image || article.featuredImage || article.thumbnail || fallbackImg;

                return (
                  <Link key={article.id || idx} href={`/news/${article.slug}`} className="group flex flex-col">
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '6px', background: '#e5e7eb' }}>
                      <img
                        src={artImg}
                        alt={artTitle}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
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
          <div className="mt-8 border-t border-border pt-6">
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

            {/* Mobile view (< md): Full-width and full-height single cards like user reference image */}
            <div className="md:hidden flex flex-col gap-4">
              {galleryPhotos.map((photo: any, idx: number) => {
                const photoTitle = language === 'gu'
                  ? (photo.captionGu || photo.caption || photo.titleGu || photo.title || photo.alt || '')
                  : language === 'hi'
                  ? (photo.captionHi || (photo.caption && /[\u0900-\u097F]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.titleHi || photo.title || photo.alt || '')
                  : (photo.captionEn || (photo.caption && !/[\u0A80-\u0AFF]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.title || photo.alt || '');
                const photoCategory = getPhotoCategoryBadge(photo, language);
                const fallbackImg = FALLBACK_GALLERY_IMAGES[idx % FALLBACK_GALLERY_IMAGES.length];
                const photoSrc = photo.src || photo.coverImage || photo.image || photo.url || photo.thumbnail || fallbackImg;

                return (
                  <Link
                    key={photo.id || idx}
                    href={`/photos/${photo.id || ''}`}
                    className="group relative block w-full aspect-square overflow-hidden rounded-2xl bg-black shadow-md transition-all duration-300 active:scale-[0.99]"
                  >
                    <img
                      src={photoSrc}
                      alt={typeof photoTitle === 'string' ? photoTitle : 'Gallery'}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      className="transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                      loading="lazy"
                    />

                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                    {/* Category pill badge top-left */}
                    <span className="absolute top-3.5 left-3.5 z-10 bg-[#b31217] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide shadow-sm pointer-events-none">
                      <AutoTranslateString text={photoCategory} language={language as any} />
                    </span>

                    {/* Title inside card at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
                      <p className="text-white text-[16px] sm:text-[17px] font-black leading-snug line-clamp-2 drop-shadow-md">
                        <AutoTranslateString text={photoTitle} language={language as any} />
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop view (>= md): 4-column photo grid with red border */}
            <div className="hidden md:grid sm:grid-cols-4 gap-3.5">
              {galleryPhotos.map((photo: any, idx: number) => {
                const photoTitle = language === 'gu'
                  ? (photo.captionGu || photo.caption || photo.titleGu || photo.title || photo.alt || '')
                  : language === 'hi'
                  ? (photo.captionHi || (photo.caption && /[\u0900-\u097F]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.titleHi || photo.title || photo.alt || '')
                  : (photo.captionEn || (photo.caption && !/[\u0A80-\u0AFF]/.test(photo.caption) ? photo.caption : '') || photo.caption || photo.captionGu || photo.title || photo.alt || '');
                const photoCategory = getPhotoCategoryBadge(photo, language);
                const fallbackImg = FALLBACK_GALLERY_IMAGES[idx % FALLBACK_GALLERY_IMAGES.length];
                const photoSrc = photo.src || photo.coverImage || photo.image || photo.url || photo.thumbnail || fallbackImg;

                return (
                  <Link
                    key={photo.id || idx}
                    href={`/photos/${photo.id || ''}`}
                    className="group relative block overflow-hidden rounded-2xl border-2 border-[#b31217] bg-black shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    style={{ aspectRatio: '1/1' }}
                  >
                    <img
                      src={photoSrc}
                      alt={typeof photoTitle === 'string' ? photoTitle : 'Gallery'}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      className="transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                      loading="lazy"
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                    {/* Category pill badge top-left */}
                    <span className="absolute top-2.5 left-2.5 z-10 bg-[#b31217] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-sm pointer-events-none">
                      <AutoTranslateString text={photoCategory} language={language as any} />
                    </span>

                    {/* Title + "― ફોટો જુઓ >" inside the card at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col pointer-events-none">
                      <p className="text-white text-[12.5px] sm:text-[13.5px] font-bold leading-snug line-clamp-2 drop-shadow-md mb-2">
                        <AutoTranslateString text={photoTitle} language={language as any} />
                      </p>
                      <div className="flex items-center gap-1.5 text-white">
                        <span className="w-5 h-[2px] bg-[#b31217] inline-block" />
                        <span className="text-[11px] font-bold text-white tracking-wide">
                          {getLocalized(language, { en: 'View Photo', gu: 'ફોટો જુઓ', hi: 'फोटो देखें' })}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#b31217] stroke-[3]" />
                      </div>
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
