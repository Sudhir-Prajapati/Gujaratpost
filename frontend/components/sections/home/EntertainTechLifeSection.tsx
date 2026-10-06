'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import type { Article, Language } from '@/types';
import { getPublicCategories, getPublicArticles } from '@/lib/api';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

/* ─── Per-category brand colour config ───────────────────────────────────── */
type ColourScheme = {
  /* icon default */
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  /* icon active (hover) */
  iconActiveBg: string;
  iconActiveGlow: string;
  /* spinning ring colours */
  ringA: string;
  ringB: string;
  ringC: string;
  /* card hover */
  cardBorderHover: string;
  cardShadow: string;
  cardWash: string;
  /* bar */
  barColor: string;
  /* title hover */
  titleHover: string;
  /* article row */
  rowHoverBg: string;
  thumbShadow: string;
  artTitleHover: string;
  /* button */
  btnBorder: string;
  btnBg: string;
  btnColor: string;
  btnHoverBg: string;
  btnHoverShadow: string;
  /* dark overrides */
  iconBgDark: string;
  iconBorderDark: string;
  btnBorderDark: string;
  btnBgDark: string;
};

const HEALTH_SCHEME: ColourScheme = {
  iconBg:        'rgb(236 253 245)',
  iconBorder:    'rgb(110 231 183 / 0.6)',
  iconColor:     '#059669',
  iconActiveBg:  '#059669',
  iconActiveGlow:'rgba(5,150,105,0.15), 0 6px 18px rgba(5,150,105,0.35)',
  ringA: '#059669', ringB: '#34d399', ringC: '#d1fae5',
  cardBorderHover: 'rgba(5,150,105,0.5)',
  cardShadow: '0 0 0 1px rgba(5,150,105,0.12), 0 8px 32px rgba(5,150,105,0.1), 0 2px 8px rgba(0,0,0,0.05)',
  cardWash: 'radial-gradient(ellipse at 0% 0%, rgba(5,150,105,0.07) 0%, transparent 70%)',
  barColor:  '#059669',
  titleHover: '#059669',
  rowHoverBg: 'rgba(5,150,105,0.04)',
  thumbShadow: '0 4px 14px rgba(5,150,105,0.2)',
  artTitleHover: '#059669',
  btnBorder: 'rgb(110 231 183 / 0.7)', btnBg: 'rgb(236 253 245 / 0.5)', btnColor: '#059669',
  btnHoverBg: '#059669', btnHoverShadow: '0 4px 18px rgba(5,150,105,0.35)',
  iconBgDark: 'rgb(6 78 59 / 0.2)', iconBorderDark: 'rgb(6 78 59 / 0.4)',
  btnBorderDark: 'rgb(6 78 59 / 0.5)', btnBgDark: 'rgb(6 78 59 / 0.15)',
};

const ENTERTAIN_SCHEME: ColourScheme = {
  iconBg:        'rgb(245 243 255)',
  iconBorder:    'rgb(196 181 253 / 0.6)',
  iconColor:     '#7c3aed',
  iconActiveBg:  '#7c3aed',
  iconActiveGlow:'rgba(124,58,237,0.15), 0 6px 18px rgba(124,58,237,0.35)',
  ringA: '#7c3aed', ringB: '#a78bfa', ringC: '#ede9fe',
  cardBorderHover: 'rgba(124,58,237,0.5)',
  cardShadow: '0 0 0 1px rgba(124,58,237,0.12), 0 8px 32px rgba(124,58,237,0.1), 0 2px 8px rgba(0,0,0,0.05)',
  cardWash: 'radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.07) 0%, transparent 70%)',
  barColor:  '#7c3aed',
  titleHover: '#7c3aed',
  rowHoverBg: 'rgba(124,58,237,0.04)',
  thumbShadow: '0 4px 14px rgba(124,58,237,0.2)',
  artTitleHover: '#7c3aed',
  btnBorder: 'rgb(196 181 253 / 0.7)', btnBg: 'rgb(245 243 255 / 0.5)', btnColor: '#7c3aed',
  btnHoverBg: '#7c3aed', btnHoverShadow: '0 4px 18px rgba(124,58,237,0.35)',
  iconBgDark: 'rgb(46 16 101 / 0.2)', iconBorderDark: 'rgb(46 16 101 / 0.4)',
  btnBorderDark: 'rgb(46 16 101 / 0.5)', btnBgDark: 'rgb(46 16 101 / 0.15)',
};

