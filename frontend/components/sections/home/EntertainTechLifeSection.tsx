'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Sparkles, ChevronRight, Clock, Loader2 } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime } from '@/data';
import { getPublicCategories, getPublicArticles } from '@/lib/api';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

/* ─── Entertainment · Tech · Health 3-Column Section ─────────────────── */
export default function EntertainTechLifeSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryArticlesMap, setCategoryArticlesMap] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicCategories()
      .then(async (cats) => {
        const TARGET_SLUGS = ['health', 'entertainment', 'manoranjan', 'technology'];
        let matchedCats = Array.isArray(cats)
          ? cats.filter((c: any) => TARGET_SLUGS.includes((c.slug || '').toLowerCase()))
          : [];

        // Fallbacks if specific category records are missing in DB
        const fallbackCats = [
          { id: 'health', slug: 'health', name: 'Health', nameGu: 'હેલ્થ', nameHi: 'स्वास्थ्य' },
          { id: 'entertainment', slug: 'manoranjan', name: 'Entertainment', nameGu: 'મનોરંજન', nameHi: 'मनोरंजन' },
          { id: 'technology', slug: 'technology', name: 'Technology', nameGu: 'ટેકનોલોજી', nameHi: 'टेक्नोलॉजी' },
        ];

        // Combine to ensure we have exactly 3 target columns (Health, Entertainment, Technology)
        const finalCats: any[] = [];
        ['health', 'entertainment', 'technology'].forEach((target) => {
          const match = matchedCats.find((c) => {
            const s = (c.slug || '').toLowerCase();
            return s === target || (target === 'entertainment' && s === 'manoranjan');
          });
          if (match) {
            finalCats.push({ ...match, id: match.id || match.slug || target });
          } else {
            const fallback = fallbackCats.find((f) => f.slug === target || (target === 'entertainment' && f.slug === 'manoranjan'));
            if (fallback) finalCats.push(fallback);
          }
        });

        setCategories(finalCats);

        // Fetch articles for each of the 3 target categories in parallel (skip if initialArticles has matching items)
        const articlePromises = finalCats.map(async (cat: any) => {
          const targetSlug = (cat.slug || '').toLowerCase();
          if (initialArticles && initialArticles.length > 0) {
            const matched = initialArticles.filter((a: any) => {
              const cSlug = (a.category?.slug || a.categorySlug || a.category || '').toLowerCase();
              return cSlug === targetSlug || (targetSlug === 'manoranjan' && (cSlug === 'entertainment' || cSlug === 'manoranjan'));
            });
            if (matched.length >= 2) {
              return { slug: cat.slug, articles: matched.slice(0, 4) };
            }
          }
          try {
            const res = await getPublicArticles({ categorySlug: cat.slug, limit: 4 });
            return { slug: cat.slug, articles: res.articles || [] };
          } catch (e) {
            console.warn(`Error fetching articles for category ${cat.slug}:`, e);
            return { slug: cat.slug, articles: [] };
          }
        });

        const results = await Promise.all(articlePromises);
        const map: Record<string, Article[]> = {};
        results.forEach((r) => {
          map[r.slug] = r.articles;
        });
        setCategoryArticlesMap(map);
      })
      .catch((err) => console.warn('Error loading 3-column dynamic section:', err))
      .finally(() => setLoading(false));
  }, [initialArticles]);

  type DisplayItem = { id?: string; slug?: string; img: string; title: string; titleGu: string; age: string };

  const getCategoryIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s === 'health') {
      return (
        <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 9v6m-3-3h6" />
        </svg>
      );
    }
    if (s === 'entertainment' || s === 'manoranjan') {
      return (
        <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18M17 3v18M3 7.5h18M3 12h18M3 16.5h18" />
        </svg>
      );
    }
    if (s === 'technology') {
      return (
        <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect width="16" height="16" x="4" y="4" rx="2" />
          <rect width="6" height="6" x="9" y="9" rx="1" />
          <path d="M15 2v2M9 2v2M15 20v2M9 20v2M20 15h2M20 9h2M2 15h2M2 9h2" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-[#B3121B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      </svg>
    );
  };

  const col = (
    titleGu: string,
    titleEn: string,
    href: string,
    items: DisplayItem[],
    btnTextGu: string,
    btnTextEn: string,
    icon: React.ReactNode
  ) => (
    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm flex flex-col justify-between min-w-0">
      <div>
        <div className="flex flex-col mb-4 select-none">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <Link href={href} className="flex items-center gap-1 group/title">
              <h3 className="text-[16px] md:text-[17px] font-black text-foreground leading-none group-hover:text-[#B3121B] transition-colors">
                {language === 'gu' ? titleGu : titleEn}
              </h3>
            </Link>
          </div>
          <div className="h-0.5 w-8 bg-[#B3121B] mt-2 rounded-full" />
        </div>

        <div className="flex flex-col divide-y divide-border/40">
          {items.map((a, i) => (
            <Link
              key={a.id || a.slug || `art-${i}`}
              href={a.slug ? `/news/${a.slug}` : href}
              className="group flex gap-3 py-3 hover:bg-muted/10 transition-colors"
            >
              <div className="relative h-[68px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-muted border border-border/20">
                <Image
                  src={a.img}
                  alt={a.titleGu}
                  fill
                  sizes="84px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                <h4 className="text-[12.5px] md:text-[13px] font-black text-foreground leading-snug line-clamp-2 group-hover:text-[#B3121B] transition-colors">
                  <AutoTranslateString text={a.titleGu || a.title} language={language} />
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-semibold select-none">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>{a.age}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href={href}
        className="mt-4 w-full border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 text-[#B3121B] font-extrabold text-[12.5px] md:text-[13px] py-2.5 rounded-lg text-center hover:bg-[#B3121B] hover:text-white transition-all block select-none"
      >
        {language === 'gu' ? btnTextGu : btnTextEn}
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 mt-8 py-10 flex justify-center items-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[#B3121B] mr-2" />
        <span>લોડ થઈ રહ્યું છે...</span>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu'
            ? 'હેલ્થ   •   મનોરંજન   •   ટેકનોલોજી'
            : language === 'hi'
              ? 'स्वास्थ्य   •   मनोरंजन   •   टेक्नोलॉजी'
              : 'Health   •   Entertainment   •   Technology'}
        </span>
      </div>

      {/* Dynamic 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, catIdx) => {
          const catArticles = categoryArticlesMap[cat.slug] || [];
          const items = catArticles.map((art) => ({
            id: art.id,
            slug: art.slug,
            img: art.image || '/assets/demo/2.jpg',
            title: art.title,
            titleGu: art.titleGu || art.title,
            age: formatTime(art.publishedAt),
          }));

          return (
            <div key={cat.id || cat.slug || `cat-col-${catIdx}`}>
              {col(
                cat.nameGu || cat.name,
                cat.name,
                `/category/${cat.slug}`,
                items,
                `વધુ ${cat.nameGu || cat.name} સમાચાર જુઓ`,
                `More ${cat.name} News`,
                getCategoryIcon(cat.slug)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export { EntertainTechLifeSection };

