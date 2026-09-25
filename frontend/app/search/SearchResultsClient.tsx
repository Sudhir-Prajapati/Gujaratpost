'use client';

import { FormEvent, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SearchX, Loader2 } from 'lucide-react';
import { getPublicArticles } from '@/lib/api';
import NewsCard from '@/components/ui/NewsCard';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';

// Language strings
const strings = {
  gu: {
    label: 'ગુજરાત પોસ્ટ સર્ચ',
    heading: 'ન્યૂઝરૂમ સર્ચ કરો',
    placeholder: 'સમાચાર, શહેર, વર્ગ અથવા વિષય શોધો...',
    searchBtn: 'શોધો',
    searchingBtn: 'શોધી રહ્યું...',
    defaultSection: 'તાજા સમાચાર',
    searchingNotice: (q: string) => `"${q}" માટે સમાચાર શોધી રહ્યાં છીએ...`,
    searchingNoticeDefault: 'તાજા સમાચાર લોડ થઈ રહ્યા છે...',
    pleaseWait: 'કૃપા કરીને એક ક્ષણ રાહ જુઓ...',
    resultsFor: (q: string) => `"${q}" માટે પરિણામ`,
    articlesCount: (n: number) => `${n} સમાચાર`,
    foundCount: (n: number) => `${n} સમાચાર મળ્યા`,
    noFoundNotice: (q: string) => `"${q}" માટે કોઈ ચોક્કસ સમાચાર મળ્યા નથી, તમારા માટે તાજા 20 સમાચાર:`,
    noFound: 'કોઈ સમાચાર મળ્યા નહીં',
    tryFewer: 'ઓછા શબ્દો વાપરો અથવા શહેર, વર્ગ કે વ્યક્તિ દ્વારા શોધો.',
  },
  hi: {
    label: 'गुजरात पोस्ट सर्च',
    heading: 'न्यूज़रूम खोजें',
    placeholder: 'समाचार, शहर, श्रेणी या विषय खोजें...',
    searchBtn: 'खोजें',
    searchingBtn: 'खोज रहा...',
    defaultSection: 'તાજા સમાચાર',
    searchingNotice: (q: string) => `"${q}" के लिए समाचार खोज रहे हैं...`,
    searchingNoticeDefault: 'ताज़ा समाचार लोड हो रहे हैं...',
    pleaseWait: 'कृपया प्रतीक्षा करें...',
    resultsFor: (q: string) => `"${q}" के लिए परिणाम`,
    articlesCount: (n: number) => `${n} लेख`,
    foundCount: (n: number) => `${n} लेख मिले`,
    noFoundNotice: (q: string) => `"${q}" के लिए कोई सटीक समाचार नहीं मिले, आपके लिए 20 नवीनतम समाचार:`,
    noFound: 'कोई समाचार नहीं मिला',
    tryFewer: 'कम शब्द आज़माएं या शहर, श्रेणी या व्यक्ति द्वारा खोजें।',
  },
  en: {
    label: 'Gujarat Post Search',
    heading: 'Search the newsroom',
    placeholder: 'Search news, city, category or topic...',
    searchBtn: 'Search',
    searchingBtn: 'Searching...',
    defaultSection: 'Latest News',
    searchingNotice: (q: string) => `Searching stories for "${q}"...`,
    searchingNoticeDefault: 'Loading latest stories...',
    pleaseWait: 'Please wait a moment...',
    resultsFor: (q: string) => `Results for "${q}"`,
    articlesCount: (n: number) => `${n} articles`,
    foundCount: (n: number) => `${n} ${n === 1 ? 'article' : 'articles'} found`,
    noFoundNotice: (q: string) => `No exact stories found for "${q}". Here are 20 latest stories for you:`,
    noFound: 'No stories found',
    tryFewer: 'Try fewer words or search by city, category or person.',
  },
};

