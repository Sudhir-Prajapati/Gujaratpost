'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Article, Language } from '@/types';
import { getPublicArticles } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { DEMO_IMAGES } from './homeHelpers';

const POLITICS_SLUGS = ['politics', 'rajkaran'];

function isPolitics(art: Article): boolean {
  const slug = (
    (art as any).category?.slug ||
    (art as any).categorySlug ||
    (art as any).category ||
    ''
  ).toLowerCase().trim();
  const name = (
    (art as any).category?.name ||
    (art as any).categoryName ||
    ''
  ).toLowerCase().trim();
  const nameGu = (
    (art as any).category?.nameGu || ''
  ).toLowerCase().trim();

  return (
    POLITICS_SLUGS.includes(slug) ||
    POLITICS_SLUGS.includes(name) ||
    nameGu.includes('રાજ') ||
    name.includes('politic') ||
    name.includes('raj')
  );
}

/* --- Politics Section ("રાજકારણ" Zone) ----------------------------- */
export default function PoliticsSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const initialPolitics = useMemo(() => {
    return (initialArticles || []).filter(isPolitics);
  }, [initialArticles]);

  const [dbPoliticsArticles, setDbPoliticsArticles] = useState<Article[]>(initialPolitics.slice(0, 9));
  const [fallbackArticles, setFallbackArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(initialPolitics.length < 3);

  useEffect(() => {
    const preFetched = (initialArticles || []).filter(isPolitics);

    if (preFetched.length >= 9) {
      setDbPoliticsArticles(preFetched.slice(0, 9));
      setLoading(false);
      return;
    }

    // Fetch from both slugs in parallel
    Promise.all([
      getPublicArticles({ categorySlug: 'politics', limit: 12 }).catch(() => null),
      getPublicArticles({ categorySlug: 'rajkaran', limit: 12 }).catch(() => null),
    ]).then(([res1, res2]) => {
      const combined = [
        ...(res1?.articles || []),
        ...(res2?.articles || []),
        ...preFetched,
      ];
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = combined.filter(a => {
        if (!a?.id || seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      // Sort newest first
      unique.sort((a, b) =>
        new Date(b.publishedAt || (b as any).createdAt || 0).getTime() -
        new Date(a.publishedAt || (a as any).createdAt || 0).getTime()
      );

      setDbPoliticsArticles(unique.slice(0, 9));

      // If fewer than 9 politics articles, also fetch recent articles as fallback
      if (unique.length < 9) {
        getPublicArticles({ limit: 20 }).then(res3 => {
          const nonPolitics = (res3?.articles || []).filter(a => !unique.some(p => p.id === a.id));
          setFallbackArticles(nonPolitics.slice(0, 9 - unique.length));
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Combine politics + fallback to always fill 9 slots
  const allCards = useMemo(() => {
    const combined = [...dbPoliticsArticles, ...fallbackArticles];
    return combined.slice(0, 9);
  }, [dbPoliticsArticles, fallbackArticles]);

  const top3 = useMemo(() => allCards.slice(0, 3), [allCards]);
  const bottomGrid = useMemo(() => allCards.slice(3, 9), [allCards]);

  if (loading && allCards.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 mt-8 animate-pulse">
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
    <div className="mx-auto max-w-screen-xl px-4 mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'રાજકારણ' : language === 'hi' ? 'राजनीति' : 'Politics'}
        </span>
        <Link
          href="/category/politics"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* Top 3 columns — all from API */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
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
              <h3 className="text-[14px] md:text-[15.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2 min-h-[40px] md:min-h-[46px]">
                <AutoArticleTitle article={art} language={language} />
              </h3>
            </Link>

          </div>
        ))}
      </div>

      {/* Bottom 6-card grid — politics first, then other recent articles as fallback */}
      {bottomGrid.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 border-t border-border/40 pt-6 mt-6">
          {bottomGrid.map((art, idx) => {
            const isLastOdd = bottomGrid.length % 2 !== 0 && idx === bottomGrid.length - 1;

            return (
              <div
                key={art.id}
                className={`flex flex-col min-w-0 ${isLastOdd ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <Link
                  href={`/news/${art.slug}`}
                  className={`group flex ${isLastOdd ? 'flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0' : 'flex-col'}`}
                >
                  <div className={`relative aspect-[16/10] overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5 ${isLastOdd ? 'w-28 sm:w-full h-20 sm:h-auto shrink-0 mb-0 sm:mb-2.5' : 'w-full'}`}>
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
                    <h4 className="text-[12.5px] md:text-[13px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                      <AutoArticleTitle article={art} language={language} />
                    </h4>

                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { PoliticsSection };
