'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { Article, Language } from '@/types';
import { getPublicArticles } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import { DEMO_IMAGES } from './homeHelpers';

const POLITICS_SLUGS = ['politics', 'rajkaran'];

const POLITICS_CATEGORY_ID = '33c842e2-4efa-4b25-a12d-ac1a1fe1f561';

function isPolitics(art: Article): boolean {
  if (!art) return false;
  const catId = (art as any).categoryId || (art as any).category?.id || '';
  if (catId === POLITICS_CATEGORY_ID) return true;

  const slug = (
    (art as any).category?.slug ||
    (art as any).categorySlug ||
    (typeof art.category === 'string' ? art.category : '') ||
    ''
  ).toLowerCase().trim();
  const name = (
    (art as any).category?.name ||
    (art as any).categoryName ||
    (typeof art.category === 'string' ? art.category : '') ||
    ''
  ).toLowerCase().trim();
  const nameGu = (
    (art as any).category?.nameGu ||
    (art as any).categoryGu ||
    ''
  ).toLowerCase().trim();
  const titleGu = (art.titleGu || '').toLowerCase();

  return (
    POLITICS_SLUGS.includes(slug) ||
    POLITICS_SLUGS.includes(name) ||
    nameGu.includes('રાજ') ||
    name.includes('politic') ||
    name.includes('raj') ||
    titleGu.includes('રાજકારણ') ||
    titleGu.includes('રાજનીતિ')
  );
}

