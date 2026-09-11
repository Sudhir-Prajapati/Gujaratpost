'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ChevronRight, ArrowRight } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatDate, getArticleTitle, ARTICLES } from '@/data';
import { getPublicArticles } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoArticleExcerpt } from '@/components/ui/AutoTranslatedArticleText';

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  varsad: ['varsad', 'weather', 'rain', 'વરસાદ', 'હવામાન'],
  weather: ['weather', 'varsad', 'rain', 'વરસાદ', 'હવામાન'],
  rajkaran: ['rajkaran', 'politics', 'રાજકારણ'],
  politics: ['politics', 'rajkaran', 'રાજકારણ'],
  sports: ['sports', 'ramat-jagat', 'રમત-જગત', 'રમતગમત'],
  business: ['business', 'vepar', 'વેપાર'],
  education: ['education', 'shikshan', 'શિક્ષણ'],
  lifestyle: ['lifestyle', 'લાઇફસ્ટાઇલ'],
  election: ['election', 'election-2027', 'ચૂંટણી'],
  'gold-silver': ['gold-silver', 'gold', 'silver', 'સોના-ચાંદી'],
  health: ['health', 'helth', 'હેલ્થ', 'આરોગ્ય'],
  entertainment: ['entertainment', 'manoranjan', 'મનોરંજન'],
  technology: ['technology', 'tech', 'ટેકનોલોજી'],
};

