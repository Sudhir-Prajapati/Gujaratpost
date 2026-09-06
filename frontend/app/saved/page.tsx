'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Trash2, Bookmark } from 'lucide-react';
import { formatDate, formatViews, getArticleTitle, getCategoryLabel, getLocalized } from '@/data';
import { getPublicArticles } from '@/lib/api';
import { getCategoryColor } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

export default function SavedPage() {
  const { language } = useApp();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);

  const loadSaved = () => {
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          getPublicArticles({ limit: 120 }).then((res) => {
            if (res && res.articles) {
              const matched = res.articles.filter((art) => parsed.includes(art.id) || parsed.includes(art.slug));
              setSavedArticles(matched);
            }
          });
          return;
        }
      }
      setSavedArticles([]);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadSaved();
    window.addEventListener('gp-saved-changed', loadSaved);
    return () => window.removeEventListener('gp-saved-changed', loadSaved);
  }, []);

  const handleUnsave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      let parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        parsed = parsed.filter((x: string) => x !== id);
        localStorage.setItem('gp-saved-articles', JSON.stringify(parsed));
        window.dispatchEvent(new Event('gp-saved-changed'));
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const titleText = getLocalized(language, {
    en: 'Saved Articles',
    gu: 'સાચવેલા લેખ',
    hi: 'સહેજે ગયા લેખ'
  });

  const emptyText = getLocalized(language, {
    en: 'No articles saved yet. Click on the 🔖 bookmark icon on any article to save it.',
    gu: 'હજુ સુધી કોઈ લેખ સાચવ્યો નથી. કોઈપણ કાર્ડ પરના 🔖 આઇકન પર ટૅપ કરીને લેખ સાચવો.',
    hi: 'અભી તક કોઈ લેખ સહેજા નહીં ગયા હૈ। કીસી ભી લેખ પર 🔖 બુકમાર્ક આઇકન પર ક્લિક કરકે ઉસે સહેજેં।'
  });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="relative border-b-2 border-slate-900 pb-2 mb-6 flex items-center justify-between">
        <span className="bg-[#B3121B] text-white px-5 py-1.5 text-[14px] md:text-[15px] font-black rounded-sm select-none uppercase tracking-wide">
          {titleText}
        </span>
      </div>

      {savedArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-lg border border-border p-6 shadow-sm">
          <Bookmark className="h-16 w-16 text-muted-foreground/35 mb-4 stroke-[1.5]" />
          <p className="text-muted-foreground text-sm font-semibold max-w-md leading-relaxed">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedArticles.map((article) => {
            const title = getArticleTitle(article, language);
            const category = getCategoryLabel(article, language);
            const categoryColor = getCategoryColor(article.category);
            return (
              <div
                key={article.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Link href={`/news/${article.slug}`} className="relative aspect-[16/9] w-full block overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-103"
                  />
                  {article.isBreaking && (
                    <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[9px] font-black text-white">
                      BREAKING
                    </span>
                  )}
                </Link>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="cat-badge shrink-0" style={{ background: categoryColor, fontSize: '0.65rem', padding: '0.15rem 0.55rem' }}>
                        {category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleUnsave(article.id, e)}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                        title={language === 'gu' ? 'દૂર કરો' : 'Remove'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Link href={`/news/${article.slug}`} className="block">
                      <h3 className="line-clamp-2 text-[14px] sm:text-[15px] font-black leading-snug text-foreground hover:text-accent transition-colors">
                        <AutoArticleTitle article={article} language={language} />
                      </h3>
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-muted-foreground border-t border-border/40 pt-2.5 select-none font-sans">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViews(article.views)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
