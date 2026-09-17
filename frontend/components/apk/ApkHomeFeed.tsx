'use client';

import { useState, useRef, useEffect, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Flame, ChevronRight } from 'lucide-react';
import type { Article, Video } from '@/types';
import { getPublicArticles, getPublicReels } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { safeYouTubeId } from '@/lib/youtube';
import ApkVideoPlayer from './ApkVideoPlayer';
import ApkHomeSkeleton from './ApkHomeSkeleton';
import ApkAdBanner from './ApkAdBanner';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';


function getReelThumbnail(reel: any): string | null {
  const url = (reel.videoUrl || reel.instaUrl || '').trim();
  const instaMatch = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
  const shortcode = instaMatch?.[1] || '';

  if (reel.thumbnail?.trim()) {
    const rawThumb = reel.thumbnail.trim();
    if (rawThumb.includes('instagram') || rawThumb.includes('fbcdn.net') || shortcode) {
      return `/api/instagram-image?url=${encodeURIComponent(rawThumb)}&shortcode=${shortcode}`;
    }
    return rawThumb;
  }

  if (!url) return null;

  const ytId = safeYouTubeId(url);
  if (ytId && ytId !== url && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
    return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  }

  if (shortcode) {
    return `/api/instagram-image?shortcode=${shortcode}`;
  }

  if (/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url)) {
    return url;
  }

  return null;
}