const TECH_SCHEME: ColourScheme = {
  iconBg:        'rgb(239 246 255)',
  iconBorder:    'rgb(147 197 253 / 0.6)',
  iconColor:     '#2563eb',
  iconActiveBg:  '#2563eb',
  iconActiveGlow:'rgba(37,99,235,0.15), 0 6px 18px rgba(37,99,235,0.35)',
  ringA: '#2563eb', ringB: '#60a5fa', ringC: '#dbeafe',
  cardBorderHover: 'rgba(37,99,235,0.5)',
  cardShadow: '0 0 0 1px rgba(37,99,235,0.12), 0 8px 32px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.05)',
  cardWash: 'radial-gradient(ellipse at 0% 0%, rgba(37,99,235,0.07) 0%, transparent 70%)',
  barColor:  '#2563eb',
  titleHover: '#2563eb',
  rowHoverBg: 'rgba(37,99,235,0.04)',
  thumbShadow: '0 4px 14px rgba(37,99,235,0.2)',
  artTitleHover: '#2563eb',
  btnBorder: 'rgb(147 197 253 / 0.7)', btnBg: 'rgb(239 246 255 / 0.5)', btnColor: '#2563eb',
  btnHoverBg: '#2563eb', btnHoverShadow: '0 4px 18px rgba(37,99,235,0.35)',
  iconBgDark: 'rgb(23 37 84 / 0.2)', iconBorderDark: 'rgb(23 37 84 / 0.4)',
  btnBorderDark: 'rgb(23 37 84 / 0.5)', btnBgDark: 'rgb(23 37 84 / 0.15)',
};

function getScheme(slug: string): ColourScheme {
  const s = (slug || '').toLowerCase();
  if (s === 'health') return HEALTH_SCHEME;
  if (s === 'entertainment' || s === 'manoranjan') return ENTERTAIN_SCHEME;
  if (s === 'technology') return TECH_SCHEME;
  return HEALTH_SCHEME;
}

