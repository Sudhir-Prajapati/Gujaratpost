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
  if (pathname === '/login' || pathname === '/cms-admin' || pathname.startsWith('/admin')) {
    return null;
  }

  const [paused, setPaused] = useState(false);
  const { language } = useApp();
  const [breaking, setBreaking] = useState<any[]>([]);
  const [tickerLabel, setTickerLabel] = useState<any>(null);
  const [tickerMode, setTickerMode] = useState<'scroll' | 'single'>('scroll');
  const [tickerSpeed, setTickerSpeed] = useState<number>(4500);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const firstSetRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(70);

  useEffect(() => {
    getPublicTickers()
      .then((res) => {
        setBreaking(res || []);
        if ((res as any)?.tickerLabel) setTickerLabel((res as any).tickerLabel);
        if ((res as any)?.tickerBadge) setTickerLabel((res as any).tickerBadge);
        if ((res as any)?.tickerMode === 'single' || (res as any)?.tickerMode === 'scroll') {
          setTickerMode((res as any).tickerMode);
        }
        if ((res as any)?.tickerSpeed && typeof (res as any).tickerSpeed === 'number') {
          setTickerSpeed((res as any).tickerSpeed);
        }
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

  const badgeText = useMemo(() => {
    if (tickerLabel) {
      if (typeof tickerLabel === 'string' && tickerLabel.trim()) {
        try {
          if (tickerLabel.trim().startsWith('{')) {
            const parsed = JSON.parse(tickerLabel);
            if (parsed && typeof parsed === 'object') {
              return getLocalized(language, parsed) || parsed.text || parsed.gu || parsed.en || parsed.hi || tickerLabel;
            }
          }
        } catch {}
        return tickerLabel.trim();
      }
      if (typeof tickerLabel === 'object') {
        return getLocalized(language, tickerLabel) || tickerLabel.text || tickerLabel.gu || tickerLabel.en || tickerLabel.hi;
      }
    }
    return getLocalized(language, { en: 'BREAKING NEWS', gu: 'બ્રેકિંગ ન્યૂઝ', hi: 'ब्रेकिंग न्यूज़' });
  }, [tickerLabel, language]);

  const activeItems = itemsToRender.length > 0 ? itemsToRender : FALLBACK_TICKERS;

  // Single mode auto-advancing interval with smooth exit and enter animation
  useEffect(() => {
    if (tickerMode !== 'single' || paused || activeItems.length <= 1) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeItems.length);
        setIsTransitioning(false);
      }, 300);
    }, tickerSpeed);

    return () => clearInterval(interval);
  }, [tickerMode, paused, activeItems.length, tickerSpeed]);

  // Ensure there are enough items in a single set to span wide screens seamlessly in scroll mode
  const singleSet = useMemo(() => {
    if (activeItems.length === 0) return [];
    if (activeItems.length < 5) {
      const repeats = Math.ceil(6 / activeItems.length);
      return Array(repeats).fill(activeItems).flat();
    }
    return activeItems;
  }, [activeItems]);

  // Dynamically calculate animation duration based on measured content width for smooth scroll
  useEffect(() => {
    if (tickerMode !== 'scroll') return;

    const measureAndSetDuration = () => {
      if (firstSetRef.current) {
        const width = firstSetRef.current.offsetWidth;
        const speedPxPerSec = 42;
        const calculatedDuration = Math.max(30, Math.round(width / speedPxPerSec));
        setDuration(calculatedDuration);
      }
    };

    measureAndSetDuration();

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
  }, [singleSet, language, tickerMode]);



  const renderScrollItem = (item: any, keyPrefix: string, index: number) => {
    const label = getLocalized(language, { en: item.en, gu: item.gu, hi: item.hi });
    if (!label) return null;
    const isLink = Boolean(item.slug);

    return (
      <span key={`${keyPrefix}-${item.slug || index}`} className="inline-flex items-center shrink-0">
        {isLink ? (
          <Link
            prefetch={false}
            href={`/news/${item.slug}`}
            className="px-2 sm:px-2.5 text-[12.5px] sm:text-[16px] md:text-[16.5px] font-bold text-white/95 hover:text-white hover:underline transition-colors focus:outline-none tracking-normal leading-normal"
          >
            <AutoTranslatedText values={{ en: item.en, gu: item.gu, hi: item.hi }} language={language} />
          </Link>
        ) : (
          <span className="px-2 sm:px-2.5 text-[12.5px] sm:text-[16px] md:text-[16.5px] font-bold text-white/95 tracking-normal leading-normal">
            <AutoTranslatedText values={{ en: item.en, gu: item.gu, hi: item.hi }} language={language} />
          </span>
        )}
        <span className="mx-2.5 sm:mx-4 inline-block h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-white/70 shrink-0" aria-hidden="true" />
      </span>
    );
  };

  const currentSingleItem = activeItems[currentIndex] || activeItems[0];

  return (
    <div
      className="flex h-8 sm:h-11 md:h-11.5 items-center overflow-hidden bg-[#B3121B] text-white border-y border-[#8a0d14] relative z-30 shadow-sm select-none mb-3 sm:mb-3.5 md:mb-4"
      role="region"
      aria-label="Breaking News Ticker"
    >
      {/* Left Badge */}
      <div className="z-20 flex h-full shrink-0 items-center bg-black px-2 sm:px-3.5 md:px-4 text-[11px] sm:text-[14px] md:text-[14.5px] font-black uppercase tracking-wider text-white border-r border-black shadow-md gap-1.5 sm:gap-2 whitespace-nowrap">
        <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-600"></span>
        </span>
        <span>{badgeText}</span>
      </div>

      {/* ── MODE 1: CONTINUOUS MARQUEE SCROLL (Right to Left) ── */}
      {tickerMode === 'scroll' ? (
        <div
          className="relative flex h-full flex-1 items-center overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Soft edge gradients */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 sm:w-6 md:w-10 bg-gradient-to-r from-[#B3121B] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 sm:w-6 md:w-10 bg-gradient-to-l from-[#B3121B] to-transparent z-10" />

          {/* Scrolling Track */}
          <div
            className="ticker-animation"
            style={{
              animationDuration: `${duration}s`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          >
            {/* Primary Set */}
            <div ref={firstSetRef} className="inline-flex shrink-0 items-center">
              {singleSet.map((item, index) => renderScrollItem(item, 'primary', index))}
            </div>

            {/* Seamless Duplicate Set */}
            <div className="inline-flex shrink-0 items-center" aria-hidden="true">
              {singleSet.map((item, index) => renderScrollItem(item, 'clone', index))}
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE 2: SINGLE / ONE-BY-ONE HEADLINE SLIDER ── */
        <div
          className="relative flex h-full flex-1 items-center overflow-hidden px-2.5 sm:px-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {currentSingleItem && (
            <div
              key={currentIndex}
              className={`w-full flex items-center justify-between gap-3 transition-all duration-300 ease-in-out ${
                isTransitioning
                  ? 'opacity-0 -translate-y-4 filter blur-[1px]'
                  : 'headline-enter-anim'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                </span>
                {currentSingleItem.slug ? (
                  <Link
                    prefetch={false}
                    href={`/news/${currentSingleItem.slug}`}
                    className="truncate text-[12.5px] sm:text-[15.5px] md:text-[16.5px] font-bold text-white hover:underline focus:outline-none tracking-normal leading-normal"
                  >
                    <AutoTranslatedText
                      values={{
                        en: currentSingleItem.en,
                        gu: currentSingleItem.gu,
                        hi: currentSingleItem.hi,
                      }}
                      language={language}
                    />
                  </Link>
                ) : (
                  <span className="truncate text-[12.5px] sm:text-[15.5px] md:text-[16.5px] font-bold text-white tracking-normal leading-normal">
                    <AutoTranslatedText
                      values={{
                        en: currentSingleItem.en,
                        gu: currentSingleItem.gu,
                        hi: currentSingleItem.hi,
                      }}
                      language={language}
                    />
                  </span>
                )}
              </div>

              {/* Counter Pill e.g. 1 / 3 */}
              {activeItems.length > 1 && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-black/35 text-white/90 shrink-0 tabular-nums border border-white/10 shadow-xs">
                  {currentIndex + 1} / {activeItems.length}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Play/Pause Control Button */}
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className="z-20 flex h-full w-7 sm:w-10 shrink-0 items-center justify-center bg-black text-white/80 hover:text-white hover:bg-neutral-900 border-l border-black transition-colors focus:outline-none focus:ring-1 focus:ring-white/50 cursor-pointer"
        title={paused ? 'Play ticker' : 'Pause ticker'}
        aria-label={paused ? 'Play ticker' : 'Pause ticker'}
      >
        {paused ? (
          <Play className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current" />
        ) : (
          <Pause className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current" />
        )}
      </button>
    </div>
  );
}