/* ── Modern 16:9 Skeleton Card Matching NewsCard Layout ──────────────────────── */
function SearchCardSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs animate-pulse">
      {/* 16:9 Image Placeholder */}
      <div className="relative aspect-[16/9] w-full shrink-0 bg-muted/80" />

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-3.5 justify-between">
        <div>
          {/* Badge & Date row */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="h-4 w-16 rounded-full bg-muted/80" />
            <div className="h-3 w-20 rounded bg-muted/70" />
          </div>

          {/* Title lines */}
          <div className="space-y-1.5 min-h-[2.6rem]">
            <div className="h-3.5 w-full rounded bg-muted/80" />
            <div className="h-3.5 w-3/4 rounded bg-muted/80" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3.5 pt-2.5 border-t border-border/60 flex items-center">
          <div className="h-3 w-20 rounded bg-muted/70" />
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const { language } = useApp();
  const t = strings[language] ?? strings.en;
  const [query, setQuery] = useState(initialQuery);
  const [searchedQuery, setSearchedQuery] = useState(initialQuery);
  const [results, setResults] = useState<Article[]>([]);
  const [latestFallback, setLatestFallback] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchAbortRef = useRef<number>(0);

  const performSearch = async (searchTerm: string) => {
    const currentRunId = ++searchAbortRef.current;
    setIsLoading(true);
    setSearchedQuery(searchTerm);

    try {
      const trimmed = searchTerm.trim();
      if (trimmed) {
        const [searchRes, latestRes] = await Promise.all([
          getPublicArticles({ query: trimmed, limit: 20 }),
          getPublicArticles({ limit: 20 }),
        ]);

        if (currentRunId !== searchAbortRef.current) return;

        if (searchRes && Array.isArray(searchRes.articles)) {
          setResults(searchRes.articles);
        } else {
          setResults([]);
        }

        if (latestRes && Array.isArray(latestRes.articles)) {
          setLatestFallback(latestRes.articles);
        }
      } else {
        const latestRes = await getPublicArticles({ limit: 20 });
        if (currentRunId !== searchAbortRef.current) return;
        setResults([]);
        if (latestRes && Array.isArray(latestRes.articles)) {
          setLatestFallback(latestRes.articles);
        }
      }
    } catch (err) {
      console.error('Failed to perform search:', err);
    } finally {
      if (currentRunId === searchAbortRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setQuery(initialQuery);
    performSearch(initialQuery);
  }, [initialQuery]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    setIsLoading(true);
    setSearchedQuery(value);

    if (value !== initialQuery) {
      if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
      else router.push('/search');
    }

    performSearch(value);
  };

  const displayArticles = results.length > 0 ? results : latestFallback;

  return (
    <main className="min-h-[60vh] bg-background py-8 md:py-12 select-none">
      <div className="mx-auto max-w-screen-xl px-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">{t.label}</p>
        <h1 className="mt-2 text-3xl font-black text-foreground md:text-5xl">{t.heading}</h1>
        <form onSubmit={submit} className="relative mt-6 max-w-3xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.placeholder}
            className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-36 text-base font-semibold text-foreground shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-accent px-5 text-sm font-black text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span className="text-xs font-bold">{t.searchingBtn}</span>
              </>
            ) : (
              t.searchBtn
            )}
          </button>
        </form>

        <div className="mb-5 mt-10 border-b border-border pb-4">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent shrink-0" />
              <div>
                <p className="text-sm font-black text-foreground">
                  {searchedQuery
                    ? t.searchingNotice(searchedQuery)
                    : t.searchingNoticeDefault}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {t.pleaseWait}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-black text-foreground">
                {searchedQuery
                  ? results.length > 0
                    ? t.resultsFor(searchedQuery)
                    : t.noFoundNotice(searchedQuery)
                  : t.defaultSection}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {searchedQuery
                  ? results.length > 0
                    ? t.foundCount(results.length)
                    : t.articlesCount(latestFallback.length)
                  : t.articlesCount(results.length || latestFallback.length)}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic State: Skeleton Loading vs Articles Grid vs Empty Notice */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
            {Array.from({ length: 8 }).map((_, index) => (
              <SearchCardSkeleton key={index} />
            ))}
          </div>
        ) : displayArticles.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
            {displayArticles.slice(0, 20).map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-black text-foreground">{t.noFound}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.tryFewer}</p>
          </div>
        )}
      </div>
    </main>
  );
}
