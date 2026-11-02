'use client';

import { useState, useEffect } from 'react';
import { getLocalized } from '@/data';
import { getPublicArticles } from '@/lib/api';
import NewsCard from '@/components/ui/NewsCard';
import Advertisement from '@/components/ads/Advertisement';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';

export default function TrendingSidebar() {
  const { language } = useApp();
  const [trending, setTrending] = useState<Article[]>([]);

  useEffect(() => {
    getPublicArticles({ isTrending: true, limit: 6 }).then((res) => {
      if (res && res.articles) {
        setTrending(res.articles);
      }
    });
  }, []);

  return (
    <aside className="space-y-6 lg:sticky lg:top-40 lg:self-start">
      <Advertisement position="sidebar" />
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="bg-accent px-4 py-3">
          <h2 className="text-sm font-black text-white">
            {getLocalized(language, { en: 'Trending News', gu: 'ટ્રેન્ડિંગ ન્યૂઝ', hi: 'ટ્રેન્ડિંગ ન્યૂઝ' })}
          </h2>
        </div>
        <div className="p-3">
          {trending.map((article, index) => (
            <div key={article.id} className="flex gap-2">
              <span className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-muted-foreground">
                {index + 1}
              </span>
              <NewsCard article={article} variant="compact" />
            </div>
          ))}
        </div>
      </section>
      <Advertisement position="sidebar" />
    </aside>
  );
}
