'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, TrendingUp } from 'lucide-react';
import { formatDate, getArticleTitle, ARTICLES } from '@/data';
import SectionHeader from '@/components/ui/SectionHeader';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';

export default function TrendingSection() {
  const { language } = useApp();
  const [trending, setTrending] = useState<Article[]>([]);

  useEffect(() => {
    fetch('/api/news/trending?limit=10')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.articles?.length > 0) {
          setTrending(json.data.articles);
        } else {
          setTrending(ARTICLES.filter((a) => a.isTrending).slice(0, 10));
        }
      })
      .catch(() => {
        setTrending(ARTICLES.filter((a) => a.isTrending).slice(0, 10));
      });
  }, []);

  if (!trending.length) {
    return (
      <section className="bg-muted py-0.5 animate-pulse">
        <div className="max-w-screen-xl mx-auto px-3">
          <div className="mb-2 h-6 w-40 rounded bg-muted/60" />
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="aspect-[4/3] w-full bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted py-0.5">
      <div className="max-w-screen-xl mx-auto px-3">
        <div className="mb-0.5 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <SectionHeader title="Trending News" titleGu="ટ્રેન્ડિંગ ન્યૂઝ" titleHi="ट्रेंडिंग न्यूज" language={language} />
        </div>

        <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
          {trending.slice(0, 10).map((article, index) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="news-card group relative overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={article.image || 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400&q=80'}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 10vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400&q=80';
                  }}
                />
                <div className="img-overlay absolute inset-0" />
                <div
                  className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow"
                  style={{ background: index < 3 ? 'var(--accent)' : 'rgba(0,0,0,0.65)' }}
                >
                  {index + 1}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-1.5">
                  <h3 className="line-clamp-2 text-[11px] font-black leading-tight text-white drop-shadow">
                    {getArticleTitle(article, language)}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-0.5 text-[9px] font-semibold text-white/75">
                    <Clock className="h-2 w-2" />
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