function sortPoliticsLatest(list: Article[]): Article[] {
  return [...(list || [])].sort((a: any, b: any) => {
    const aNum = typeof a?.articleNumber === 'number' ? a.articleNumber : (parseInt(a?.articleNumber, 10) || 0);
    const bNum = typeof b?.articleNumber === 'number' ? b.articleNumber : (parseInt(b?.articleNumber, 10) || 0);
    if (bNum > 0 && aNum > 0 && bNum !== aNum) return bNum - aNum;
    if (bNum > 0 && aNum === 0) return -1;
    if (aNum > 0 && bNum === 0) return 1;
    const timeA = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
    const timeB = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/* --- Politics Section ("રાજકારણ" Zone) ----------------------------- */
export default function PoliticsSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const initialPolitics = useMemo(() => {
    return sortPoliticsLatest((initialArticles || []).filter(isPolitics));
  }, [initialArticles]);

  const [dbPoliticsArticles, setDbPoliticsArticles] = useState<Article[]>(() => initialPolitics.slice(0, 9));
  const [fallbackArticles, setFallbackArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(initialPolitics.length === 0);

  // Sync state if initialArticles prop changes from parent
  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      const filtered = (initialArticles || []).filter(isPolitics);
      if (filtered.length > 0) {
        setDbPoliticsArticles((prev) => {
          const map = new Map<string, Article>();
          prev.forEach((a) => { if (a?.id) map.set(a.id, a); });
          filtered.forEach((a) => { if (a?.id) map.set(a.id, a); });
          return sortPoliticsLatest(Array.from(map.values())).slice(0, 9);
        });
      }
    }
  }, [initialArticles]);

  const fetchFreshPoliticsArticles = useCallback(async () => {
    try {
      const [res1, res2] = await Promise.all([
        getPublicArticles({ categorySlug: 'politics', limit: 12, sort: 'latest' }).catch(() => null),
        getPublicArticles({ categorySlug: 'rajkaran', limit: 12, sort: 'latest' }).catch(() => null),
      ]);
      const combined = [
        ...(res1?.articles || []),
        ...(res2?.articles || []),
      ];
      if (combined.length > 0) {
        setDbPoliticsArticles((prev) => {
          const map = new Map<string, Article>();
          combined.forEach((a) => { if (a?.id) map.set(a.id, a); });
          prev.forEach((a) => { if (a?.id && !map.has(a.id)) map.set(a.id, a); });
          (initialArticles || []).filter(isPolitics).forEach((a) => {
            if (a?.id && !map.has(a.id)) map.set(a.id, a);
          });
          const sorted = sortPoliticsLatest(Array.from(map.values()));
          return sorted.slice(0, 9);
        });
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [initialArticles]);

  useEffect(() => {
    fetchFreshPoliticsArticles();

    const handleSync = () => {
      fetchFreshPoliticsArticles();
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('gp-articles-updated', handleSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleSync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('gp-articles-updated', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchFreshPoliticsArticles]);

  // Combine politics + fallback to always fill 9 slots
  const allCards = useMemo(() => {
    const combined = [...dbPoliticsArticles, ...fallbackArticles];
    return combined.slice(0, 9);
  }, [dbPoliticsArticles, fallbackArticles]);

  const top3 = useMemo(() => allCards.slice(0, 3), [allCards]);
  const bottomGrid = useMemo(() => allCards.slice(3, 9), [allCards]);

  if (loading && allCards.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 mt-2.5 animate-pulse">
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
          <div className="h-10 w-36 rounded-lg bg-muted/60" />
          <div className="h-5 w-20 rounded bg-muted/40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[16/10] w-full rounded-sm bg-muted/40" />
              <div className="h-5 w-full rounded bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allCards.length === 0) return null;

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-2" suppressHydrationWarning>
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 md:pb-2.5 mb-2.5 md:mb-4">
        <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'રાજકારણ' : language === 'hi' ? 'राजनीति' : 'Politics'}
        </span>
        <Link
          href="/category/politics"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[20px] md:text-[21px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* Mobile View (< md): 1 Lead Featured Story + Compact News List */}
      <div className="md:hidden flex flex-col">
        {/* 1. Lead Featured Story */}
        {allCards[0] && (
          <Link
            href={`/news/${allCards[0].slug}`}
            className="group flex flex-col pb-2 mb-1 border-b border-border/40"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/10 bg-muted mb-1.5 shadow-2xs">
              <ArticleMedia
                src={allCards[0].image || (allCards[0] as any).imageUrl || '/assets/demo/1.jpg'}
                alt={allCards[0].title}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="text-[#B3121B] font-black text-[11.5px] uppercase tracking-wider mb-0.5 select-none leading-none">
              {(allCards[0] as any).categoryGu || (allCards[0] as any).category?.nameGu || (language === 'gu' ? 'રાજકારણ' : language === 'hi' ? 'राजनीति' : 'Politics')}
            </span>
            <h3 className="text-[16px] font-extrabold leading-[1.34] text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
              <AutoArticleTitle article={allCards[0]} language={language} />
            </h3>
          </Link>
        )}

        {/* 2. Mobile View (< md): Premium Boxed Cards matching Hero Section */}
        <div className="flex flex-col gap-2 mt-1">
          {allCards.slice(1, 7).map((art) => (
            <Link
              key={`mob-${art.id}`}
              href={`/news/${art.slug}`}
              className="group flex flex-row items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-card/70 hover:bg-muted/40 border border-border/50 hover:border-border transition-all min-w-0 shadow-2xs"
            >
              {/* Title & Metadata on the left */}
              <div className="flex flex-col min-w-0 flex-1 pr-1">
                <span className="text-[#B3121B] font-black text-[11px] sm:text-[11.5px] uppercase tracking-wider mb-1 select-none leading-none">
                  {(art as any).categoryGu || (art as any).category?.nameGu || (language === 'gu' ? 'રાજકારણ' : language === 'hi' ? 'राजनीति' : 'Politics')}
                </span>
                <h4 className="text-[16px] sm:text-[16.5px] font-extrabold leading-[1.32] text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                  <AutoArticleTitle article={art} language={language} />
                </h4>
              </div>

              {/* Thumbnail on the right */}
              <div className="relative aspect-[16/10] w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-lg border border-border/10 bg-muted">
                <ArticleMedia
                  src={art.image || (art as any).imageUrl || '/assets/demo/2.jpg'}
                  alt={art.title}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop View (>= md): Exactly preserved 3-column top row + 6-card bottom grid */}
      <div className="hidden md:block">
        {/* Top 3 columns — all from API */}
        <div className="grid grid-cols-3 gap-8 items-start">
          {top3.map((art) => (
            <div key={art.id} className="flex flex-col min-w-0">
              <Link href={`/news/${art.slug}`} className="group flex flex-col mb-2.5">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                  <ArticleMedia
                    src={art.image || (art as any).imageUrl || '/assets/demo/1.jpg'}
                    alt={art.title}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase">
                  {(art as any).categoryGu || (art as any).category?.nameGu || (art as any).category?.name || 'રાજકારણ'}
                </span>
                <h3 className="text-[15px] md:text-[16.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2 min-h-[42px] md:min-h-[48px]">
                  <AutoArticleTitle article={art} language={language} />
                </h3>
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom 6-card grid — politics first, then other recent articles as fallback */}
        {bottomGrid.length > 0 && (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 border-t border-border/40 pt-4 md:pt-5 mt-4 md:mt-5">
            {bottomGrid.map((art) => (
              <div key={art.id} className="flex flex-col min-w-0">
                <Link href={`/news/${art.slug}`} className="group flex flex-col">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                    <ArticleMedia
                      src={art.image || (art as any).imageUrl || '/assets/demo/2.jpg'}
                      alt={art.title}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[#B3121B] font-extrabold text-[11px] mb-1 select-none uppercase leading-none">
                      {(art as any).categoryGu || (art as any).category?.nameGu || (art as any).category?.name || 'સમાચાર'}
                    </span>
                    <h4 className="text-[13.5px] md:text-[14px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                      <AutoArticleTitle article={art} language={language} />
                    </h4>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export { PoliticsSection };




