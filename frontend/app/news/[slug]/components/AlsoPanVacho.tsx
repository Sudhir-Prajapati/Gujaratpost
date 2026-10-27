'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, getCategoryLabel, getArticleTitle } from '@/data';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';
import MobileHeroArticleCard from '@/components/ui/MobileHeroArticleCard';

interface AlsoPanVachoProps {
  articles: Article[];
  language: Language;
  getCardThumbnail: (item: any, index?: number) => string;
  DEMO_THUMBNAILS?: string[];
  uiLabel: (language: Language, values: { en: string; gu: string; hi: string }) => string;
}

export default function AlsoPanVacho({
  articles,
  language,
  getCardThumbnail,
  DEMO_THUMBNAILS = [],
  uiLabel,
}: AlsoPanVachoProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!articles || articles.length === 0) return null;

  const handleShare = async (e: React.MouseEvent, art: Article) => {
    e.preventDefault();
    
    e.stopPropagation();

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gujaratpost.in';
    const artUrl = `${origin}/news/${art.slug}`;
    const artTitle = getArticleTitle(art, language) || art.title || '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: artTitle, text: artTitle, url: artUrl });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(artUrl);
      setCopiedId(String(art.id));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(`${artTitle} ${artUrl}`)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent, art: Article) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gujaratpost.in';
    const artUrl = `${origin}/news/${art.slug}`;
    const artTitle = getArticleTitle(art, language) || art.title || '';
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${artTitle} ${artUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="also-pan-vacho select-none w-full my-6 pt-2">
      {/* Header matching Gujarat Post visual design */}
      <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="block w-[5px] h-6 rounded-full bg-[#B3121B]" />
        <h3 className="text-[18px] sm:text-[21px] font-black text-[#B3121B] dark:text-red-500 tracking-tight flex items-center gap-2">
          {uiLabel(language, { en: 'Also Read', gu: 'આ પણ વાંચો', hi: 'यह भी पढ़ें' })}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-[#B3121B]/20 to-transparent" />
      </div>

      {/* Mobile view (< md): Hero Section style list */}
      <div className="flex flex-col divide-y divide-border/60 md:hidden">
        {articles.slice(0, 8).map((art, index) => (
          <MobileHeroArticleCard
            key={`apv-mob-${art.id}-${index}`}
            article={art}
            language={language}
            index={index}
          />
        ))}
      </div>

      {/* Desktop view (>= md): 2-Column Responsive Card Grid (up to 8 articles) */}
      <div className="hidden md:grid md:grid-cols-2 gap-3.5">
        {articles.slice(0, 8).map((art, index) => {
          const catLabel = normalizeDisplayText(getCategoryLabel(art, language) || art.category || '');
          const thumbSrc = getCardThumbnail(art, index);

          return (
            <Link
              key={`apv-${art.id}-${index}`}
              href={`/news/${art.slug}`}
              className="group relative flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-[#B3121B]/60 dark:hover:border-red-600/60 hover:shadow-[0_6px_20px_rgba(179,18,27,0.12)] hover:-translate-y-0.5 transition-all duration-300 text-left overflow-hidden"
            >
              {/* Thumbnail Image */}
              <div className="relative w-[92px] h-[72px] sm:w-[105px] sm:h-[78px] shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 shadow-xs">
                <Image
                  src={thumbSrc}
                  alt={art.title || ''}
                  fill
                  sizes="(max-width: 640px) 92px, 105px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    if (DEMO_THUMBNAILS.length > 0) {
                      (e.target as HTMLImageElement).src = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Text & Metadata */}
              <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch pr-6">
                <div>
                  {catLabel && (
                    <span className="block text-[11px] font-black uppercase tracking-wider text-[#B3121B] dark:text-red-400 mb-1">
                      {catLabel}
                    </span>
                  )}
                  <h4 className="line-clamp-2 text-[13.5px] sm:text-[14px] font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors duration-200 leading-[1.35]">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                </div>

              </div>

              {/* Arrow Indicator in Top-Right Corner */}
              <div className="absolute top-3 right-3 text-neutral-400 dark:text-neutral-500 group-hover:text-[#B3121B] dark:group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
