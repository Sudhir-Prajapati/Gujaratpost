'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SearchX } from 'lucide-react';
import { searchArticles } from '@/data';
import NewsCard from '@/components/ui/NewsCard';

export default function SearchResultsClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => searchArticles(initialQuery), [initialQuery]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <main className="min-h-[60vh] bg-background py-8 md:py-12">
      <div className="mx-auto max-w-screen-xl px-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Gujarat Post Search</p>
        <h1 className="mt-2 text-3xl font-black text-foreground md:text-5xl">Search the newsroom</h1>
        <form onSubmit={submit} className="relative mt-6 max-w-3xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search news, city, category or topic..." className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-28 text-base font-semibold text-foreground shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10" />
          <button type="submit" className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-accent px-5 text-sm font-black text-white hover:bg-red-700">Search</button>
        </form>

        <div className="mb-5 mt-10 border-b border-border pb-4">
          <p className="text-sm font-black text-foreground">{initialQuery ? `Results for “${initialQuery}”` : 'Enter a search term'}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{results.length} {results.length === 1 ? 'article' : 'articles'} found</p>
        </div>

        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{results.map((article) => <NewsCard key={article.id} article={article} />)}</div>
        ) : initialQuery ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card py-16 text-center"><SearchX className="h-10 w-10 text-muted-foreground/50" /><h2 className="mt-4 text-xl font-black text-foreground">No stories found</h2><p className="mt-2 text-sm text-muted-foreground">Try fewer words or search by city, category or person.</p></div>
        ) : null}
      </div>
    </main>
  );
}