const formatInstaViews = (views: number | undefined | null): string | null => {
  if (!views || views <= 0) return null;
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${Math.round(views / 1000)}K`;
  return `${views}`;
};

const FALLBACK_REELS = [
  {
    id: 'demo-1',
    type: 'INSTAGRAM',
    heading: 'Gujarat Post Daily News Highlights',
    headingGu: 'ગુજરાત પોસ્ટ દૈનિક સમાચાર હાઇલાઇટ્સ',
    headingHi: 'गुजरात पोस्ट दैनिक समाचार हाइलाइट्स',
    instaUrl: 'https://www.instagram.com/gujaratpost.in/',
    thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
    views: 45200,
  },
  {
    id: 'demo-2',
    type: 'INSTAGRAM',
    heading: 'Breaking Politics & City News',
    headingGu: 'રાજકારણ અને શહેરના તાજા સમાચાર',
    headingHi: 'राजनीति और शहर के ताज़ा समाचार',
    instaUrl: 'https://www.instagram.com/gujaratpost.in/',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
    views: 82100,
  },
  {
    id: 'demo-3',
    type: 'INSTAGRAM',
    heading: 'Live Weather & Special Ground Report',
    headingGu: 'હવામાન અને ખાસ ગ્રાઉન્ડ રિપોર્ટ',
    headingHi: 'मौसम और विशेष ग्राउंड रिपोर्ट',
    instaUrl: 'https://www.instagram.com/gujaratpost.in/',
    thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&auto=format&fit=crop&q=80',
    views: 63400,
  },
  {
    id: 'demo-4',
    type: 'INSTAGRAM',
    heading: 'Gujarat Business & Market Updates',
    headingGu: 'ગુજરાત વ્યાપાર અને બજાર સમાચાર',
    headingHi: 'गुजरात व्यापार और बाजार समाचार',
    instaUrl: 'https://www.instagram.com/gujaratpost.in/',
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80',
    views: 38900,
  },
];

interface ApkHomeFeedProps {
  articles: Article[];
  videos: Video[];
  categories: any[];
}

export default function ApkHomeFeed({
  articles = [],
  videos = [],
  categories = [],
}: ApkHomeFeedProps) {
  const { language } = useApp();
  // Instagram Reels state
  const [reels, setReels] = useState<any[]>([]);
  const [isLoadingReels, setIsLoadingReels] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getPublicReels()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setReels(data);
        }
      })
      .catch((err) => {
        console.warn('APK reels load notice:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingReels(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeReels = reels.length > 0 ? reels : FALLBACK_REELS;
  const reelsSectionTitle =
    language === 'hi' ? 'इंस्टाग्राम रील्स' : language === 'en' ? 'Instagram Reels' : 'ઇન્સ્ટાગ્રામ રીલ્સ';


  // Active Video for APK YouTube watch player
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Carousel state for Hero Card
  const [activeSlide, setActiveSlide] = useState(0);
  const heroArticles = articles.slice(0, 5);
  const heroCount = heroArticles.length > 0 ? heroArticles.length : 1;

  // Touch swipe support for Carousel
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-advance Carousel every 4.5s
  useEffect(() => {
    if (heroCount <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroCount);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroCount]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      setActiveSlide((prev) => (prev + 1) % heroCount);
    } else if (diff < -45) {
      setActiveSlide((prev) => (prev - 1 + heroCount) % heroCount);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Infinite scroll state for the news feed
  const [extraArticles, setExtraArticles] = useState<Article[]>([]);
  const initialNextPage = articles.length > 0 ? Math.floor(articles.length / 20) + 1 : 1;
  const [page, setPage] = useState(initialNextPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Sync page if articles length changes
  useEffect(() => {
    if (articles.length > 0) {
      const computedPage = Math.floor(articles.length / 20) + 1;
      setPage((prevPage) => Math.max(prevPage, computedPage));
    }
  }, [articles.length]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const result = await getPublicArticles({ page, limit: 20, sort: 'latest' });
      const newArticles = result.articles || [];
      if (newArticles.length === 0 || page >= result.totalPages) {
        setHasMore(false);
      } else {
        setExtraArticles((prev) => {
          const seenIds = new Set<string>();
          articles.forEach((a) => {
            if (a?.id) seenIds.add(String(a.id));
            if (a?.slug) seenIds.add(String(a.slug));
          });
          prev.forEach((a) => {
            if (a?.id) seenIds.add(String(a.id));
            if (a?.slug) seenIds.add(String(a.slug));
          });
          const deduped = newArticles.filter((a) => {
            if (!a) return false;
            const idKey = a.id ? String(a.id) : '';
            const slugKey = a.slug ? String(a.slug) : '';
            if (idKey && seenIds.has(idKey)) return false;
            if (slugKey && seenIds.has(slugKey)) return false;
            if (idKey) seenIds.add(idKey);
            if (slugKey) seenIds.add(slugKey);
            return true;
          });
          return [...prev, ...deduped];
        });
        setPage((p) => p + 1);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, isLoadingMore, hasMore, articles]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '250px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Section data slices
  const currentHero = heroArticles[activeSlide] || articles[0];
  const topNewsArticles = useMemo(() => articles.slice(5, 13), [articles]);
  const mostReadArticles = useMemo(() => articles.slice(13, 17), [articles]);
  const feedVideos = useMemo(() => videos.slice(0, 10), [videos]);

  const remainingArticles = useMemo(() => {
    const seen = new Set<string>();
    // Exclude hero, top news, and most read articles so they aren't repeated in the feed
    articles.slice(0, 17).forEach((a) => {
      if (a?.id) seen.add(String(a.id));
      if (a?.slug) seen.add(String(a.slug));
    });

    const list: Article[] = [];
    const candidates = [...articles.slice(17), ...extraArticles];
    for (const art of candidates) {
      if (!art) continue;
      const key = String(art.id || art.slug || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push(art);
    }
    return list;
  }, [articles, extraArticles]);

  // Dynamic UI labels based on active language
  const topNewsTitle = language === 'hi' ? 'टॉप समाचार' : language === 'en' ? 'Top News' : 'ટોપ સમાચાર';
  const mostReadTitle = language === 'hi' ? 'सबसे ज्यादा पढ़े गए' : language === 'en' ? 'Most Read' : 'સૌથી વધુ વંચાયેલા';
  const viewAllText = language === 'hi' ? 'सभी देखें' : language === 'en' ? 'View All' : 'બધા જુઓ';
  const videosTitle = language === 'hi' ? 'वीडियो' : language === 'en' ? 'VIDEOS' : 'વીડિયો';
  const latestFeedTitle = language === 'hi' ? 'તાज़ा સમાચાર फ़ीड' : language === 'en' ? 'Latest News Feed' : 'તાજા સમાચાર ફિડ';
  const latestBadgeText = language === 'hi' ? 'नवीनतम' : language === 'en' ? 'Latest' : 'નવીનતમ';
  const loadingMoreText = language === 'hi' ? 'और समाचार लोड हो रहे हैं...' : language === 'en' ? 'Loading more news...' : 'વધુ સમાચાર લોડ થઈ રહ્યા છે...';
  const allLoadedText = language === 'hi' ? '— सभी समाचार लोड हो गए —' : language === 'en' ? '— All news loaded —' : '— તમામ સમાચાર લોડ થઈ ગયા —';
  const videosBadgeText = language === 'hi' ? 'वीडियो' : language === 'en' ? 'VIDEOS' : 'VIDEOS';

  if (!articles || articles.length === 0) {
    return <ApkHomeSkeleton />;
  }

  return (
    <div className="pb-10 bg-[#F8F9FA] dark:bg-[#0f1015] select-none transition-colors duration-200">
      {/* ── 1. HERO FEATURED CAROUSEL ───────────────────────────────── */}
      {currentHero && (
        <div className="px-3.5 pt-3 pb-2">
          <div
            className="relative aspect-[16/10] sm:aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Background Hero Image */}
            <Link
              href={`/news/${currentHero.slug || currentHero.id}`}
              className="absolute inset-0 block"
            >
              <Image
                src={currentHero.image || '/logo.png'}
                alt={currentHero.titleGu || currentHero.title}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 640px"
              />
              {/* Dark Gradients for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
            </Link>

            {/* Top Left Badge: Flame / VIDEOS */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="flex items-center gap-1 bg-[#dc2626] text-white text-[10.5px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wide">
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>{videosBadgeText}</span>
              </span>
            </div>

            {/* Top Right Badge: 1/5 Slide Counter */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="bg-black/60 backdrop-blur-md text-white text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-white/15">
                {activeSlide + 1}/{heroCount}
              </span>
            </div>

            {/* Bottom Content Area: Category + Title */}
            <div className="absolute inset-x-0 bottom-0 p-3.5 z-10 flex flex-col justify-end">
              {/* Category Pill */}
              <div className="mb-1.5">
                <span className="bg-[#dc2626] text-white text-[9.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-block shadow-xs">
                  <AutoTranslateString
                    text={currentHero.category || 'ટેકનોલોજી'}
                    language={language}
                  />
                </span>
              </div>

              {/* Bold Headline (Auto-translated to active language) */}
              <Link href={`/news/${currentHero.slug || currentHero.id}`}>
                <h2 className="text-white font-black text-[15px] sm:text-[17px] leading-snug line-clamp-2 drop-shadow-sm active:text-gray-200 transition">
                  <AutoArticleTitle
                    article={currentHero}
                    language={language}
                  />
                </h2>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. "ટોપ સમાચાર" (TOP NEWS) SECTION ────────────────────────── */}
      {topNewsArticles.length > 0 && (
        <div className="my-2">
          {/* Section Header */}
          <div className="px-3.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B3121B]" />
              <h3 className="font-black text-[15px] text-gray-900 dark:text-gray-100 tracking-tight">
                {topNewsTitle}
              </h3>
            </div>
            <Link
              href="/category/gujarat"
              prefetch={true}
              className="text-xs font-bold text-[#B3121B] hover:text-[#9B0F17] flex items-center gap-0.5"
            >
              <span>{viewAllText}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Horizontal Scrolling Top News Cards */}
          <div className="px-3.5 pt-1 pb-2 flex gap-3 overflow-x-auto scrollbar-hide">
            {topNewsArticles.map((art, idx) => (
              <Link
                key={`apk-top-${art.id || art.slug || idx}-${idx}`}
                href={`/news/${art.slug || art.id}`}
                className="shrink-0 w-[170px] bg-white dark:bg-[#18181b] rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition active:scale-98"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={art.image || '/logo.png'}
                    alt={art.titleGu || art.title}
                    fill
                    className="object-cover"
                    sizes="170px"
                  />
                </div>

                {/* Body Content */}
                <div className="p-2.5 flex-1 flex flex-col justify-start">
                  <h4 className="font-extrabold text-[12.5px] leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                    <AutoArticleTitle
                      article={art}
                      language={language}
                    />
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 2.3. APK BACKEND AD BANNER (SLOT 1) ────────────────────── */}
      <ApkAdBanner slotIndex={0} className="my-2" />

      {/* ─── 2.5. "ઇન્સ્ટાગ્રામ રીલ્સ" (INSTAGRAM REELS) SECTION ─── */}
      {activeReels.length > 0 && (
        <div className="my-2">
          {/* Section Header */}
          <div className="px-3.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shadow-xs">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </span>
              <h3 className="font-black text-[15px] text-gray-900 dark:text-gray-100 tracking-tight">
                {reelsSectionTitle}
              </h3>
            </div>
            <a
              href="https://www.instagram.com/gujaratpost.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#E1306C] hover:text-[#C13584] flex items-center gap-0.5"
            >
              <span>{viewAllText}</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Horizontal Scrolling Reel Cards */}
          <div className="px-3.5 pt-1 pb-2 flex gap-3 overflow-x-auto scrollbar-hide">
            {activeReels.map((reel, idx) => {
              const thumbUrl = getReelThumbnail(reel);
              const displayTitle =
                language === 'gu'
                  ? (reel.headingGu || reel.heading)
                  : language === 'hi'
                  ? (reel.headingHi || reel.heading)
                  : reel.heading;
              const viewsText = formatInstaViews(reel.views);

              return (
                <div
                  key={`apk-reel-${reel.id || idx}-${idx}`}
                  onClick={() => {
                    const targetUrl = reel.instaUrl || reel.videoUrl || 'https://www.instagram.com/gujaratpost.in/';
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="shrink-0 w-[130px] sm:w-[145px] cursor-pointer group select-none active:scale-95 transition-transform"
                >
                  <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-black shadow-sm border border-gray-200/90 dark:border-gray-800">
                    {/* Thumbnail Image */}
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={displayTitle || 'Reel'}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}

                    {/* Gradient Overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent z-10" />

                    {/* Top Left: Instagram Reels Icon Badge */}
                    <div className="absolute top-2 left-2 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white shadow-md">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
                        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H9l2 4H8L6 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zM8 17V9.5l7 3.75L8 17z" />
                      </svg>
                    </div>

                    {/* Top Right: Views count if available */}
                    {viewsText && (
                      <div className="absolute top-2 right-2 z-20">
                        <span className="bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md border border-white/15">
                          {viewsText}
                        </span>
                      </div>
                    )}

                    {/* Center Translucent Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
                      <span className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-md group-hover:scale-110 transition">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </span>
                    </div>

                    {/* Bottom Title Container */}
                    <div className="absolute bottom-0 inset-x-0 p-2.5 z-20 flex flex-col justify-end">
                      <p className="text-white font-extrabold text-[11.5px] leading-tight line-clamp-2 drop-shadow-md">
                        {displayTitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2.7. "સૌથી વધુ વંચાયેલા" (MOST READ) SECTION ───────────── */}
      {mostReadArticles.length > 0 && (
        <div className="my-2 px-3.5">
          <div className="py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B3121B]" />
              <h3 className="font-black text-[15px] text-gray-900 dark:text-gray-100 tracking-tight">
                {mostReadTitle}
              </h3>
            </div>
            <Link
              href="/category/trending"
              className="text-xs font-bold text-[#B3121B] hover:text-[#9B0F17] flex items-center gap-0.5"
            >
              <span>{viewAllText}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-xs divide-y divide-gray-100 dark:divide-gray-800/80 overflow-hidden">
            {mostReadArticles.map((art, idx) => (
              <Link
                key={`apk-most-read-${art.id || idx}`}
                href={`/news/${art.slug || art.id}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition active:bg-gray-100"
              >
                <span className="font-serif font-black text-xl text-[#B3121B] w-5 shrink-0 text-center select-none">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[13px] leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                  <span className="text-[10.5px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 block">
                    <AutoTranslateString text={art.category || 'સમાચાર'} language={language} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. "VIDEOS" SECTION ──────────────────────────────────────── */}
      {feedVideos.length > 0 && (
        <div className="my-2">
          {/* Section Header */}
          <div className="px-3.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#B3121B] flex items-center justify-center text-white shadow-xs">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </span>
              <h3 className="font-black text-[15px] text-gray-900 dark:text-gray-100 tracking-tight">
                {videosTitle}
              </h3>
            </div>
            <Link
              href="/videos"
              className="text-xs font-bold text-[#B3121B] hover:text-[#9B0F17] flex items-center gap-0.5"
            >
              <span>{viewAllText}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Horizontal Scrolling Video Cards */}
          <div className="px-3.5 pt-1 pb-2 flex gap-3 overflow-x-auto scrollbar-hide">
            {feedVideos.map((vid, idx) => {
              const thumb =
                vid.thumbnail &&
                vid.thumbnail.startsWith('http') &&
                !vid.thumbnail.includes('frame0.jpg')
                  ? vid.thumbnail
                  : `https://i.ytimg.com/vi/${safeYouTubeId(vid.youtubeId)}/hqdefault.jpg`;

              return (
                <div
                  key={`apk-vid-${vid.id || vid.youtubeId || idx}-${idx}`}
                  onClick={() => setSelectedVideo(vid)}
                  className="shrink-0 w-[165px] flex flex-col cursor-pointer active:scale-98 transition group"
                >
                  {/* Thumbnail + Play Button + Duration */}
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-900 shadow-xs border border-gray-200/60 dark:border-gray-800">
                    <img
                      src={thumb}
                      alt={vid.titleGu || vid.title || ''}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = `https://i.ytimg.com/vi/${safeYouTubeId(vid.youtubeId)}/hqdefault.jpg`;
                      }}
                    />

                    {/* Translucent Center Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-md group-hover:scale-110 transition">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </span>
                    </div>

                    {/* Bottom Right Duration Badge */}
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      {vid.duration || '02:24'}
                    </span>
                  </div>

                  {/* 2-line Video Title (Auto-translated to active language) */}
                  <h4 className="mt-1.5 text-[12px] font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                    <AutoTranslateString
                      text={vid.titleGu || vid.title || ''}
                      language={language}
                    />
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. "તાજા સમાચાર ફિડ" (LATEST NEWS INFINITE SCROLL) ────────── */}
      <div className="px-3.5 mt-2 space-y-2.5">
        <div className="flex items-center justify-between pt-2 pb-0.5">
          <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B3121B]" />
            {latestFeedTitle}
          </span>
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">{latestBadgeText}</span>
        </div>

        {remainingArticles.map((art, idx) => (
          <Link
            key={`apk-feed-${art.id || art.slug || idx}-${idx}`}
            href={`/news/${art.slug || art.id}`}
            className="flex gap-3 bg-white dark:bg-[#18181b] p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs active:bg-gray-50 dark:active:bg-gray-800/80 transition"
          >
            {/* Content Left */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <span className="text-[10px] font-black text-[#B3121B] uppercase tracking-wide">
                <AutoTranslateString
                  text={art.category || 'ગુજરાત'}
                  language={language}
                />
              </span>
              <h3 className="font-extrabold text-[13.5px] leading-[1.35] text-gray-900 dark:text-gray-100 line-clamp-2 my-1">
                <AutoArticleTitle
                  article={art}
                  language={language}
                />
              </h3>
            </div>

            {/* Thumbnail Right */}
            <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-gray-100 dark:border-gray-800">
              <Image
                src={art.image || '/logo.png'}
                alt={art.titleGu || art.title || ''}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          </Link>
        ))}

        {/* Infinite Scroll Sentinel + Loading Spinner */}
        <div ref={loadMoreRef} className="flex justify-center items-center py-6">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
              <svg
                className="animate-spin w-4 h-4 text-[#B3121B]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span>{loadingMoreText}</span>
            </div>
          ) : !hasMore ? (
            <span className="text-[11px] font-bold text-gray-400">
              {allLoadedText}
            </span>
          ) : null}
        </div>
      </div>

      {/* ── 5. FULL-SCREEN APK YOUTUBE VIDEO WATCH PLAYER ───────────── */}
      {selectedVideo && (
        <ApkVideoPlayer
          videoId={safeYouTubeId(selectedVideo.youtubeId)}
          initialVideo={selectedVideo}
          allVideos={videos}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={(id, vid) => {
            if (vid) setSelectedVideo(vid);
            else {
              const found = videos.find((v) => safeYouTubeId(v.youtubeId) === id);
              if (found) setSelectedVideo(found);
              else setSelectedVideo({ ...selectedVideo, youtubeId: id });
            }
          }}
        />
      )}
    </div>
  );
}
