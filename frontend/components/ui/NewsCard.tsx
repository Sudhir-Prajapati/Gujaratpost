'use client';

import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';
import { Article } from '@/types';
import {
  formatDate,
  formatTime,
  formatViews,
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
}

export default function NewsCard({ article, variant = 'default' }: NewsCardProps) {
  const { language } = useApp();
  const rawTitle = getArticleTitle(article, language);
  const rawExcerpt = getArticleExcerpt(article, language);
  const title = useAutoTranslate(rawTitle, language);
  const excerpt = useAutoTranslate(rawExcerpt, language);
  const category = getCategoryLabel(article, language);
  const categoryColor = getCategoryColor(article.category);
  const mediaSrc = (article as any).featuredImage || article.image || (article as any).thumbnail;

  if (variant === 'hero') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="news-card group relative block overflow-hidden rounded-xl bg-card">
        <div className="relative aspect-[16/10] w-full lg:aspect-[16/9]">
          <ArticleMedia
            src={mediaSrc}
            alt={article.title}
            className="transition duration-500 group-hover:scale-105"
          />
          <div className="img-overlay absolute inset-0 pointer-events-none" />
          {article.isBreaking && <span className="live-badge absolute left-3 top-3 rounded bg-accent px-2 py-1 text-xs font-black text-white z-10">BREAKING</span>}
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 z-10">
            <span className="cat-badge mb-2.5" style={{ background: categoryColor }}>{category}</span>
            <h1 className="line-clamp-3 text-xl font-black leading-tight text-white md:text-4xl lg:text-5xl">{title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-semibold text-white/85">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(article.publishedAt)}</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="news-card group block overflow-hidden rounded-xl bg-card">
        <div className="relative aspect-[16/11] w-full">
          <ArticleMedia src={mediaSrc} alt={article.title} className="transition duration-500 group-hover:scale-105" />
          <div className="img-overlay absolute inset-0 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-3 z-10">
            <span className="cat-badge mb-1.5" style={{ background: categoryColor }}>{category}</span>
            <h2 className="line-clamp-2 text-sm sm:text-base font-black leading-snug text-white">{title}</h2>
            <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-white/75"><Clock className="h-3 w-3" />{formatTime(article.publishedAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="news-card flex gap-3 rounded-lg border border-border bg-card p-2.5">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md">
          <ArticleMedia src={mediaSrc} alt={article.title} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="cat-badge mb-1" style={{ background: categoryColor }}>{category}</span>
          <h3 className="line-clamp-2 text-[15px] font-black leading-snug text-foreground">{title}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="flex gap-3 border-b border-border py-3 transition hover:opacity-75">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
          <ArticleMedia src={mediaSrc} alt={article.title} />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-black leading-snug text-foreground">{title}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{formatDate(article.publishedAt)}</p>
        </div>
      </Link>
    );
  }

  if (variant === 'flat') {
    const displayCategory = language === 'gu'
      ? article.categoryGu || article.tagsGu?.[0] || category
      : language === 'hi'
      ? article.categoryHi || article.tagsHi?.[0] || category
      : article.category || article.tags?.[0] || category;

    const relativeTime = language === 'gu'
      ? (article as any).relativeTimeGu || formatDate(article.publishedAt)
      : language === 'hi'
      ? (article as any).relativeTimeHi || formatDate(article.publishedAt)
      : article.relativeTime || formatDate(article.publishedAt);

    return (
      <Link prefetch={false} href={`/news/${article.slug}`} className="group block">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-muted shadow-sm">
          <ArticleMedia
            src={mediaSrc}
            alt={article.title}
            className="transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="mt-2.5">
          <span className="text-[11px] font-black uppercase tracking-wide text-accent">
            {displayCategory}
          </span>
          <h3 className="line-clamp-2 text-[13.5px] md:text-[14px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors mt-0.5 tracking-tight">
            {title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
            <span>{relativeTime}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5 text-muted-foreground/75" />{formatTime(article.publishedAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link prefetch={false} href={`/news/${article.slug}`} className="news-card group block overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-[16/9] w-full">
        <ArticleMedia src={mediaSrc} alt={article.title} className="transition duration-300 group-hover:scale-105" />
        {article.isBreaking && <span className="absolute left-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-black text-white z-10">BREAKING</span>}
      </div>
      <div className="p-2">
        <span className="cat-badge mb-0.5" style={{ background: categoryColor, fontSize: '0.6rem', padding: '0.1rem 0.45rem' }}>{category}</span>
        <h3 className="line-clamp-2 text-[12px] font-black leading-snug text-foreground mt-0.5">{title}</h3>
        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{formatDate(article.publishedAt)}</span>
          <span>{formatTime(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
