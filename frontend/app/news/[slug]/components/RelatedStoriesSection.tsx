'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, formatDate, getCategoryLabel, getArticleTitle } from '@/data';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';
import MobileHeroArticleCard from '@/components/ui/MobileHeroArticleCard';
import { filterUniqueArticles } from '@/lib/articleDeduplication';
import { sortArticlesByNewest } from '@/lib/articleCategory';
import { SocialIcon } from '@/components/ui/SocialLinks';

interface RelatedStoriesSectionProps {
  article: Article;
  related: Article[];
  language: Language;
  savedIds: string[];
  relatedLimit: number;
  setRelatedLimit: React.Dispatch<React.SetStateAction<number>>;
  getCardThumbnail: (item: Article, index: number) => string;
  DEMO_THUMBNAILS: string[];
  uiLabel: (language: Language, values: { en: string; gu: string; hi: string }) => string;
  excludeArticles?: Article[];
  fallbackArticles?: Article[];
}

export default function RelatedStoriesSection({
  article,
  related,
  language,
  savedIds,
  relatedLimit,
  setRelatedLimit,
  getCardThumbnail,
  DEMO_THUMBNAILS,
  uiLabel,
  excludeArticles,
  fallbackArticles,
}: RelatedStoriesSectionProps) {
  const displayRelated = React.useMemo(() => {
    const excludeList = [article, ...(excludeArticles || [])];
    const candidatePool = [...(related || []), ...(fallbackArticles || [])];
    const result = filterUniqueArticles(candidatePool, excludeList);
    return sortArticlesByNewest(result);
  }, [related, fallbackArticles, excludeArticles, article]);

  if (!displayRelated || displayRelated.length === 0) return null;

  return (
    <section className="art-related select-none w-full mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5">
          <span className="block w-[4px] h-6 rounded-full bg-[#B3121B]"></span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          {uiLabel(language, { en: 'Related Stories', gu: 'સંબંધિત સમાચાર', hi: '\u0938\u0902\u092c\u0902\u0927\u093f\u0924 \u0916\u092c\u0930\u0947\u0902' })}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent"></div>
      </div>

      {/* Mobile view (< md): Modern separated cards with Category Pill & WhatsApp Share */}
      <div className="flex flex-col gap-3.5 md:hidden">
        {displayRelated.slice(0, relatedLimit).map((item, index) => (
          <MobileHeroArticleCard
            key={`rel-mob-${item.id || index}`}
            article={item}
            language={language}
            index={index}
          />
        ))}
      </div>

      {/* Desktop view (>= md): Modern Separated Cards with Bottom Shadow & Share */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayRelated.slice(0, relatedLimit).map((item, index) => {
          const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
          const isSaved = savedIds.includes(item.id);
          return (
            <div key={item.id} className="relative group flex flex-col">
              <Link
                href={`/news/${item.slug}`}
                className="group flex flex-col justify-between h-full p-3.5 rounded-2xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_14px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] hover:shadow-lg hover:border-accent/40 transition-all duration-300 text-left"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl mb-2.5 bg-zinc-100 dark:bg-neutral-900 shadow-2xs">
                    <Image
                      src={getCardThumbnail(item, index)}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
                      }}
                    />
                    {isSaved && (
                      <span className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/90 p-1.5 rounded-full text-xs shadow-md">
                        🔖
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-2 leading-snug text-[14.5px] font-bold text-foreground group-hover:text-[#B3121B] transition-colors mb-2">
                    <AutoArticleTitle article={item} language={language} />
                  </h3>
                </div>

                {/* Bottom Row: Category Pill & WhatsApp Share Button */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B3121B]" />
                    <span>{itemCategory || 'સમાચાર'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const title = getArticleTitle(item, language);
                      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/news/${item.slug}`;
                      const text = `${title}\n\n${url}`;
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        navigator.share({ title, url, text }).catch(() => {
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                        });
                      } else {
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11.5px] font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs cursor-pointer select-none"
                    aria-label="Share"
                  >
                    <SocialIcon platform="whatsapp" className="w-3.5 h-3.5 fill-current" />
                    <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'શેર' : 'Share'}</span>
                  </button>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-4">
        {relatedLimit < displayRelated.length ? (
          <button
            type="button"
            onClick={() => setRelatedLimit((prev) => prev + 4)}
            className="group flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#B3121B] text-[#B3121B] hover:bg-[#B3121B] hover:text-white transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(179,18,27,0.3)] active:scale-95 cursor-pointer"
          >
            <span className="text-base md:text-lg font-black tracking-wide leading-none">
              {uiLabel(language, { en: 'View More', gu: 'વધુ જુઓ', hi: 'अधिक देखें' })}
            </span>
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-none stroke-current stroke-[2.5] transition-transform duration-300 group-hover:translate-y-0.5 shrink-0" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ) : (
          <Link
            href={`/category/${(article.category || 'all').toLowerCase().replace(/\s+/g, '-')}`}
            className="group flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#B3121B] text-[#B3121B] hover:bg-[#B3121B] hover:text-white transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(179,18,27,0.3)] active:scale-95 cursor-pointer"
          >
            <span className="text-base md:text-lg font-black tracking-wide leading-none">
              {uiLabel(language, { en: 'View All News', gu: 'બધા સમાચાર જુઓ', hi: 'सभी समाचार देखें' })}
            </span>
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-none stroke-current stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5 shrink-0" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>
    </section>
  );
}
