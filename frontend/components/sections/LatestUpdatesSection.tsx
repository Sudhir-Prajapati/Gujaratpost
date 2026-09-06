'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Clock } from 'lucide-react';
import { getArticleTitle, getCategoryLabel, formatViews, getLocalized, formatDate } from '@/data';
import { getPublicArticles, getHeroSettings } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { toGuDigits } from '@/lib/utils';
import type { Article, Language } from '@/types';

import ArticleMedia from '@/components/ui/ArticleMedia';
import { getArticleImage } from '@/components/sections/HeroSection';
import Advertisement from '@/components/ads/Advertisement';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

export default function LatestUpdatesSection({
  view = 'all',
  initialArticles,
  initialMostRead,
  initialPopularNews,
}: {
  view?: 'timeline' | 'sidebar' | 'all';
  initialArticles?: Article[];
  initialMostRead?: Article[];
  initialPopularNews?: Article[];
}) {
  const { language } = useApp();
  const [latestNews, setLatestNews] = useState<Article[]>(
    initialArticles ? initialArticles.slice(0, 10) : []
  );
  const [mostRead, setMostRead] = useState<Article[]>(
    initialMostRead || (initialArticles && initialArticles.length > 10 ? initialArticles.slice(10, 16) : [])
  );
  const [popularArticles, setPopularArticles] = useState<Article[]>(
    initialPopularNews || []
  );
  const [currentPopularIdx, setCurrentPopularIdx] = useState(0);

  const sortArticlesByLatest = (items: Article[]): Article[] => {
    return [...items].sort((a: any, b: any) => {
      const numA = typeof a.articleNumber === 'number' ? a.articleNumber : parseInt(a.articleNumber || '0', 10);
      const numB = typeof b.articleNumber === 'number' ? b.articleNumber : parseInt(b.articleNumber || '0', 10);
      if (!isNaN(numA) && !isNaN(numB) && numA > 0 && numB > 0 && numA !== numB) {
        return numB - numA;
      }
      const tA = new Date(a.createdAt || a.publishedAt || 0).getTime();
      const tB = new Date(b.createdAt || b.publishedAt || 0).getTime();
      const validTA = isNaN(tA) ? 0 : tA;
      const validTB = isNaN(tB) ? 0 : tB;
      return validTB - validTA;
    });
  };

  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      const sortedLatest = sortArticlesByLatest(initialArticles);
      setLatestNews(sortedLatest.slice(0, 10));
      if (initialMostRead && initialMostRead.length > 0) {
        setMostRead(initialMostRead);
      } else {
        setMostRead(initialArticles.length > 10 ? initialArticles.slice(10, 16) : initialArticles.slice(0, 6));
      }
    }
    if (initialPopularNews && initialPopularNews.length > 0) {
      setPopularArticles(initialPopularNews);
    }

    Promise.all([
      getPublicArticles({ limit: 20, sort: 'latest' }),
      getHeroSettings(),
    ]).then(([res, heroRes]: any[]) => {
      if (res && res.articles && res.articles.length > 0) {
        const sortedLatest = sortArticlesByLatest(res.articles);
        setLatestNews(sortedLatest.slice(0, 10));
      }
      if (heroRes && Array.isArray(heroRes.mostReadArticles) && heroRes.mostReadArticles.length > 0) {
        setMostRead(heroRes.mostReadArticles);
      } else if (res && res.articles && (!initialMostRead || initialMostRead.length === 0)) {
        setMostRead(res.articles.length > 10 ? res.articles.slice(10, 16) : res.articles.slice(0, 6));
      }

      // Fetch Admin-managed Popular News Articles for "લોકપ્રિય સમાચાર"
      if (heroRes && Array.isArray(heroRes.popularNewsArticles) && heroRes.popularNewsArticles.length > 0) {
        setPopularArticles(heroRes.popularNewsArticles);
      } else if (res && res.articles && (!initialPopularNews || initialPopularNews.length === 0)) {
        setPopularArticles(res.articles.slice(0, 12));
      }
    });
  }, [initialArticles, initialMostRead, initialPopularNews]);

  // Auto-rotate popular news slides every 5 seconds
  useEffect(() => {
    if (popularArticles.length <= 3) return;
    const maxPages = Math.ceil(popularArticles.length / 3);
    const interval = setInterval(() => {
      setCurrentPopularIdx((prev) => (prev + 1) % maxPages);
    }, 5000);
    return () => clearInterval(interval);
  }, [popularArticles.length]);

  // Paginate 3 cards at a time for Popular News slider
  const displayPopularCards = popularArticles.length > 0
    ? popularArticles.slice(currentPopularIdx * 3, currentPopularIdx * 3 + 3)
    : latestNews.slice(0, 3);

  if (!latestNews.length) return null;

  // Localized string selectors
  const labelLatest = getLocalized(language, {
    en: "Latest  News",
    gu: "Latest  સમાચાર",
    hi: "ताजा  समाचार"
  });

  const labelContinuous = getLocalized(language, {
    en: "• Continuous Updates",
    gu: "• સતત અપડેટ",
    hi: "• सतत अपडेट"
  });

  const labelMostRead = getLocalized(language, {
    en: "Most Read",
    gu: "સૌથી વધુ વંચાયેલા",
    hi: "सबसे ज्यादा पढ़े गए"
  });

  const timelineContent = (
    <div className="flex flex-col min-w-0">
      {/* ── 1. LATEST NEWS SECTION (Latest સમાચાર) ── */}
      <div className="flex items-center justify-between border-b-[3px] border-slate-950 dark:border-slate-800 pb-2.5 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 font-extrabold text-[17px] md:text-[19px] rounded-sm tracking-tight leading-none">
          {labelLatest}
        </span>
        <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] animate-pulse">
          {labelContinuous}
        </span>
      </div>

      {/* 2-Column Grid with vertical timeline lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">

        {/* Column 1 */}
        <div className="relative pl-5 flex flex-col">
          {latestNews.slice(0, 5).map((art, idx) => {
            const relativeTimeStr = language === 'gu'
              ? art.relativeTimeGu
              : language === 'hi'
                ? art.relativeTimeHi
                : art.relativeTime;
            const locationTag = getCategoryLabel(art, language);
            const isRedBullet = idx % 2 === 0;
            const mediaSrc = art.image || (art as any).featuredImage || getArticleImage(art);

            return (
              <Link
                key={art.id}
                href={`/news/${art.slug}`}
                className="group relative flex items-start justify-between gap-3 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/10 transition-colors duration-150 rounded-sm"
              >
                {idx === 0 && <div className="absolute left-[-14px] top-[18px] bottom-0 w-[1.5px] bg-[#d6c7b5]/85" />}
                {idx > 0 && idx < 4 && <div className="absolute left-[-14px] top-0 bottom-0 w-[1.5px] bg-[#d6c7b5]/85" />}
                {idx === 4 && <div className="absolute left-[-14px] top-0 h-[18px] w-[1.5px] bg-[#d6c7b5]/85" />}

                <div
                  className={`absolute left-[-19.5px] top-[18px] z-10 w-[12px] h-[12px] rounded-full transition-transform duration-200 group-hover:scale-110 ${
                    isRedBullet ? 'bg-[#B3121B]' : 'bg-white border-2 border-[#d6c7b5]'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 select-none">
                    <span className="text-[#B3121B] font-extrabold text-[11.5px] md:text-[12px] whitespace-nowrap">
                      {relativeTimeStr}
                    </span>
                    <span className="text-muted-foreground font-bold text-[11px] md:text-[11.5px] truncate">
                      {locationTag}
                    </span>
                  </div>
                  <h3 className="text-[13.5px] sm:text-[14.5px] md:text-[15.5px] font-extrabold leading-snug line-clamp-2 transition-colors duration-150 text-foreground group-hover:text-[#B3121B]">
                    <AutoArticleTitle article={art} language={language} />
                  </h3>
                </div>
                <div className="relative h-[58px] w-[86px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                  <ArticleMedia
                    src={mediaSrc}
                    alt={getArticleTitle(art, language)}
                    className="transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Column 2 */}
        <div className="relative pl-5 flex flex-col">
          {latestNews.slice(5, 10).map((art, idx) => {
            const relativeTimeStr = language === 'gu'
              ? art.relativeTimeGu
              : language === 'hi'
                ? art.relativeTimeHi
                : art.relativeTime;
            const locationTag = getCategoryLabel(art, language);
            const isRedBullet = idx % 2 === 0;
            const mediaSrc = art.image || (art as any).featuredImage || getArticleImage(art);

            return (
              <Link
                key={art.id}
                href={`/news/${art.slug}`}
                className="group relative flex items-start justify-between gap-3 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/10 transition-colors duration-150 rounded-sm"
              >
                {idx === 0 && <div className="absolute left-[-14px] top-[18px] bottom-0 w-[1.5px] bg-[#d6c7b5]/85" />}
                {idx > 0 && idx < 4 && <div className="absolute left-[-14px] top-0 bottom-0 w-[1.5px] bg-[#d6c7b5]/85" />}
                {idx === 4 && <div className="absolute left-[-14px] top-0 h-[18px] w-[1.5px] bg-[#d6c7b5]/85" />}

                <div
                  className={`absolute left-[-19.5px] top-[18px] z-10 w-[12px] h-[12px] rounded-full transition-transform duration-200 group-hover:scale-110 ${
                    isRedBullet ? 'bg-[#B3121B]' : 'bg-white border-2 border-[#d6c7b5]'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 select-none">
                    <span className="text-[#B3121B] font-extrabold text-[11.5px] md:text-[12px] whitespace-nowrap">
                      {relativeTimeStr}
                    </span>
                    <span className="text-muted-foreground font-bold text-[11px] md:text-[11.5px] truncate">
                      {locationTag}
                    </span>
                  </div>
                  <h3 className="text-[13.5px] sm:text-[14.5px] md:text-[15.5px] font-extrabold leading-snug line-clamp-2 transition-colors duration-150 text-foreground group-hover:text-[#B3121B]">
                    <AutoArticleTitle article={art} language={language} />
                  </h3>
                </div>
                <div className="relative h-[58px] w-[86px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                  <ArticleMedia
                    src={mediaSrc}
                    alt={getArticleTitle(art, language)}
                    className="transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </Link>
            );
          })}
        </div>

      </div>

      {/* ── 2. POPULAR NEWS SECTION (લોકપ્રિય સમાચાર - Admin Managed) ── */}
      <div className="mt-4 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between border-b-[3px] border-slate-950 dark:border-slate-800 pb-2 mb-4">
          <span className="bg-[#B3121B] text-white px-5 py-2.5 font-extrabold text-[17px] md:text-[19px] rounded-sm tracking-tight leading-none">
            {language === 'gu' ? 'લોકપ્રિય સમાચાર' : language === 'hi' ? 'लोकप्रिय समाचार' : 'Popular News'}
          </span>
          <Link
            href="/category/trending"
            className="text-[#B3121B] font-extrabold text-[13px] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {language === 'gu' ? 'વધુ જુઓ →' : 'View All →'}
          </Link>
        </div>

        {/* 3-Card Grid — 1 big + 2 small on mobile, 3 equal on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 [&>*:first-child]:col-span-2 md:[&>*:first-child]:col-span-1">
          {displayPopularCards.map((art, idx) => {
            const cardRank = currentPopularIdx * 3 + idx + 1;
            return (
              <Link
                key={art.id || idx}
                href={`/news/${art.slug}`}
                className="group flex flex-col min-w-0"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2">
                  <span className="absolute top-1.5 left-1.5 z-10 bg-black/80 text-white font-extrabold text-[11px] px-1.5 py-0.5 rounded-sm select-none shadow">
                    {language === 'gu' ? toGuDigits(cardRank) : cardRank}
                  </span>
                  <ArticleMedia
                    src={art.image || (art as any).featuredImage}
                    alt={getArticleTitle(art, language)}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-[12px] md:text-[13.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                  <AutoArticleTitle article={art} language={language} />
                </h3>
                <span className="text-muted-foreground font-semibold text-[10px] md:text-[11px] mt-1">
                  {language === 'gu'
                    ? (art.relativeTimeGu || formatDate(art.publishedAt, 'gu'))
                    : (art.relativeTime || formatDate(art.publishedAt, 'en'))}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Dot Pagination Indicators */}
        {popularArticles.length > 3 && (
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {Array.from({ length: Math.ceil(popularArticles.length / 3) }).map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentPopularIdx(dotIdx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentPopularIdx === dotIdx ? 'bg-[#B3121B] w-6' : 'bg-zinc-300 dark:bg-zinc-700 w-2.5'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-6 sticky top-20 select-none">
      {/* ── 1. MOST READ SECTION (સૌથી વધુ વંચાયેલા) ── */}
      <div>
        <div className="flex items-center gap-1.5 border-b-[3px] border-slate-950 dark:border-slate-800 pb-2.5 mb-3.5">
          <span className="text-[#B3121B] text-[15px] font-extrabold">♦</span>
          <h3 className="text-[15px] font-black text-foreground">
            {labelMostRead}
          </h3>
        </div>

        <div className="flex flex-col divide-y divide-border/40">
          {mostRead.slice(0, 5).map((art, idx) => (
            <Link
              key={art.id}
              href={`/news/${art.slug}`}
              className="group flex items-start gap-2.5 md:gap-3.5 py-2 md:py-3 hover:bg-muted/20 transition-colors duration-150 px-1 rounded-sm border-b border-border/40 pb-2 md:pb-3 last:border-b-0 last:pb-0 pt-2 md:pt-3 first:pt-0"
            >
              <span className="text-[18px] md:text-[24px] font-serif font-black text-slate-300 dark:text-slate-700 group-hover:text-[#B3121B] transition-colors duration-150 leading-none w-5 md:w-6 text-center select-none shrink-0">
                {language === 'gu' ? toGuDigits(idx + 1) : idx + 1}
              </span>

              <h4 className="text-[13.5px] md:text-[15px] leading-snug text-foreground group-hover:text-[#B3121B] transition-colors duration-150 line-clamp-2 md:line-clamp-3 flex-1 mt-0.5" style={{ fontFamily: "'Hind Vadodara', 'Noto Sans Gujarati', sans-serif", fontWeight: 700 }}>
                <AutoArticleTitle article={art} language={language} />
              </h4>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 2. E-PAPER WIDGET (ઈ-પેપર) ── */}
      <Link
        href="/epaper"
        className="group flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs hover:shadow-md transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="bg-[#B3121B] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-xs">
            ઈ-પેપર
          </span>
          <div>
            <h4 className="text-[13px] font-extrabold text-zinc-900 dark:text-white group-hover:text-[#B3121B] transition-colors">
              આજનું ઈ-પેપર વાંચો
            </h4>
            <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
              {new Date().toLocaleDateString('gu-IN', { day: 'numeric', month: 'long', year: 'numeric' })} - PDF
            </p>
          </div>
        </div>
        <span className="text-[#B3121B] font-bold text-base transition-transform group-hover:translate-x-1">
          →
        </span>
      </Link>

      {/* ── 3. SIDEBAR ADVERTISEMENT WIDGET (જાહેરાત) ── */}
      <div className="w-full">
        <Advertisement section="SIDEBAR_HERO_TOP" />
      </div>

    </div>
  );

  if (view === 'timeline') {
    return timelineContent;
  }

  if (view === 'sidebar') {
    return sidebarContent;
  }

  return (
    <section className="mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-8 items-start border-t border-border/60 pt-4">
        {timelineContent}
        {sidebarContent}
      </div>
    </section>
  );
}
