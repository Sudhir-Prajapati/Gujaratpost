'use client';

import Link from 'next/link';
import { Article } from '@/types';
import { useApp } from '@/components/AppProvider';
import NewsCard from '@/components/ui/NewsCard';
import Advertisement from '@/components/ads/Advertisement';
import TrendingSidebar from '@/components/sections/TrendingSidebar';
import { getCategoryColor } from '@/lib/utils';
import { getLocalized } from '@/data';

interface Props {
  articles: Article[];
  category: { name: string; nameGu: string; nameHi: string };
  trending: Article[];
  currentPage: number;
  totalPages: number;
  slug: string;
}

export default function CategoryPageClient({
  articles,
  category,
  currentPage,
  totalPages,
  slug,
}: Props) {
  const { language } = useApp();
  const categoryName = getLocalized(language, { en: category.name, gu: category.nameGu, hi: category.nameHi });
  const categoryColor = getCategoryColor(category.name);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <header className="mb-6 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <span className="h-12 w-1.5 rounded-full" style={{ background: categoryColor }} />
          <div>
            <h1 className="text-3xl font-black text-foreground">{categoryName}</h1>
            <p className="text-sm font-semibold text-muted-foreground">
              {getLocalized(language, { en: 'Browse stories', gu: 'સમાચાર બ્રાઉઝ કરો', hi: 'खबरें ब्राउज़ करें' })}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <main className="lg:col-span-2">
          {articles.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
              No stories found in this category yet.
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                {articles.slice(0, 4).map((article) => <NewsCard key={article.id} article={article} variant="default" />)}
              </div>
              <Advertisement position="banner" />
              <div className="mt-6 space-y-3">
                {articles.slice(4).map((article) => <NewsCard key={article.id} article={article} variant="horizontal" />)}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4 border-t border-border pt-6">
                  <Link
                    href={`/category/${slug}?page=${currentPage - 1}`}
                    className={`inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-black hover:border-accent hover:text-accent transition ${currentPage <= 1 ? 'pointer-events-none opacity-40 bg-muted/40' : ''}`}
                  >
                    Previous
                  </Link>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Link
                    href={`/category/${slug}?page=${currentPage + 1}`}
                    className={`inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-black hover:border-accent hover:text-accent transition ${currentPage >= totalPages ? 'pointer-events-none opacity-40 bg-muted/40' : ''}`}
                  >
                    Next
                  </Link>
                </div>
              )}
            </>
          )}
        </main>
        <TrendingSidebar />
      </div>
    </div>
  );
}
