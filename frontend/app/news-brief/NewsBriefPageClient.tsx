'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, ChevronUp, ChevronDown } from 'lucide-react';
import { getArticleTitle, getArticleExcerpt, getArticleContent, getCategoryLabel } from '@/data';
import { getPublicArticles } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';
import { useAutoTranslate } from '@/lib/translate';
import { sanitizeImageUrl } from '@/lib/media';

function cleanBriefText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/<[^>]*>/g, '')
    .replace(/##\s*📌?\s*એક નજરમાં\s*\(KEY HIGHLIGHTS\)/gi, '')
    .replace(/📌\s*એક નજરમાં\s*\(KEY HIGHLIGHTS\)/gi, '')
    .replace(/\(KEY HIGHLIGHTS\)/gi, '')
    .replace(/KEY HIGHLIGHTS/gi, '')
    .replace(/^#+\s*/gm, '')
    .replace(/[-=_]{3,}/g, '')
    .replace(/[`*~_]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return 'હમણાં જ';
  if (diff < 60) return `${diff} મિનિટ પહેલા`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} કલાક પહેલા`;
  return `${Math.floor(h / 24)} દિવસ પહેલા`;
}

export default function NewsBriefPageClient() {
  const { language } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [briefArticles, setBriefArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [animDir, setAnimDir] = useState<'up' | 'down' | null>(null);
  const [imgError, setImgError] = useState(false);
  const imageCache = useRef<Map<string, 'loaded' | 'error'>>(new Map());
  const [, setCacheVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const wheelDelta = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setImgError(false);
  }, [activeIndex]);

  // Preload default Gujarat Post logo immediately on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultLogo = new window.Image();
      defaultLogo.src = '/assets/gujarat-post-logo.png';
    }
  }, []);

  // Preload upcoming & previous article images eagerly into browser memory cache
  useEffect(() => {
    if (!briefArticles.length) return;

    // Preload current, next 7, and previous 2 articles
    const indicesToPreload = [
      activeIndex,
      activeIndex + 1,
      activeIndex + 2,
      activeIndex + 3,
      activeIndex + 4,
      activeIndex + 5,
      activeIndex + 6,
      activeIndex + 7,
      activeIndex - 1,
      activeIndex - 2,
    ].filter((idx) => idx >= 0 && idx < briefArticles.length);

    indicesToPreload.forEach((idx) => {
      const art = briefArticles[idx];
      const raw = art ? ((art as any).featuredImage || art.image || (art as any).thumbnail || '') : '';
      const url = sanitizeImageUrl(raw);
      if (!url || imageCache.current.has(url)) return;

      const img = new window.Image();
      img.src = url;
      img.onload = () => {
        imageCache.current.set(url, 'loaded');
        setCacheVersion((v) => v + 1);
      };
      img.onerror = () => {
        imageCache.current.set(url, 'error');
        setCacheVersion((v) => v + 1);
      };
    });
  }, [activeIndex, briefArticles]);

  // Lock both documentElement and body completely while on news brief
  useEffect(() => {
    document.documentElement.classList.add('news-brief-open');
    document.body.classList.add('news-brief-open');
    const origBodyOverflow = document.body.style.overflow;
    const origBodyOverscroll = document.body.style.overscrollBehavior;
    const origBodyTouch = document.body.style.touchAction;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const origHtmlTouch = document.documentElement.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.touchAction = 'none';

    return () => {
      document.documentElement.classList.remove('news-brief-open');
      document.body.classList.remove('news-brief-open');
      document.body.style.overflow = origBodyOverflow;
      document.body.style.overscrollBehavior = origBodyOverscroll;
      document.body.style.touchAction = origBodyTouch;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.documentElement.style.overscrollBehavior = origHtmlOverscroll;
      document.documentElement.style.touchAction = origHtmlTouch;
    };
  }, []);

  // Prevent browser native touchmove scrolling / bounce / pull-to-refresh
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventTouch = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchmove', preventTouch, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventTouch);
    };
  }, []);

  useEffect(() => {
    getPublicArticles({ page: 1, limit: 20 }).then((res) => {
      if (res?.articles?.length > 0) setBriefArticles(res.articles);
    });
  }, []);

  useEffect(() => {
    if (briefArticles.length > 0 && activeIndex >= briefArticles.length - 6 && !isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      getPublicArticles({ page: nextPage, limit: 20 }).then((res) => {
        if (res?.articles?.length > 0) {
          setBriefArticles((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newItems = res.articles.filter((a: Article) => !existingIds.has(a.id));
            if (newItems.length === 0) { setHasMore(false); return prev; }
            return [...prev, ...newItems];
          });
          setPage(nextPage);
        } else setHasMore(false);
      }).finally(() => setIsLoadingMore(false));
    }
  }, [activeIndex, briefArticles.length, isLoadingMore, hasMore, page]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') handleNext();
      else if (e.key === 'ArrowUp') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, briefArticles.length]);

  const currentArticle = briefArticles[activeIndex];

  const handleNext = () => {
    if (!briefArticles.length) return;
    if (activeIndex < briefArticles.length - 1) {
      setAnimDir('up');
      setTimeout(() => setAnimDir(null), 300);
      setActiveIndex((p) => p + 1);
    }
  };

  const handlePrev = () => {
    if (!briefArticles.length || activeIndex === 0) return;
    setAnimDir('down');
    setTimeout(() => setAnimDir(null), 300);
    setActiveIndex((p) => Math.max(0, p - 1));
  };

  const handleWheel = (e: React.WheelEvent) => {
    wheelDelta.current += e.deltaY;
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => {
      if (wheelDelta.current > 40) handleNext();
      else if (wheelDelta.current < -40) handlePrev();
      wheelDelta.current = 0;
    }, 60);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartY.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const diffY = touchStartY.current - endY;
    const diffX = touchStartX.current !== null ? touchStartX.current - endX : 0;

    // Detect vertical swipe of at least 35px that dominates horizontal movement
    if (Math.abs(diffY) > 35 && Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY > 0) handleNext();
      else handlePrev();
    }
    touchStartY.current = null;
    touchStartX.current = null;
    isSwiping.current = false;
  };

  const handleTouchCancel = () => {
    touchStartY.current = null;
    touchStartX.current = null;
    isSwiping.current = false;
  };

  const handleShare = async () => {
    if (!currentArticle) return;
    const url = `${window.location.origin}/news/${currentArticle.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: getArticleTitle(currentArticle, language), url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch (e) { console.warn(e); }
  };

  const rawTitle = currentArticle ? getArticleTitle(currentArticle, language) : '';
  const category = currentArticle ? getCategoryLabel(currentArticle, language) : '';
  const rawExcerpt = currentArticle ? getArticleExcerpt(currentArticle, language) : '';
  const rawContent = currentArticle ? getArticleContent(currentArticle, language) : '';
  const cleanedExcerpt = cleanBriefText(rawExcerpt);
  const cleanedContent = cleanBriefText(rawContent);
  const rawDisplayParagraph = (cleanedContent.length > cleanedExcerpt.length && cleanedContent.length > 50)
    ? cleanedContent : (cleanedExcerpt.length > 20 ? cleanedExcerpt : cleanedContent);

  const rawImg = currentArticle
    ? ((currentArticle as any).featuredImage || currentArticle.image || (currentArticle as any).thumbnail || '')
    : '';
  const cleanImg = sanitizeImageUrl(rawImg);
  const isImageError = !cleanImg || imgError || imageCache.current.get(cleanImg) === 'error';

  const title = useAutoTranslate(rawTitle, language);
  const displayParagraph = useAutoTranslate(rawDisplayParagraph, language);
  const ago = timeAgo((currentArticle as any)?.publishedAt || (currentArticle as any)?.createdAt);

  if (!currentArticle) {
    return (
      <div className="fixed inset-0 h-screen h-[100dvh] w-full flex flex-col items-center justify-center bg-[#f0f2f5] gap-4 overflow-hidden select-none">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#B3121B] animate-spin" />
        </div>
        <p className="text-neutral-400 font-semibold text-sm">Loading stories...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 h-screen h-[100dvh] w-screen w-full flex flex-col overflow-hidden bg-[#f0f2f5] select-none touch-none overscroll-none"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onWheel={handleWheel}
    >
      {/* ── COMPACT NAVBAR ── */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-neutral-100 shadow-sm z-10" style={{ height: 56 }}>
        <Link href="/" className="flex items-center h-full py-1 shrink-0">
          <Image
            src="/assets/gujarat-post-logo-cms.png"
            alt="Gujarat Post"
            width={160}
            height={42}
            className="object-contain"
            style={{ height: 40, width: 'auto' }}
            priority
          />
        </Link>

        {/* Article counter */}
        <span className="text-[13px] font-bold text-neutral-500 tabular-nums">
          {activeIndex + 1} / {briefArticles.length}
        </span>

        {/* Back arrow */}
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
          aria-label="Back to home"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B3121B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* ── BODY: card + right-side nav ── */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-2.5 sm:px-4 py-2 sm:py-3 gap-0 md:gap-4 overflow-hidden">
        {/* ── Article Card ── */}
        <div
          className="w-full bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-neutral-100 h-full max-h-[700px]"
          style={{
            maxWidth: 456,
            transform: animDir === 'up' ? 'translateY(-8px)' : animDir === 'down' ? 'translateY(8px)' : 'translateY(0)',
            opacity: animDir ? 0.55 : 1,
            transition: 'transform 0.28s cubic-bezier(.4,0,.2,1), opacity 0.28s',
          }}
        >
          {/* Hero image with rounded corners or Gujarat Post logo fallback */}
          <div
            className="relative w-full overflow-hidden rounded-xl mx-2.5 sm:mx-3 mt-2.5 sm:mt-3 shrink-0 bg-neutral-900 border border-neutral-100"
            style={{ aspectRatio: '16/10', width: 'calc(100% - 20px)' }}
          >
            {/* Always present default branded Gujarat Post logo layer as base */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1c1c1f] via-[#141416] to-[#09090b] p-5 select-none overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px] opacity-10 pointer-events-none" />
              <div className="absolute w-44 h-24 bg-[#B3121B]/25 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 w-48 h-14 sm:w-56 sm:h-16 flex items-center justify-center">
                <Image
                  src="/assets/gujarat-post-logo.png"
                  alt="Gujarat Post"
                  fill
                  sizes="260px"
                  className="object-contain drop-shadow-md"
                  priority
                  unoptimized
                />
              </div>
              <span className="relative z-10 mt-1.5 text-[10.5px] font-bold tracking-widest uppercase text-white/50">
                સત્ય અને સચોટ સમાચાર
              </span>
            </div>

            {/* Real article image overlay when valid and available */}
            {cleanImg && !isImageError && (
              <Image
                key={cleanImg}
                src={cleanImg}
                alt={title || 'Gujarat Post'}
                fill
                sizes="(max-width: 640px) 380px, 456px"
                className="object-cover relative z-20"
                priority
                unoptimized
                onError={() => {
                  if (cleanImg) {
                    imageCache.current.set(cleanImg, 'error');
                  }
                  setImgError(true);
                }}
              />
            )}
          </div>

          {/* Card content — flex-1 with justify-between so it fills remaining height without overflowing */}
          <div className="flex-1 px-4 sm:px-5 pt-2 sm:pt-3 pb-2.5 sm:pb-3 flex flex-col justify-between min-h-0 overflow-hidden gap-1.5 sm:gap-2">

            {/* Category + time row */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="text-[14px] sm:text-[14.5px] font-black text-[#B3121B] uppercase tracking-wide">{category}</span>
              {ago && (
                <>
                  <span className="text-neutral-300 text-xs">·</span>
                  <span className="text-[13px] sm:text-[13.5px] text-neutral-500 font-medium">{ago}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="font-black text-neutral-900 leading-snug text-[18px] sm:text-[20px] line-clamp-2 sm:line-clamp-3 shrink-0">
              {title}
            </h2>

            {/* Excerpt */}
            <p className="text-neutral-700 text-[15px] sm:text-[16px] leading-relaxed line-clamp-4 sm:line-clamp-5 flex-1 min-h-0 overflow-hidden font-normal">
              {displayParagraph}
            </p>

            {/* Disclaimer */}
            <p className="text-[11.5px] sm:text-[12px] text-neutral-400 leading-tight italic shrink-0">
              Disclaimer – આ ન્યૂઝ AI-જનરેટેડ સારાંશ છે અને એડિટર દ્વારા રિવ્યૂ કરાયો છે.
            </p>

            {/* Action row */}
            <div className="flex items-center justify-between pt-0.5 shrink-0">
              <Link
                href={`/news/${currentArticle.slug}`}
                className="px-5 py-2 sm:px-5 sm:py-2 rounded-full border-2 border-[#B3121B] text-[#B3121B] font-black text-[15px] sm:text-[15.5px] hover:bg-[#B3121B] hover:text-white transition-colors active:scale-95"
              >
                {language === 'gu' ? 'વધુ વાંચો' : language === 'hi' ? 'और पढ़ें' : 'Read More'}
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className="relative w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center active:scale-95 transition hover:bg-neutral-700"
                aria-label="Share"
              >
                <Share2 className="w-3.5 h-3.5 text-white stroke-[2]" />
                {copied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── INTERACTIVE ANIMATED NEXT STORY BAR (Mobile View Only) ── */}
          <div className="flex md:hidden py-2.5 px-4 items-center justify-between border-t border-neutral-100 bg-neutral-50/80 shrink-0">
            {/* Left: Previous story button (if activeIndex > 0) or latest badge */}
            {activeIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 text-[14px] font-bold text-neutral-600 hover:text-neutral-900 active:scale-95 transition-colors cursor-pointer group py-0.5"
                aria-label="Previous story"
              >
                <div className="w-7 h-7 rounded-full bg-white border border-neutral-200 flex items-center justify-center group-hover:border-neutral-400 transition-colors shadow-xs">
                  <ChevronUp className="w-4 h-4 text-neutral-700 group-hover:text-black stroke-[2.5]" />
                </div>
                <span>{language === 'gu' ? 'પાછળ' : language === 'hi' ? 'पिछली खबर' : 'Previous'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[13px] font-bold tracking-wide text-neutral-500 py-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B3121B] animate-pulse" />
                <span>{language === 'gu' ? 'નવી સ્ટોરી' : language === 'hi' ? 'તાज़ा खबर' : 'Latest'}</span>
              </div>
            )}

            {/* Right: Animated Next Story button with bouncing arrow */}
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex >= briefArticles.length - 1 && !hasMore}
              className="flex items-center gap-2.5 text-neutral-800 hover:text-[#B3121B] active:scale-95 transition-all cursor-pointer group disabled:opacity-30 disabled:cursor-not-allowed py-0.5"
              aria-label="Next story"
            >
              <span className="text-[14px] font-bold tracking-wide group-hover:text-[#B3121B] transition-colors">
                {language === 'gu' ? 'આગળની સ્ટોરી' : language === 'hi' ? 'अगली खबर' : 'Next Story'}
              </span>
              <div className="relative w-7 h-7 rounded-full bg-red-50 border border-red-200 group-hover:bg-[#B3121B] group-hover:border-[#B3121B] flex items-center justify-center transition-all shadow-xs">
                <ChevronDown className="w-4 h-4 text-[#B3121B] group-hover:text-white stroke-[2.5] animate-bounce" />
              </div>
            </button>
          </div>
        </div>

        {/* ── Right-side nav buttons — hidden on mobile, shown on md+ desktop ── */}
        <div className="hidden md:flex flex-col gap-3 shrink-0 self-center">
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="w-11 h-11 rounded-full bg-neutral-500 flex items-center justify-center shadow-md active:scale-90 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer hover:bg-neutral-600"
            aria-label="Previous"
          >
            <ChevronUp className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
          <button
            onClick={handleNext}
            disabled={activeIndex >= briefArticles.length - 1 && !hasMore}
            className="w-11 h-11 rounded-full bg-neutral-800 flex items-center justify-center shadow-md active:scale-90 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer hover:bg-neutral-700"
            aria-label="Next"
          >
            <ChevronDown className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
}