/* ─── Dynamic Generic Category Section ─────────────────────────────────── */
export default function DynamicCategorySection({ category, language, initialArticles }: { category: any; language: Language; initialArticles?: Article[] }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const catSlug = typeof category === 'string' ? category : (category?.slug || '');

  useEffect(() => {
    if (!catSlug) return;
    setLoading(true);

    const slugLower = catSlug.toLowerCase().trim();
    const synonyms = CATEGORY_SYNONYMS[slugLower] || [slugLower];

    const targetSlug = slugLower;
    const targetName = (typeof category === 'object' ? (category?.name || '') : catSlug).toLowerCase().trim();
    const targetGu = (typeof category === 'object' ? (category?.nameGu || '') : catSlug).toLowerCase().trim();
    const searchTerms = Array.from(new Set([targetSlug, targetName, targetGu, ...synonyms.map(s => s.toLowerCase())])).filter(Boolean);

    const filterFn = (art: any) => {
      const artCatSlug = (art.category?.slug || art.categorySlug || art.category || '').toLowerCase().trim();
      const artCatName = (art.category?.name || art.categoryName || '').toLowerCase().trim();
      const artCatNameGu = (art.category?.nameGu || '').toLowerCase().trim();
      const artCatId = art.category?.id || art.categoryId;

      const artTitle = (art.title || '').toLowerCase();
      const artTitleGu = (art.titleGu || '').toLowerCase();
      const artExcerptGu = (art.excerptGu || art.excerpt || '').toLowerCase();

      return searchTerms.some(term => {
        if (!term || term.length < 2) return false;
        return (
          artCatSlug === term ||
          artCatName === term ||
          artCatNameGu === term ||
          (category?.id && artCatId === category.id) ||
          (term.length >= 3 && (artTitle.includes(term) || artTitleGu.includes(term) || artExcerptGu.includes(term)))
        );
      });
    };

    if (initialArticles && initialArticles.length > 0) {
      const matched = initialArticles.filter(filterFn);
      if (matched.length >= 3) {
        const sortedMatched = [...matched].sort((a, b) => {
          const aTime = new Date(a.publishedAt || (a as any).createdAt || 0).getTime();
          const bTime = new Date(b.publishedAt || (b as any).createdAt || 0).getTime();
          return bTime - aTime;
        });
        setArticles(sortedMatched);
        setLoading(false);
        return;
      }
    }

    getPublicArticles({ categorySlug: catSlug, limit: 12 }).then((res1) => {
      let combined = res1?.articles || [];
      if (combined.length < 3 && synonyms.length > 1) {
        getPublicArticles({ limit: 20 }).then((res2) => {
          const combined2 = [...combined, ...(res2?.articles || [])];
          const uniqueMap = new Map();
          combined2.forEach(a => { if (a && a.id) uniqueMap.set(a.id, a); });
          const categoryFiltered = Array.from(uniqueMap.values()).filter(filterFn);
          const sorted = [...categoryFiltered].sort((a, b) => {
            const aTime = new Date(a.publishedAt || (a as any).createdAt || 0).getTime();
            const bTime = new Date(b.publishedAt || (b as any).createdAt || 0).getTime();
            return bTime - aTime;
          });
          setArticles(sorted);
          setLoading(false);
        });
        return;
      }
      const categoryFiltered = combined.filter(filterFn);
      const sorted = [...categoryFiltered].sort((a, b) => {
        const aTime = new Date(a.publishedAt || (a as any).createdAt || 0).getTime();
        const bTime = new Date(b.publishedAt || (b as any).createdAt || 0).getTime();
        return bTime - aTime;
      });
      setArticles(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [catSlug, initialArticles]);



  const catNameGu = typeof category === 'object' ? (category?.nameGu || category?.name || catSlug) : catSlug;
  const catNameHi = typeof category === 'object' ? (category?.nameHi || category?.name || catSlug) : catSlug;
  const catNameEn = typeof category === 'object' ? (category?.name || catSlug) : catSlug;

  const categoryTitle = language === 'gu' ? catNameGu : (language === 'hi' ? catNameHi : catNameEn);

  if (loading) {
    return (
      <section className="mx-auto max-w-screen-xl px-4 mt-10 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted/60 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-64 rounded-xl bg-muted/30" />
          <div className="lg:col-span-5 h-64 rounded-xl bg-muted/30" />
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section className="mx-auto max-w-screen-xl px-4 mt-10">
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-4 select-none">
          <span className="bg-[#B3121B] text-white px-5 py-2 text-[16px] md:text-[18px] font-black rounded-lg leading-none tracking-tight">
            {categoryTitle}
          </span>
          <Link
            href={`/category/${catSlug}`}
            className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
          >
            {language === 'gu' ? 'બધા જુઓ →' : 'View All →'}
          </Link>
        </div>
        <div className="p-8 rounded-xl border border-dashed border-border/80 text-center text-muted-foreground bg-muted/10">
          <p className="text-sm font-extrabold">
            {language === 'gu'
              ? `"${categoryTitle}" કેટેગરીમાં ટૂંક સમયમાં નવા સમાચાર મૂકવામાં આવશે`
              : `Latest articles for "${categoryTitle}" will be published soon`}
          </p>
        </div>
      </section>
    );
  }

  const lead = articles[0]; // FIRST COME LATEST UPLOADED ARTICLE
  const sideArticles = articles.slice(1, 6);
  const isSingleArticle = articles.length === 1;

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-10">
      {/* Section Header - ALWAYS RED BRAND TAG */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-4 select-none">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg leading-none tracking-tight">
          {categoryTitle}
        </span>
        <Link
          href={`/category/${catSlug}`}
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'બધા જુઓ →' : 'View All →'}
        </Link>
      </div>

      {/* DYNAMIC CONTENT LAYOUT BASED ON ARTICLE COUNT */}
      {isSingleArticle ? (
        /* SINGLE ARTICLE: FULL WIDTH BANNER CARD (THURS NO EMPTY RIGHT COLUMN) */
        <div className="bg-card border border-border/80 rounded-xl p-4 md:p-6 shadow-sm group">
          <Link href={`/news/${lead.slug}`} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 relative h-[240px] sm:h-[300px] md:h-[340px] w-full overflow-hidden rounded-xl bg-muted border border-border/20">
              <ArticleMedia
                src={lead.image || (lead as any).imageUrl || '/assets/demo/1.jpg'}
                alt={getArticleTitle(lead, language)}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 bg-[#B3121B] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-sm">
                {language === 'gu' ? 'તાજા સમાચાર' : 'LATEST'}
              </span>
            </div>

            <div className="md:col-span-5 flex flex-col justify-center space-y-3">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wide text-[#B3121B] bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded w-max">
                {categoryTitle}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-[#B3121B] transition-colors leading-snug">
                <AutoArticleTitle article={lead} language={language} />
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                <AutoArticleExcerpt article={lead} language={language} />
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground font-semibold border-t border-border/40">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>{formatDate(lead.publishedAt || (lead as any).createdAt, language)}</span>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        /* MULTIPLE ARTICLES: MAIN FEATURED CARD ON LEFT + SIDE LIST ON RIGHT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Featured Lead Card (7 cols) */}
          {lead ? (
            <div className="lg:col-span-7 bg-card border border-border/80 rounded-xl p-4 shadow-sm group">
              <Link href={`/news/${lead.slug}`} className="flex flex-col gap-3">
                <div className="relative h-[240px] md:h-[300px] w-full overflow-hidden rounded-lg bg-muted border border-border/20">
                  <ArticleMedia
                    src={lead.image || (lead as any).imageUrl || '/assets/demo/1.jpg'}
                    alt={getArticleTitle(lead, language)}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-[#B3121B] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-sm">
                    {language === 'gu' ? 'તાજા સમાચાર' : 'LATEST'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#B3121B] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">
                    {categoryTitle}
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-foreground mt-2 line-clamp-2 group-hover:text-[#B3121B] transition-colors leading-snug">
                    <AutoArticleTitle article={lead} language={language} />
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1.5 line-clamp-2 font-medium">
                    <AutoArticleExcerpt article={lead} language={language} />
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground font-semibold">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{formatDate(lead.publishedAt || (lead as any).createdAt, language)}</span>
                  </div>
                </div>
              </Link>
            </div>
          ) : null}

          {/* Side Cards List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col divide-y divide-border/50 bg-card border border-border/80 rounded-xl p-4 shadow-sm">
            {sideArticles.map((art, sIdx) => (
              <Link
                key={`dyn-${category}-${art.id}-${sIdx}`}
                href={`/news/${art.slug}`}
                className="group flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/10 transition-colors"
              >
                <div className="relative h-[72px] w-[95px] shrink-0 overflow-hidden rounded-lg bg-muted border border-border/20">
                  <ArticleMedia
                    src={art.image || (art as any).imageUrl || '/assets/demo/2.jpg'}
                    alt={getArticleTitle(art, language)}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                  <h4 className="text-[13px] font-extrabold text-foreground leading-snug line-clamp-2 group-hover:text-[#B3121B] transition-colors">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{formatDate(art.publishedAt || (art as any).createdAt, language)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
export { DynamicCategorySection };

