'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, formatDate, getCategoryLabel } from '@/data';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

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
}: RelatedStoriesSectionProps) {
  if (!related || related.length === 0) return null;

  return (
    <section className="art-related select-none w-full mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5">
          <span className="block w-[4px] h-6 rounded-full bg-[#B3121B]"></span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          {uiLabel(language, { en: 'Related Stories', gu: 'સંબંધિત સમાચાર', hi: 'સંબંધીત ખબરેં' })}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {related.slice(0, relatedLimit).map((item, index) => {
          const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
          const isSaved = savedIds.includes(item.id);
          return (
            <div key={item.id} className="zoomhost relative group flex flex-col">
              <Link href={`/news/${item.slug}`} className="s-standard flex flex-col group">
                <div className="imgwrap relative aspect-[3/2] overflow-hidden rounded-md mb-2 bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={getCardThumbnail(item, index)}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
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
                <div>
                  <span className="kick mb-1 mt-0.5">{itemCategory}</span>
                  <h3 className="line-clamp-3 leading-snug text-foreground hover:text-accent transition-colors">
                    <AutoArticleTitle article={item} language={language} />
                  </h3>
                  <div className="meta select-none">
                    <span suppressHydrationWarning>{formatDate(item.publishedAt, language)}</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-8">
        {relatedLimit < related.length ? (
          <button
            type="button"
            onClick={() => setRelatedLimit((prev) => prev + 4)}
            className="group flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#B3121B] text-[#B3121B] font-black text-sm hover:bg-[#B3121B] hover:text-white transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(179,18,27,0.3)] active:scale-95"
          >
            {uiLabel(language, { en: 'View More', gu: 'વધુ જુઓ', hi: 'અધિક દેખેં' })}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.5] transition-transform duration-300 group-hover:translate-y-0.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ) : (
          <Link
            href={`/category/${(article.category || 'all').toLowerCase().replace(/\s+/g, '-')}`}
            className="group flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#B3121B] text-[#B3121B] font-black text-sm hover:bg-[#B3121B] hover:text-white transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(179,18,27,0.3)] active:scale-95"
          >
            {uiLabel(language, { en: 'View All News', gu: 'બધા સમાચાર જુઓ', hi: 'સભી સમાચાર દેખેં' })}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>
    </section>
  );
}
