'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SocialIcon } from '@/components/ui/SocialLinks';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';
import { getArticleTitle, getCategoryLabel } from '@/data';

export interface MobileHeroArticleCardProps {
  article: any;
  language?: any;
  index?: number;
  defaultCategorySlug?: string;
  defaultCategoryLabel?: string;
  fallbackImage?: string;
  className?: string;
}

export default function MobileHeroArticleCard({
  article,
  language = 'gu',
  index = 0,
  defaultCategorySlug,
  defaultCategoryLabel,
  fallbackImage,
  className = '',
}: MobileHeroArticleCardProps) {
  if (!article) return null;

  const rawTitle =
    (language === 'hi'
      ? article.titleHi
      : language === 'gu'
      ? (article.titleGu || article.title)
      : (article.titleEn || article.title)) ||
    article.title ||
    '';

  const colonIdx = rawTitle.indexOf(':');
  const hasPrefix = colonIdx > 3 && colonIdx <= 48;
  const prefixText = hasPrefix ? rawTitle.substring(0, colonIdx + 1) : '';
  const restText = hasPrefix ? rawTitle.substring(colonIdx + 1).trim() : '';

  const catLabel =
    getCategoryLabel(article, language) ||
    article.categoryGu ||
    article.category ||
    defaultCategoryLabel ||
    (language === 'gu' ? 'સમાચાર' : language === 'hi' ? 'समाचार' : 'News');

  const catSlug =
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
    fallbackImage ||
    '/assets/gujarat-post-logo.png';

  const href = article.slug ? `/news/${article.slug}` : '#';

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const title = getArticleTitle(article, language) || rawTitle;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${href}`;
    const text = `${title}\n\n${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title, url, text }).catch(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className={`group flex flex-col py-3.5 first:pt-1.5 last:pb-1 min-w-0 ${className}`}>
      {/* Top: Headline (left) + Thumbnail (right) */}
      <Link
        href={href}
        className="flex flex-row items-start justify-between gap-3 min-w-0"
      >
        <div className="flex-1 min-w-0 pr-1">
          <h3 className="text-[17px] sm:text-[18px] font-black leading-[1.38] text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
            {hasPrefix ? (
              <>
                <span
                  className={
                    index % 2 === 0
                      ? 'text-[#0284c7] dark:text-[#38bdf8] font-black mr-1'
                      : 'text-[#d97706] dark:text-[#fbbf24] font-black mr-1'
                  }
                >
                  {prefixText}
                </span>
                <span>{restText}</span>
              </>
            ) : (
              <AutoArticleTitle article={article} language={language} />
            )}
          </h3>
        </div>

        <div className="relative aspect-[16/10] w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-lg border border-border/10 bg-muted">
          <ArticleMedia
            src={imgSrc}
            alt={rawTitle || ''}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      {/* Bottom Row: Category Pill (Left) + WhatsApp Share Button (Right) */}
      <div className="flex items-center justify-between mt-3.5 pt-0.5">
        <Link
          href={`/category/${catSlug}`}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-muted/30 hover:bg-muted text-[12px] font-extrabold text-foreground/80 hover:text-foreground transition-colors shadow-2xs"
        >
          <span>{catLabel}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-muted-foreground hover:text-emerald-600 active:scale-95 transition-colors cursor-pointer select-none"
          aria-label="Share"
        >
          <SocialIcon platform="whatsapp" className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'શેર' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}
