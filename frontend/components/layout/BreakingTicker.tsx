'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pause, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BREAKING_TICKER, getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';

export default function BreakingTicker() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  const [paused, setPaused] = useState(false);
  const { language } = useApp();
  const [breaking, setBreaking] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/news/breaking?limit=10')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.articles?.length > 0) {
          setBreaking(json.data.articles);
        }
      })
      .catch(() => {});
  }, []);

  const itemsToRender = breaking.length > 0
    ? breaking.map((art: any) => ({
        en: art.title,
        gu: art.titleGu,
        hi: art.titleHi,
        slug: art.slug,
      }))
    : BREAKING_TICKER;

  return (
    <div className="flex h-10 items-center overflow-hidden bg-accent text-white">
      <div className="z-10 flex h-full shrink-0 items-center bg-black/25 px-3 text-xs font-black uppercase tracking-wide">
        {getLocalized(language, { en: 'BREAKING', gu: 'બ્રેકિંગ', hi: 'ब्रेकिंग' })}
      </div>
      <div
        className="relative flex h-full flex-1 items-center overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="ticker-animation text-sm font-bold" style={{ animationPlayState: paused ? 'paused' : 'running' }}>
          {[...itemsToRender, ...itemsToRender].map((item, index) => {
            const label = getLocalized(language, { en: item.en, gu: item.gu, hi: item.hi });
            return (
              <span key={`${item.slug}-${index}`} className="inline-flex items-center">
                <Link href={`/news/${item.slug}`} className="px-2 hover:underline">
                  {label}
                </Link>
                <span className="mx-4 h-1.5 w-1.5 rounded-full bg-white/50" />
              </span>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className="flex h-full w-10 shrink-0 items-center justify-center bg-black/20"
        aria-label={paused ? 'Play ticker' : 'Pause ticker'}
      >
        {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
