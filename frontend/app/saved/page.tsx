'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Trash2, Bookmark, ArrowRight, Clock } from 'lucide-react';
import { formatViews, getArticleTitle, getCategoryLabel, getLocalized } from '@/data';
import { getPublicArticles, getPublicArticleBySlug } from '@/lib/api';
import { getCategoryColor } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

export default function SavedPage() {
  const { language } = useApp();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem('gp-saved-articles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize identifiers: could be article.id, article.slug, or full URL
          const normalizedKeys = parsed
            .map((item: any) => {
              if (typeof item !== 'string') return '';
              let s = item.trim();
              if (s.includes('/news/')) {
                s = s.replace(/.*\/news\//, '').replace(/\/$/, '').split('?')[0];
              }
              return s;
            })
            .filter(Boolean);

          const res = await getPublicArticles({ limit: 120 });
          let matched: Article[] = [];
          const matchedIds = new Set<string>();

          if (res && Array.isArray(res.articles)) {
            matched = res.articles.filter((art) => {
              const hit =
                parsed.includes(art.id) ||
                parsed.includes(art.slug) ||
                normalizedKeys.includes(art.slug) ||
                normalizedKeys.includes(art.id) ||
                parsed.some((p: string) => typeof p === 'string' && (p.includes(art.slug) || p.includes(art.id)));
              if (hit) {
                matchedIds.add(art.id);
                matchedIds.add(art.slug);
                return true;
              }
              return false;
            });
          }

          // If some saved articles were published earlier and aren't in the top 120, fetch them individually
          const missingKeys = normalizedKeys.filter((k) => !matchedIds.has(k));
          if (missingKeys.length > 0) {
            const singleFetches = await Promise.allSettled(
              missingKeys.map((k) => getPublicArticleBySlug(k))
            );
            for (const result of singleFetches) {
              if (result.status === 'fulfilled' && result.value) {
                const art = result.value;
                if (!matchedIds.has(art.id)) {
                  matchedIds.add(art.id);
                  matched.push(art);
                }
              }
            }
          }

          setSavedArticles(matched);
          setLoading(false);
          return;
        }
      }
      setSavedArticles([]);
      setLoading(false);
    } catch (e) {
      console.warn(e);
      setSavedArticles([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
    window.addEventListener('gp-saved-changed', loadSaved);
    window.addEventListener('storage', loadSaved);
    return () => {
      window.removeEventListener('gp-saved-changed', loadSaved);
      window.removeEventListener('storage', loadSaved);
    };
  }, []);

  const handleUnsave = (targetArticle: Article, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      let parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        parsed = parsed.filter((x: string) => {
          if (!x || typeof x !== 'string') return false;
          if (x === targetArticle.id || x === targetArticle.slug) return false;
          if (targetArticle.slug && (x.includes(targetArticle.slug) || x.endsWith(targetArticle.slug))) return false;
          if (targetArticle.id && x.includes(targetArticle.id)) return false;
          return true;
        });
        localStorage.setItem('gp-saved-articles', JSON.stringify(parsed));
        window.dispatchEvent(new Event('gp-saved-changed'));
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleClearAll = () => {
    const confirmMsg =
      language === 'gu'
        ? 'શું તમે બધા સાચવેલા સમાચાર દૂર કરવા માંગો છો?'
        : language === 'hi'
        ? 'क्या आप सभी सहेजे गए समाचार हटाना चाहते हैं?'
        : 'Are you sure you want to remove all saved news?';
    if (window.confirm(confirmMsg)) {
      try {
        localStorage.removeItem('gp-saved-articles');
        setSavedArticles([]);
        window.dispatchEvent(new Event('gp-saved-changed'));
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const titleText =
    language === 'en'
      ? 'Saved News'
      : language === 'hi'
      ? 'सहेजे गए समाचार'
      : 'સાચવેલા સમાચાર';

  const emptyText =
    language === 'en'
      ? 'No news saved yet. Click on the 🔖 bookmark icon on any article across the website to save and read it anytime.'
      : language === 'hi'
      ? 'अभी तक कोई समाचार सहेजा नहीं गया है। वेबसाइट पर किसी भी समाचार पर 🔖 बुकमार्क आइकन पर क्लिक करके उसे सहेजें।'
      : 'હજુ સુધી કોઈ સમાચાર સાચવ્યા નથી. વેબસાઇટ પરના કોઈપણ સમાચાર પર 🔖 બુકમાર્ક આઇકન પર ક્લિક કરીને તેને અહીં સાચવી શકો છો.';

  return (
    <div className="mx-auto max-w-screen-xl px-3 sm:px-4 py-6 sm:py-8" key={`saved-page-${language}`}>
      {/* Top Header Banner */}
      <div className="relative border-b-2 border-slate-900 pb-2.5 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-[#B3121B] text-white px-4 sm:px-5 py-1.5 text-[14px] md:text-[15px] font-black rounded-sm select-none uppercase tracking-wide flex items-center gap-2 shadow-xs">
            <Bookmark className="h-4 w-4 fill-white" />
            <span>{titleText}</span>
          </span>
          {savedArticles.length > 0 && (
            <span className="text-xs sm:text-sm font-black text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
              {savedArticles.length} {language === 'gu' ? 'સમાચાર' : language === 'hi' ? 'समाचार' : 'News'}
            </span>
          )}
        </div>

        {savedArticles.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{language === 'gu' ? 'બધા દૂર કરો' : language === 'hi' ? 'सभी हटाएं' : 'Clear All'}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
              <div className="aspect-[16/9] w-full bg-muted rounded-lg" />
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-5 w-full bg-muted rounded" />
              <div className="h-5 w-4/5 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : savedArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center bg-card rounded-2xl border border-border/80 p-6 sm:p-10 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-zinc-900 border border-red-200 dark:border-red-900/40 mb-4 shadow-inner">
            <Bookmark className="h-10 w-10 text-[#B3121B] stroke-[1.8]" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-foreground mb-2">
            {language === 'gu' ? 'કોઈ સાચવેલા સમાચાર નથી' : language === 'hi' ? 'कोई सहेजा गया समाचार नहीं' : 'No Saved News Yet'}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium max-w-md leading-relaxed mb-6">
            {emptyText}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#B3121B] hover:bg-[#960f16] active:bg-[#850d13] px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-md transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>{language === 'gu' ? 'સમાચાર વાંચો' : language === 'hi' ? 'समाचार पढ़ें' : 'Explore News'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedArticles.map((article) => {
            const category = getCategoryLabel(article, language);
            const categoryColor = getCategoryColor(article.category);
            return (
              <div
                key={article.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Link
                  href={`/news/${article.slug}`}
                  className="relative aspect-[16/9] w-full block overflow-hidden bg-neutral-950 dark:bg-neutral-900"
                >
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain transition duration-300 group-hover:scale-103"
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                  />
                  {article.isBreaking && (
                    <span className="absolute left-2.5 top-2.5 rounded bg-accent px-2 py-0.5 text-[9.5px] font-black text-white shadow-sm">
                      BREAKING
                    </span>
                  )}
                </Link>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className="cat-badge shrink-0"
                        style={{ background: categoryColor, fontSize: '0.68rem', padding: '0.2rem 0.6rem' }}
                      >
                        {category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleUnsave(article, e)}
                        className="flex h-7.5 w-7.5 items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900/40 active:scale-95"
                        title={language === 'gu' ? 'દૂર કરો' : language === 'hi' ? 'हटाएं' : 'Remove'}
                        aria-label="Remove saved article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Link href={`/news/${article.slug}`} className="block group-hover:text-accent transition-colors">
                      <h3 className="line-clamp-2 text-[14.5px] sm:text-[15.5px] font-black leading-snug text-foreground group-hover:text-accent transition-colors">
                        <AutoArticleTitle article={article} language={language} />
                      </h3>
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-muted-foreground border-t border-border/50 pt-2.5 select-none font-sans">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString(
                            language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
                            { day: 'numeric', month: 'short' }
                          )
                        : ''}
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
