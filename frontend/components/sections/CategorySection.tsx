'use client';

import { useState, useEffect } from 'react';
import { CATEGORY_META } from '@/data';
import { getPublicArticles } from '@/lib/api';
import NewsCard from '@/components/ui/NewsCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';

interface CategorySectionProps {
  category: string;
  categorySlug: string;
  categoryGu: string;
  cols?: number;
}

export default function CategorySection({ category, categorySlug, categoryGu, cols = 6 }: CategorySectionProps) {
  const { language } = useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const meta = Object.values(CATEGORY_META).find((item) => item.name === category);

  useEffect(() => {
    getPublicArticles({ categorySlug, limit: cols }).then((res) => {
      if (res && res.articles) {
        setArticles(res.articles);
      }
    });
  }, [categorySlug, cols]);

  if (!articles.length) {
    return (
      <section className="py-0.5 animate-pulse">
        <div className="max-w-screen-xl mx-auto px-3">
          <div className="mb-2 h-6 w-48 rounded bg-muted/60" />
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-1.5 space-y-2">
                <div className="aspect-[16/9] w-full rounded bg-muted/40" />
                <div className="space-y-1.5 mt-1">
                  <div className="h-3 w-full rounded bg-muted/40" />
                  <div className="h-3 w-5/6 rounded bg-muted/40" />
                  <div className="h-2 w-1/2 rounded bg-muted/40 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-0.5">
      <div className="max-w-screen-xl mx-auto px-3">
        <SectionHeader
          title={category}
          titleGu={meta?.gu || categoryGu}
          titleHi={meta?.hi}
          href={`/category/${categorySlug}`}
          language={language}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 gap-y-5">
          {articles.map(article => (
            <NewsCard key={article.id} article={article} variant="default" />
          ))}
        </div>
      </div>
    </section>
  );
}
