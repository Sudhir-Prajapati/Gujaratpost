'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, getCategoryLabel, getArticleTitle } from '@/data';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';
import MobileHeroArticleCard from '@/components/ui/MobileHeroArticleCard';
import { SocialIcon } from '@/components/ui/SocialLinks';

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
    <section className="also-pan-vacho select-none w-full my-6 pt-2" suppressHydrationWarning>
      {/* Header matching Gujarat Post visual design */}
      <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="block w-[5px] h-6 rounded-full bg-[#B3121B]" />
        <h3 className="text-[18px] sm:text-[21px] font-black text-[#B3121B] dark:text-red-500 tracking-tight flex items-center gap-2">
          {uiLabel(language, { en: 'Also Read', gu: 'આ પણ વાંચો', hi: 'यह भी पढ़ें' })}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-[#B3121B]/20 to-transparent" />
      </div>

      {/* Mobile view (< md): Modern separated cards with Category Pill & WhatsApp Share */}
      <div className="flex flex-col gap-3.5 md:hidden">
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
              className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_14px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] hover:shadow-lg hover:border-accent/40 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-1">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-[#B3121B] dark:text-red-400 mb-1">
                    {catLabel || 'સમાચાર'}
                  </span>
                  <h4 className="line-clamp-2 text-[14px] sm:text-[14.5px] font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors duration-200 leading-[1.38]">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                </div>

                {/* Thumbnail Image */}
                <div className="relative w-[100px] h-[72px] sm:w-[110px] sm:h-[78px] shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-neutral-900 shadow-2xs">
                  <Image
                    src={thumbSrc}
                    alt={art.title || ''}
                    fill
                    sizes="110px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Bottom Row: Category Pill & WhatsApp Share Button */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B3121B]" />
                  <span>{catLabel || 'સમાચાર'}</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const title = getArticleTitle(art, language);
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/news/${art.slug}`;
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
          );
        })}
      </div>
    </section>
  );
}
