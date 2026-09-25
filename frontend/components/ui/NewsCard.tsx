'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Article } from '@/types';
import {
  formatDate,
  getArticleExcerpt,
  getArticleTitle,
  getCategoryLabel,
} from '@/data';
import { getCategoryColor, toGu } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import { useAutoTranslate } from '@/lib/translate';
import ArticleMedia from '@/components/ui/ArticleMedia';

interface NewsCardProps {
  article: Article;
  variant?: 'default' | 'hero' | 'small' | 'horizontal' | 'compact' | 'flat';
  showFooter?: boolean;
  showDate?: boolean;
}

export default function NewsCard({
  article,
  variant = 'default',
  showFooter = false,
  showDate = false,
}: NewsCardProps) {
  const { language } = useApp();
  const rawTitle = getArticleTitle(article, language);
  const rawExcerpt = getArticleExcerpt(article, language);
  const title = useAutoTranslate(rawTitle, language);
  const excerpt = useAutoTranslate(rawExcerpt, language);
  const category = getCategoryLabel(article, language);
  const categoryColor = getCategoryColor(article.category);
  const mediaSrc = (article as any).featuredImage || article.image || (article as any).thumbnail;

  const displayCategory = language === 'gu'
    ? article.categoryGu || article.tagsGu?.[0] || category
    : language === 'hi'
    ? article.categoryHi || article.tagsHi?.[0] || category
    : article.category || article.tags?.[0] || category;

  const displayDate = language === 'gu'
    ? (article as any).relativeTimeGu || formatDate(article.publishedAt || (article as any).createdAt, 'gu')
    : language === 'hi'
    ? (article as any).relativeTimeHi || formatDate(article.publishedAt || (article as any).createdAt, 'hi')
    : article.relativeTime || formatDate(article.publishedAt || (article as any).createdAt, 'en');

  const authorName = typeof article.author === 'string'
    ? article.author
    : article.author?.nameGu && language === 'gu'
    ? article.author.nameGu
    : article.author?.nameHi && language === 'hi'
    ? article.author.nameHi
    : article.author?.name;

  if (variant === 'hero') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="news-card group relative block overflow-hidden rounded-xl bg-card">
        <div className="relative aspect-[16/10] w-full lg:aspect-[16/9] overflow-hidden">
          <ArticleMedia
            src={mediaSrc}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="img-overlay absolute inset-0 pointer-events-none" />
          {article.isBreaking && (
            <span className="live-badge absolute left-3 top-3 rounded bg-accent px-2 py-1 text-xs font-black text-white z-10">
              BREAKING
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 z-10">
            <span className="cat-badge mb-2.5" style={{ background: categoryColor }}>
              {displayCategory}
            </span>
            <h1 className="line-clamp-3 text-xl font-black leading-tight text-white md:text-4xl lg:text-5xl">
              {title}
            </h1>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="news-card group block overflow-hidden rounded-xl bg-card">
        <div className="relative aspect-[16/11] w-full overflow-hidden">
          <ArticleMedia
            src={mediaSrc}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="img-overlay absolute inset-0 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-3 z-10">
            <span className="cat-badge mb-1.5" style={{ background: categoryColor }}>
              {displayCategory}
            </span>
            <h2 className="line-clamp-2 text-sm sm:text-base font-black leading-snug text-white">
              {title}
            </h2>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="news-card flex gap-3 rounded-lg border border-border bg-card p-2.5">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
          <ArticleMedia
            src={mediaSrc}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div>
            <span className="cat-badge mb-1" style={{ background: categoryColor }}>
              {displayCategory}
            </span>
            <h3 className="line-clamp-2 text-[14px] sm:text-[15px] font-black leading-snug text-foreground">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
            <span>{displayDate}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="flex gap-3 border-b border-border py-3 transition hover:opacity-75">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
          <ArticleMedia
            src={mediaSrc}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-black leading-snug text-foreground">
            {title}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'flat') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="group flex flex-col h-full">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
          <ArticleMedia
            src={mediaSrc}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col flex-1 mt-2.5 justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wide text-accent truncate">
                {displayCategory}
              </span>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                {displayDate}
              </span>
            </div>
            <h3 className="line-clamp-2 text-[13.5px] md:text-[14px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors mt-0.5 tracking-tight min-h-[2.6rem]">
              {title}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  // DEFAULT VARIANT: Strict aspect ratio, rigid flex container, aligned title and bottom metadata
  return (
    <Link
      prefetch={false}
      href={`/news/${article.slug}`}
      className="news-card group flex flex-col h-full overflow-hidden rounded-xl border border-border/80 bg-card hover:border-accent/40 transition-all duration-300 shadow-xs hover:shadow-lg"
    >
      {/* 1. Media Header: Enforced 16:9 ratio with overflow-hidden and absolute positioning */}
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-muted/60">
        <ArticleMedia
          src={mediaSrc}
          alt={article.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Subtle hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {article.isBreaking && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md z-10 animate-pulse">
            BREAKING
          </span>
        )}
      </div>

      {/* 2. Card Content Body: Flex column filling remaining height */}
      <div className="flex flex-col flex-1 p-3 sm:p-3.5 justify-between">
        <div>
          {/* Top row: Category Badge (and optional Timestamp) */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className="cat-badge truncate font-bold text-[10.5px] leading-tight"
              style={{ background: categoryColor, padding: '0.15rem 0.55rem' }}
            >
              {displayCategory}
            </span>
            {showDate && (
              <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground/60" />
                {displayDate}
              </span>
            )}
          </div>

          {/* Title: exactly 2 lines clamped with fixed min-height for uniform alignment across rows */}
          <h3
            className="line-clamp-2 text-[13px] sm:text-[13.5px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors tracking-tight min-h-[2.6rem]"
            title={title}
          >
            {title}
          </h3>
        </div>

        {/* 3. Card Footer (Optional) */}
        {showFooter && (
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate max-w-[200px] font-medium text-foreground/80">
              {authorName || 'Gujarat Post'}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