/* ─── Entertainment · Tech · Health 3-Column Section ─────────────────── */
export default function EntertainTechLifeSection({
  language,
  initialArticles,
  initialCategoryArticles = {},
}: {
  language: Language;
  initialArticles?: Article[];
  initialCategoryArticles?: Record<string, Article[]>;
}) {
  const buildInitialMap = (): Record<string, Article[]> => {
    const map: Record<string, Article[]> = {};
    if (initialCategoryArticles['health']?.length) map['health'] = initialCategoryArticles['health'].slice(0, 4);
    const entertainmentKey = initialCategoryArticles['manoranjan']?.length ? 'manoranjan' : 'entertainment';
    if (initialCategoryArticles[entertainmentKey]?.length) map['manoranjan'] = initialCategoryArticles[entertainmentKey].slice(0, 4);
    if (initialCategoryArticles['technology']?.length) map['technology'] = initialCategoryArticles['technology'].slice(0, 4);
    return map;
  };

  const [categories, setCategories] = useState<any[]>([]);
  const [categoryArticlesMap, setCategoryArticlesMap] = useState<Record<string, Article[]>>(buildInitialMap);
  const [loading, setLoading] = useState(Object.keys(buildInitialMap()).length < 3);

  useEffect(() => {
    const existingMap = categoryArticlesMap;
    const needsHealth = !existingMap['health'] || existingMap['health'].length < 2;
    const needsEntertain = !existingMap['manoranjan'] || existingMap['manoranjan'].length < 2;
    const needsTech = !existingMap['technology'] || existingMap['technology'].length < 2;

    getPublicCategories()
      .then(async (cats) => {
        const TARGET_SLUGS = ['health', 'entertainment', 'manoranjan', 'technology'];
        const matchedCats = Array.isArray(cats)
          ? cats.filter((c: any) => TARGET_SLUGS.includes((c.slug || '').toLowerCase()))
          : [];

        const fallbackCats = [
          { id: 'health',       slug: 'health',      name: 'Health',        nameGu: 'હેલ્થ',     nameHi: 'स्वास्थ्य' },
          { id: 'entertainment',slug: 'manoranjan',  name: 'Entertainment', nameGu: 'મનોરંજન',   nameHi: 'मनोरंजन' },
          { id: 'technology',   slug: 'technology',  name: 'Technology',    nameGu: 'ટેકનોલોજી', nameHi: 'टेक्नोलॉजी' },
        ];

        const finalCats: any[] = [];
        ['health', 'entertainment', 'technology'].forEach((target) => {
          const match = matchedCats.find((c) => {
            const s = (c.slug || '').toLowerCase();
            return s === target || (target === 'entertainment' && s === 'manoranjan');
          });
          finalCats.push(match
            ? { ...match, id: match.id || match.slug || target }
            : fallbackCats.find((f) => f.slug === target || (target === 'entertainment' && f.slug === 'manoranjan'))!
          );
        });

        setCategories(finalCats);

        const articlePromises = finalCats.map(async (cat: any) => {
          const targetSlug = (cat.slug || '').toLowerCase();
          const needsThis = targetSlug === 'health' ? needsHealth
            : (targetSlug === 'manoranjan' || targetSlug === 'entertainment') ? needsEntertain
            : needsTech;

          if (!needsThis) {
            const key = targetSlug === 'entertainment' ? 'manoranjan' : targetSlug;
            return { slug: targetSlug, articles: existingMap[key] || [] };
          }
          if (initialArticles?.length) {
            const matched = initialArticles.filter((a: any) => {
              const cSlug = (a.category?.slug || a.categorySlug || a.category || '').toLowerCase();
              return cSlug === targetSlug || (targetSlug === 'manoranjan' && (cSlug === 'entertainment' || cSlug === 'manoranjan'));
            });
            if (matched.length >= 2) return { slug: targetSlug, articles: matched.slice(0, 4) };
          }
          try {
            const res = await getPublicArticles({ categorySlug: cat.slug, limit: 4 });
            return { slug: cat.slug, articles: res.articles || [] };
          } catch {
            return { slug: cat.slug, articles: [] };
          }
        });

        const results = await Promise.all(articlePromises);
        const map: Record<string, Article[]> = { ...existingMap };
        results.forEach((r) => { map[r.slug] = r.articles; });
        setCategoryArticlesMap(map);
      })
      .catch((err) => console.warn('Error loading 3-column dynamic section:', err))
      .finally(() => setLoading(false));
  }, []);

  type DisplayItem = { id?: string; slug?: string; img: string; title: string; titleGu: string };

  const getCategoryIcon = (slug: string, c: ColourScheme) => {
    const s = slug.toLowerCase();
    const svgClass = `h-4 w-4`;
    if (s === 'health') return (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 9v6m-3-3h6" />
      </svg>
    );
    if (s === 'entertainment' || s === 'manoranjan') return (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 3v18M17 3v18M3 7.5h18M3 12h18M3 16.5h18" />
      </svg>
    );
    if (s === 'technology') return (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect width="16" height="16" x="4" y="4" rx="2" />
        <rect width="6" height="6" x="9" y="9" rx="1" />
        <path d="M15 2v2M9 2v2M15 20v2M9 20v2M20 15h2M20 9h2M2 15h2M2 9h2" />
      </svg>
    );
    return (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      </svg>
    );
  };

  /* ── Card renderer with per-colour inline styles ─────────────────────── */
  const col = (
    titleGu: string,
    titleEn: string,
    href: string,
    items: DisplayItem[],
    btnTextGu: string,
    btnTextEn: string,
    icon: React.ReactNode,
    c: ColourScheme,
    uid: string           // unique id so CSS selectors don't bleed between cards
  ) => (
    <div className={`cat-card-${uid} bg-card border border-border/80 rounded-xl p-3.5 sm:p-5 shadow-sm flex flex-col justify-between min-w-0`}>
      <style>{`
        @keyframes ring-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Card shell ─── */
        .cat-card-${uid} {
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .cat-card-${uid}::after {
          content: '';
          position: absolute;
          inset: 0;
          background: ${c.cardWash};
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }
        .cat-card-${uid}:hover::after { opacity: 1; }
        .cat-card-${uid}:hover {
          border-color: ${c.cardBorderHover};
          box-shadow: ${c.cardShadow};
        }
        .cat-card-${uid} > * { position: relative; z-index: 1; }

        /* ── Title ─── */
        .cat-card-${uid} .cc-title {
          color: inherit;
          transition: color 0.25s ease;
        }
        .cat-card-${uid}:hover .cc-title { color: ${c.titleHover}; }

        /* ── Accent bar ─── */
        .cat-card-${uid} .cc-bar {
          height: 2.5px;
          background: ${c.barColor};
          border-radius: 9999px;
          margin-top: 0.5rem;
          width: 2rem;
          transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cat-card-${uid}:hover .cc-bar { width: 3.5rem; }

        /* ── Icon badge ─── */
        .cat-card-${uid} .cc-badge {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px;
          flex-shrink: 0; cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cat-card-${uid} .cc-badge:hover,
        .cat-card-${uid}:hover .cc-badge { transform: scale(1.1); }

        .cat-card-${uid} .cc-badge::before {
          content: '';
          position: absolute; inset: -2px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, ${c.ringA} 0%, ${c.ringB} 25%, ${c.ringC} 50%, ${c.ringB} 75%, ${c.ringA} 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
          animation: ring-spin-${uid} 1.6s linear infinite;
          animation-play-state: paused;
        }
        .cat-card-${uid} .cc-badge:hover::before,
        .cat-card-${uid}:hover .cc-badge::before {
          opacity: 1;
          animation-play-state: running;
        }

        .cat-card-${uid} .cc-inner {
          position: relative; z-index: 1;
          width: 34px; height: 34px;
          border-radius: 50%;
          background: ${c.iconBg};
          border: 1.5px solid ${c.iconBorder};
          display: flex; align-items: center; justify-content: center;
          transition: background 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .dark .cat-card-${uid} .cc-inner {
          background: ${c.iconBgDark};
          border-color: ${c.iconBorderDark};
        }
        .cat-card-${uid} .cc-badge:hover .cc-inner,
        .cat-card-${uid}:hover .cc-inner {
          background: ${c.iconActiveBg};
          border-color: ${c.iconActiveBg};
          box-shadow: 0 0 0 4px ${c.iconActiveGlow};
        }
        .cat-card-${uid} .cc-inner svg {
          color: ${c.iconColor};
          transition: color 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cat-card-${uid} .cc-badge:hover .cc-inner svg,
        .cat-card-${uid}:hover .cc-inner svg {
          color: #ffffff;
          transform: scale(1.15) rotate(-8deg);
        }

        /* ── Article rows ─── */
        .cat-card-${uid} .cc-row {
          display: flex; gap: 0.75rem;
          padding: 0.5rem 2px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .cat-card-${uid} .cc-row:hover { background: ${c.rowHoverBg}; }

        .cat-card-${uid} .cc-thumb {
          position: relative;
          height: 86px; width: 128px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.08);
          transition: box-shadow 0.25s ease;
        }
        .cat-card-${uid} .cc-row:hover .cc-thumb { box-shadow: ${c.thumbShadow}; }
        .cat-card-${uid} .cc-thumb img { transition: transform 0.35s ease !important; }
        .cat-card-${uid} .cc-row:hover .cc-thumb img { transform: scale(1.08) !important; }

        .cat-card-${uid} .cc-art-title {
          font-size: 16px; font-weight: 800; line-height: 1.32;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
          overflow: hidden; color: inherit;
          transition: color 0.2s ease;
        }
        .cat-card-${uid} .cc-row:hover .cc-art-title { color: ${c.artTitleHover}; }

        /* ── CTA button ─── */
        .cat-card-${uid} .cc-btn {
          display: block; width: 100%;
          margin-top: 0.625rem; text-align: center;
          font-weight: 800; font-size: 14px;
          padding: 0.625rem 0;
          border-radius: 0.5rem;
          border: 1.5px solid ${c.btnBorder};
          background: ${c.btnBg};
          color: ${c.btnColor};
          transition:
            background 0.28s ease, color 0.28s ease,
            border-color 0.28s ease, box-shadow 0.28s ease,
            transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          user-select: none;
        }
        .dark .cat-card-${uid} .cc-btn {
          border-color: ${c.btnBorderDark};
          background: ${c.btnBgDark};
        }
        .cat-card-${uid} .cc-btn:hover,
        .cat-card-${uid}:hover .cc-btn {
          background: ${c.btnHoverBg};
          color: #ffffff;
          border-color: ${c.btnHoverBg};
          box-shadow: ${c.btnHoverShadow};
          transform: translateY(-1px);
        }
      `}</style>

      {/* Header */}
      <div>
        <div className="flex flex-col mb-4 select-none">
          <div className="flex items-center gap-2.5">
            <div className="cc-badge">
              <div className="cc-inner">{icon}</div>
            </div>
            <Link href={href}>
              <h3 className="cc-title text-[16px] md:text-[17px] font-black leading-none">
                {language === 'gu' ? titleGu : titleEn}
              </h3>
            </Link>
          </div>
          <div className="cc-bar" />
        </div>

        {/* Article rows */}
        <div className="flex flex-col divide-y divide-border/40">
          {items.map((a, i) => (
            <Link
              key={a.id || a.slug || `art-${i}`}
              href={a.slug ? `/news/${a.slug}` : href}
              className="cc-row items-center justify-between"
            >
              <div className="flex flex-col justify-center min-w-0 flex-1 pr-1">
                <h4 className="cc-art-title">
                  <AutoTranslateString text={a.titleGu || a.title} language={language} />
                </h4>
              </div>
              <div className="cc-thumb bg-muted shrink-0">
                <Image src={a.img} alt={a.titleGu} fill sizes="105px" className="object-cover" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link href={href} className="cc-btn">
        {language === 'gu' ? btnTextGu : btnTextEn}
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 mt-2.5 py-6 flex justify-center items-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[#B3121B] mr-2" />
        <span>લોડ થઈ રહ્યું છે...</span>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 md:pb-2.5 mb-2.5 md:mb-4">
        <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu'
            ? 'હેલ્થ   •   મનોરંજન   •   ટેકનોલોજી'
            : language === 'hi'
              ? 'स्वास्थ्य   •   मनोरंजन   •   टेक्नोलॉजी'
              : 'Health   •   Entertainment   •   Technology'}
        </span>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-6">
        {categories.map((cat, catIdx) => {
          const scheme = getScheme(cat.slug);
          const uid = cat.slug?.replace(/[^a-z0-9]/g, '') || `col${catIdx}`;
          const catArticles = categoryArticlesMap[cat.slug] || [];
          const items: DisplayItem[] = catArticles.map((art) => ({
            id: art.id,
            slug: art.slug,
            img: art.image || '/assets/demo/2.jpg',
            title: art.title,
            titleGu: art.titleGu || art.title,
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
                getCategoryIcon(cat.slug, scheme),
                scheme,
                uid,
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export { EntertainTechLifeSection };
