'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SocialIcon } from '@/components/ui/SocialLinks';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoArticleTitleWithPrefix } from '@/components/ui/AutoTranslatedArticleText';
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
    <Link
      href={href}
      className={`group flex flex-row items-center justify-between gap-3 py-3 border-b border-border/50 last:border-b-0 min-w-0 ${className}`}
    >
      {/* Left: Category label in red on top + Headline below (clean normal UI) */}
      <div className="flex flex-col flex-1 min-w-0 pr-1">
        <span className="text-[#B3121B] font-black text-[12px] sm:text-[13px] uppercase tracking-wide mb-1 leading-none select-none">
          {catLabel}
        </span>
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
      </div>

      {/* Right: Thumbnail */}
      <div className="relative aspect-[16/10] w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-lg border border-border/10 bg-muted">
        <ArticleMedia
          src={imgSrc}
          alt={rawTitle || ''}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    </Link>
  );
}
