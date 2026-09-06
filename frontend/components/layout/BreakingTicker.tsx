'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pause, Play } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getLocalized } from '@/data';
import { getPublicTickers } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { AutoTranslatedText } from '@/components/ui/AutoTranslatedArticleText';

const FALLBACK_TICKERS = [
  {
    en: 'Gujarat Post: Stay updated with fastest 24/7 breaking news and live updates',
    gu: 'ગુજરાત પોસ્ટ: સૌથી ઝડપી 24/7 બ્રેકિંગ ન્યૂઝ અને લાઈવ અપડેટ્સ સાથે સતત જોડાયેલા રહો',
    hi: 'गुजरात पोस्ट: सबसे तेज़ 24/7 ब्रेकिंग न्यूज़ और लाइव अपडेट्स के साथ जुड़े रहें',
    slug: '',
  },
  {
    en: 'Exclusive ground reports, politics, business and sports analysis',
    gu: 'વિશેષ ગ્રાઉન્ડ રિપોર્ટ્સ, રાજકારણ, બિઝનેસ અને રમતગમતના સચોટ સમાચાર',
    hi: 'विशेष ग्राउंड रिपोर्ट्स, राजनीति, व्यापार और खेल समाचार',
    slug: '',
  },
];

export default function BreakingTicker() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  const [paused, setPaused] = useState(false);
  const { language } = useApp();
  const [breaking, setBreaking] = useState<any[]>([]);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(70);

  useEffect(() => {
    getPublicTickers()
      .then((res) => {
        setBreaking(res || []);
      })
      .catch(() => {
        setBreaking([]);
      });
  }, []);

  const itemsToRender = useMemo(() => {
    return breaking.map((art: any) => ({
      en: art.en || art.title,
      gu: art.gu || art.titleGu,
      hi: art.hi || art.titleHi,
      slug: art.slug || (art.articleNumber ? `${art.articleNumber}` : ''),
    }));
  }, [breaking]);

  const activeItems = itemsToRender.length > 0 ? itemsToRender : FALLBACK_TICKERS;

  // Ensure there are enough items in a single set to span wide screens seamlessly
  const singleSet = useMemo(() => {
    if (activeItems.length === 0) return [];
    if (activeItems.length < 5) {
      const repeats = Math.ceil(6 / activeItems.length);
      return Array(repeats).fill(activeItems).flat();
    }
    return activeItems;
  }, [activeItems]);

  // Dynamically calculate animation duration based on measured content width for a smooth, constant speed
  useEffect(() => {
    const measureAndSetDuration = () => {
      if (firstSetRef.current) {
        const width = firstSetRef.current.offsetWidth;
        // 42 pixels per second provides a very smooth, comfortable broadcast-style reading pace
        const speedPxPerSec = 42;
        const calculatedDuration = Math.max(30, Math.round(width / speedPxPerSec));
        setDuration(calculatedDuration);
      }
    };

    measureAndSetDuration();

    // Re-calculate on window resize or content changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && firstSetRef.current) {
      resizeObserver = new ResizeObserver(() => {
        measureAndSetDuration();
      });
      resizeObserver.observe(firstSetRef.current);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [singleSet, language]);

  const renderItem = (item: any, keyPrefix: string, index: number) => {
    const label = getLocalized(language, { en: item.en, gu: item.gu, hi: item.hi });
    if (!label) return null;
    const isLink = Boolean(item.slug);

    return (
      <span key={`${keyPrefix}-${item.slug || index}`} className="inline-flex items-center shrink-0">
        {isLink ? (
          <Link
            prefetch={false}
            href={`/news/${item.slug}`}
            className="px-2 text-sm font-bold text-white/95 hover:text-white hover:underline transition-colors focus:outline-none"
          >
            <AutoTranslatedText values={{ en: item.en, gu: item.gu, hi: item.hi }} language={language} />
          </Link>
        ) : (
          <span className="px-2 text-sm font-bold text-white/95">
            <AutoTranslatedText values={{ en: item.en, gu: item.gu, hi: item.hi }} language={language} />
          </span>
        )}
        <span className="mx-4 inline-block h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" aria-hidden="true" />
      </span>
    );
  };

  return (
    <div
      className="flex h-10 items-center overflow-hidden bg-[#B3121B] text-white border-y border-[#8a0d14] relative z-30 shadow-sm select-none"
      role="region"
      aria-label="Breaking News Ticker"
    >
      {/* Left Badge */}
      <div className="z-20 flex h-full shrink-0 items-center bg-black px-3.5 md:px-4 text-xs font-black uppercase tracking-wider text-white border-r border-black shadow-md gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span>{getLocalized(language, { en: 'BREAKING', gu: 'બ્રેકિંગ', hi: 'ब्रेकिंग' })}</span>
      </div>

      {/* Marquee Viewport */}
      <div
        className="relative flex h-full flex-1 items-center overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Soft edge gradients for subtle smooth enter/exit */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 md:w-10 bg-gradient-to-r from-[#B3121B] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 md:w-10 bg-gradient-to-l from-[#B3121B] to-transparent z-10" />

        {/* Scrolling Track */}
        <div
          className="ticker-animation"
          style={{
            animationDuration: `${duration}s`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {/* Primary Set (Measured for dynamic duration) */}
          <div ref={firstSetRef} className="inline-flex shrink-0 items-center">
            {singleSet.map((item, index) => renderItem(item, 'primary', index))}
          </div>

          {/* Seamless Duplicate Set */}
          <div className="inline-flex shrink-0 items-center" aria-hidden="true">
            {singleSet.map((item, index) => renderItem(item, 'clone', index))}
          </div>
        </div>
      </div>

      {/* Play/Pause Control Button */}
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className="z-20 flex h-full w-10 shrink-0 items-center justify-center bg-black text-white/80 hover:text-white hover:bg-neutral-900 border-l border-black transition-colors focus:outline-none focus:ring-1 focus:ring-white/50"
        title={paused ? 'Play ticker' : 'Pause ticker'}
        aria-label={paused ? 'Play ticker' : 'Pause ticker'}
      >
        {paused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
      </button>
    </div>
  );
}
