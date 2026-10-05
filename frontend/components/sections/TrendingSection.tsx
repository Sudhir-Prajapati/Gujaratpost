'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublicArticles } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

const DEMO_CARD_IMAGES = [
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80', // Business Market / Textile
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80', // Heavy Rain / Weather
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&auto=format&fit=crop&q=80', // Sports / Cricket Stadium
  'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=500&auto=format&fit=crop&q=80', // Metro Train / City
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=500&auto=format&fit=crop&q=80', // Politics / Election
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80', // Technology / Digital
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=80', // Stock Market / Gold
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&auto=format&fit=crop&q=80', // Newsroom / Media
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=500&auto=format&fit=crop&q=80', // Newspaper / Journal
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80', // Industry / Commerce
];

function getDistinctArticleImage(article: Article, index: number): string {
  const raw = (article as any).featuredImage || article.image || (article as any).thumbnail;
  if (raw && typeof raw === 'string' && raw.trim() !== '' && !raw.includes('photo-1599930113854')) {
    return raw.trim();
  }
  return DEMO_CARD_IMAGES[index % DEMO_CARD_IMAGES.length];
}

const isFactCheckArticle = (a: Article): boolean => {
  if (!a) return false;
  const cat = (a.category || (a as any).categoryName || '').toLowerCase();
  const catSlug = ((a as any).categorySlug || (a as any).category?.slug || '').toLowerCase();
  const slug = (a.slug || '').toLowerCase();
  const title = (a.title || '').toLowerCase();
  const titleGu = (a.titleGu || '');
  return (
    catSlug === 'fact-check' ||
    catSlug === 'factcheck' ||
    cat.includes('fact') ||
    cat.includes('ફેક્ટ') ||
    slug.startsWith('fact-check') ||
    title.includes('fact check') ||
    titleGu.includes('ફેક્ટ ચેક')
  );
};

export default function TrendingSection({ initialArticles }: { initialArticles?: Article[] }) {
  const { language } = useApp();
  const [trending, setTrending] = useState<Article[]>(() => {
    const valid = (initialArticles || []).filter(isFactCheckArticle);
    return valid.length > 0 ? valid : [];
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const isPaused = useRef(false);

  useEffect(() => {
    const valid = (initialArticles || []).filter(isFactCheckArticle);
    if (valid.length > 0) {
      setTrending(valid);
      return;
    }

    // Fetch Fact Check category articles from API
    getPublicArticles({ categorySlug: 'fact-check', limit: 10 }).then((factCheckRes) => {
      if (factCheckRes && factCheckRes.articles && factCheckRes.articles.length > 0) {
        setTrending(factCheckRes.articles);
      }
    });
  }, [initialArticles]);

  // Auto-scroll effect
  useEffect(() => {
    if (!trending.length) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    if (isMobile) {
      // Mobile: smoothly scroll 1 full card at a time every 3.5s
      const interval = setInterval(() => {
        const el = scrollContainerRef.current;
        if (!el || isPaused.current) return;
        const cardWidth = el.firstElementChild?.clientWidth || el.clientWidth;
        const step = cardWidth + 16;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScroll - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: step, behavior: 'smooth' });
        }
      }, 3500);
      return () => clearInterval(interval);
    } else {
      // Desktop: preserve continuous crawl
      const interval = setInterval(() => {
        const el = scrollContainerRef.current;
        if (!el || isPaused.current) return;
        el.scrollLeft += 1;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0;
        }
      }, 25);
      return () => clearInterval(interval);
    }
  }, [trending]);

  const updateArrows = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 5);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows);
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [trending]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth || 200;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const cardsToScroll = isMobile ? 1 : 2;
    const scrollAmount = (cardWidth + 16) * (direction === 'left' ? -cardsToScroll : cardsToScroll);
    el.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!trending.length) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 mt-2 animate-pulse">
        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-1 mb-2">
          <div className="h-9 w-32 rounded-lg bg-muted/60" />
          <div className="h-5 w-24 rounded bg-muted/60" />
        </div>
        {/* Grid Skeleton */}
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] shrink-0 rounded-lg border border-border bg-card overflow-hidden">
              <div className="aspect-[16/10] sm:aspect-[4/3] w-full bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-2 select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-1 mb-2">
        <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight flex items-center gap-2">
          <span>✅</span>
          {language === 'gu' ? 'ફેક્ટ ચેક' : language === 'hi' ? 'फैक्ट चेक' : 'Fact Check'}
        </span>
        <Link
          href="/category/fact-check"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[20px] md:text-[21px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* Carousel Container */}
      <div
        className="relative group/carousel"
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        onTouchStart={() => { isPaused.current = true; }}
        onTouchEnd={() => { setTimeout(() => { isPaused.current = false; }, 2500); }}
      >
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-1 md:-left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-white/40 bg-white/80 backdrop-blur-md shadow-lg text-[#B3121B] hover:bg-[#B3121B] hover:border-[#B3121B] transition-all cursor-pointer select-none group/btn"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 stroke-[3.5px] text-[#B3121B] group-hover/btn:text-white transition-colors" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory sm:snap-none"
        >
          {trending.slice(0, 10).map((article, index) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-md border border-slate-400 bg-card hover:border-[#B3121B]/40 hover:shadow-sm transition-all snap-start w-full sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] shrink-0"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-muted">
                <Image
                  src={getDistinctArticleImage(article, index)}
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 33vw, 20vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEMO_CARD_IMAGES[index % DEMO_CARD_IMAGES.length];
                  }}
                />
                {/* Rank Badge on top of image */}
                <div
                  className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white shadow-md z-10 select-none"
                  style={{ backgroundColor: index < 3 ? '#B3121B' : 'rgba(15, 23, 42, 0.75)' }}
                >
                  {index + 1}
                </div>
                {/* Fact Check Badge */}
                <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded bg-emerald-600/95 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md z-10 select-none">
                  <span>✓</span>
                  <span>{language === 'gu' ? 'ફેક્ટ ચેક' : language === 'hi' ? 'फैक्ट चेक' : 'Fact Check'}</span>
                </div>
              </div>

              {/* Info Text below image */}
              <div className="p-2.5 sm:p-2 flex flex-col justify-between flex-1 min-w-0">
                <h3 className="line-clamp-3 text-[14px] sm:text-[12px] md:text-[12.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors">
                  <AutoArticleTitle article={article} language={language} />
                </h3>
                <div className="mt-1.5 flex items-center text-[10.5px] sm:text-[10px] text-muted-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {language === 'gu' ? 'તપાસેલ સત્ય' : language === 'hi' ? 'સत्याપિત' : 'Verified'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-1 md:-right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-white/40 bg-white/80 backdrop-blur-md shadow-lg text-[#B3121B] hover:bg-[#B3121B] hover:border-[#B3121B] transition-all cursor-pointer select-none group/btn"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 stroke-[3.5px] text-[#B3121B] group-hover/btn:text-white transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}



