'use client';

import Image from 'next/image';
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
import { getCategoryColor } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';

interface NewsCardProps {
  article: Article;
  variant?: 'default' | 'hero' | 'small' | 'horizontal' | 'compact';
}

export default function NewsCard({ article, variant = 'default' }: NewsCardProps) {
  const { language } = useApp();
  const title = getArticleTitle(article, language);
  const excerpt = getArticleExcerpt(article, language);
  const category = getCategoryLabel(article, language);
  const categoryColor = getCategoryColor(article.category);

  if (variant === 'hero') {
    return (
      <Link href={`/news/${article.slug}`} className="news-card group relative block overflow-hidden rounded-xl bg-card">
        <div className="relative aspect-[16/10] w-full lg:aspect-[16/9]">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            loading="eager"
          />
          <div className="img-overlay absolute inset-0" />
          {article.isBreaking && <span className="live-badge absolute left-3 top-3 rounded bg-accent px-2 py-1 text-xs font-black text-white">BREAKING</span>}
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <span className="cat-badge mb-2.5" style={{ background: categoryColor }}>{category}</span>
            <h1 className="line-clamp-3 text-xl font-black leading-tight text-white md:text-4xl lg:text-5xl">{title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-semibold text-white/85">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(article.publishedAt)}</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatViews(article.views)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link href={`/news/${article.slug}`} className="news-card group block overflow-hidden rounded-xl bg-card">
        <div className="relative aspect-[16/11] w-full">
          <Image src={article.image} alt={article.title} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
          <div className="img-overlay absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-3">
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
      <Link href={`/news/${article.slug}`} className="news-card flex gap-3 rounded-lg border border-border bg-card p-2.5">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md">
          <Image src={article.image} alt={article.title} fill sizes="128px" className="object-cover" />
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
      <Link href={`/news/${article.slug}`} className="flex gap-3 border-b border-border py-3 transition hover:opacity-75">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
          <Image src={article.image} alt={article.title} fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-black leading-snug text-foreground">{title}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{formatDate(article.publishedAt)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/news/${article.slug}`} className="news-card group block overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-[16/9] w-full">
        <Image src={article.image} alt={article.title} fill sizes="(max-width: 768px) 50vw, 17vw" className="object-cover transition duration-300 group-hover:scale-105" />
        {article.isBreaking && <span className="absolute left-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-black text-white">BREAKING</span>}
      </div>
      <div className="p-2">
        <span className="cat-badge mb-0.5" style={{ background: categoryColor, fontSize: '0.6rem', padding: '0.1rem 0.45rem' }}>{category}</span>
        <h3 className="line-clamp-2 text-[12px] font-black leading-snug text-foreground mt-0.5">{title}</h3>
        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{formatDate(article.publishedAt)}</span>
          <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{formatViews(article.views)}</span>
        </div>
      </div>
    </Link>
  );
}
