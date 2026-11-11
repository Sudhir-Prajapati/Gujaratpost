'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Play } from 'lucide-react';
import { SocialIcon } from '@/components/ui/SocialLinks';
import ArticleMedia from '@/components/ui/ArticleMedia';
import {
  AutoArticleTitle,
  AutoArticleTitleWithPrefix,
  AutoTranslateString,
} from '@/components/ui/AutoTranslatedArticleText';
import { getArticleTitle, getCategoryLabel } from '@/data';

export interface MobileModernArticleCardProps {
  article: any;
  language?: any;
  index?: number;
  defaultCategorySlug?: string;
  defaultCategoryLabel?: string;
  catSlug?: string;
  catLabel?: string;
  fallbackImage?: string;
  className?: string;
  isVideo?: boolean;
}

export default function MobileModernArticleCard({
  article,
  language = 'gu',
  index = 0,
  defaultCategorySlug,
  defaultCategoryLabel,
  catSlug: explicitCatSlug,
  catLabel: explicitCatLabel,
  fallbackImage,
  className = '',
  isVideo = false,
}: MobileModernArticleCardProps) {
  if (!article) return null;

  const isVideoCard = Boolean(isVideo || article.isVideoItem || article.isYouTube || article.videoId || article.youtubeId);

  const rawTitle =
    (language === 'hi'
      ? article.titleHi
      : language === 'gu'
      ? article.titleGu || article.title
      : article.titleEn || article.title) ||
    article.title ||
    '';

  const catLabel =
    explicitCatLabel ||
    article.customCategoryLabel ||
    getCategoryLabel(article, language) ||
    article.categoryGu ||
    article.category ||
    defaultCategoryLabel ||
    (language === 'gu' ? 'સમાચાર' : language === 'hi' ? 'समाचार' : 'News');

  const catSlug =
    explicitCatSlug ||
    article.category?.slug ||
    article.categorySlug ||
    (typeof article.category === 'string' && article.category.length < 30
      ? article.category.toLowerCase().replace(/\s+/g, '-')
      : '') ||
    defaultCategorySlug ||
    'news';

  const imgSrc =
    article.image ||
    article.featuredImage ||
    article.thumbnail ||
    article.imageUrl ||
    fallbackImage ||
    '/assets/gujarat-post-logo.png';

  const href = article.slug ? `/news/${article.slug}` : (article.url || '#');

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const title = getArticleTitle(article, language) || rawTitle;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = href.startsWith('http') ? href : `${origin}${href}`;
    const shareText = `${title}\n\n${shareUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title, url: shareUrl, text: shareText }).catch(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  return (
    <div
      className={`group relative flex flex-col p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_14px_rgba(0,0,0,0.09),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.45)] hover:shadow-lg hover:border-accent/40 transition-all duration-200 min-w-0 ${className}`}
    >
      {/* 1. Main Row: Headline on Left + Thumbnail on Right */}
      <div className="flex flex-row items-center justify-between gap-3 min-w-0">
        {/* Left: Headline with Auto Translation & colored prefix */}
        <Link href={href} className="flex flex-col flex-1 min-w-0 pr-1">
          <h3 className="text-[16px] sm:text-[17px] font-black leading-[1.38] text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
            <AutoArticleTitleWithPrefix
              article={article}
              language={language}
              prefixClassName={
                index % 2 === 0
                  ? 'text-[#0284c7] dark:text-[#38bdf8] font-black mr-1'
                  : 'text-[#d97706] dark:text-[#fbbf24] font-black mr-1'
              }
            />
          </h3>
        </Link>

        {/* Right: Media Thumbnail */}
        <Link
          href={href}
          className="relative aspect-[16/10] w-[124px] h-[82px] sm:w-[136px] sm:h-[90px] shrink-0 overflow-hidden rounded-xl border border-slate-200/60 dark:border-white/[0.08] bg-muted shadow-2xs"
        >
          <ArticleMedia
            src={imgSrc}
            alt={rawTitle || ''}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
          {isVideoCard && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md">
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 2. Bottom Row: Category Pill on Left + Share Option on Right Bottom Corner */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
        {/* Left: Category Pill */}
        <Link
          href={`/category/${catSlug}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200/70 dark:border-white/[0.08] text-[12px] font-extrabold text-foreground/80 hover:text-foreground transition-all shadow-2xs select-none active:scale-95"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B3121B]" />
          <span>{catLabel}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/80" />
        </Link>

        {/* Right Bottom Corner: Modern Share Option (WhatsApp / Native Share) */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700/40 text-[12px] font-extrabold shadow-2xs transition-all cursor-pointer select-none active:scale-95 hover:shadow-xs"
          aria-label="Share article"
          title="Share"
        >
          <SocialIcon platform="whatsapp" className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'शेयर' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}
