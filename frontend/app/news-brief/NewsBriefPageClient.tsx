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
  const touchStartY = useRef<number | null>(null);
  const wheelDelta = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setImgError(false);
  }, [activeIndex]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
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
      if (wheelDelta.current > 60) handleNext();
      else if (wheelDelta.current < -60) handlePrev();
      wheelDelta.current = 0;
    }, 80);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) { if (diff > 0) handleNext(); else handlePrev(); }
    touchStartY.current = null;
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

  const title = useAutoTranslate(rawTitle, language);
  const displayParagraph = useAutoTranslate(rawDisplayParagraph, language);
  const ago = timeAgo((currentArticle as any)?.publishedAt || (currentArticle as any)?.createdAt);

  if (!currentArticle) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f0f2f5] gap-4">
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
      className="h-screen h-[100dvh] w-full flex flex-col overflow-hidden bg-[#f0f2f5]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* ── COMPACT NAVBAR ── */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-neutral-100 shadow-sm" style={{ height: 60 }}>
        <Link href="/" className="flex items-center h-full py-1 shrink-0">
          <Image
            src="/assets/gujarat-post-logo-cms.png"
            alt="Gujarat Post"
            width={180}
            height={48}
            className="object-contain"
            style={{ height: 46, width: 'auto' }}
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
      <div className="flex-1 flex items-center justify-center min-h-0 px-4 py-3 gap-4">
        {/* ── Article Card ── */}
        <div
          className="w-full bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-neutral-100"
          style={{
            maxWidth: 456,
            maxHeight: 'min(740px, calc(100dvh - 80px))',
            transform: animDir === 'up' ? 'translateY(-8px)' : animDir === 'down' ? 'translateY(8px)' : 'translateY(0)',
            opacity: animDir ? 0.55 : 1,
            transition: 'transform 0.28s cubic-bezier(.4,0,.2,1), opacity 0.28s',
          }}
        >
          {/* Hero image with rounded corners or Gujarat Post logo fallback */}
          <div className="relative w-full overflow-hidden rounded-xl mx-3 mt-3 shrink-0 bg-neutral-100" style={{ aspectRatio: '16/10', width: 'calc(100% - 24px)' }}>
            {cleanImg && !imgError ? (
              <Image
                src={cleanImg}
                alt={title || 'Gujarat Post'}
                fill
                sizes="(max-width: 640px) 380px, 456px"
                className="object-cover"
                priority
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-50 via-slate-100 to-neutral-200/80 p-6 select-none border border-neutral-200/40 rounded-xl">
                <div className="relative w-48 h-14 sm:w-52 sm:h-16 flex items-center justify-center">
                  <Image
                    src="/assets/gujarat-post-logo.png"
                    alt="Gujarat Post"
                    fill
                    sizes="220px"
                    className="object-contain drop-shadow-sm"
                    priority
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card content — flex-1 so it fills remaining height */}
          <div className="flex-1 px-5 pt-3.5 pb-2.5 flex flex-col gap-2.5 min-h-0">

            {/* Category + time row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14.5px] font-black text-[#B3121B] uppercase tracking-wide">{category}</span>
              {ago && (
                <>
                  <span className="text-neutral-200 text-xs">·</span>
                  <span className="text-[13.5px] text-neutral-500 font-medium">{ago}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h2 className="font-black text-neutral-900 leading-snug text-[20.5px] sm:text-[22px] line-clamp-3">
              {title}
            </h2>

            {/* Excerpt */}
            <p className="text-neutral-700 text-[16.5px] sm:text-[17.5px] leading-relaxed line-clamp-5 flex-1 font-normal">
              {displayParagraph}
            </p>

            {/* Disclaimer */}
            <p className="text-[12px] text-neutral-400 leading-snug italic">
              Disclaimer – આ ન્યૂઝ AI-જનરેટેડ સારાંશ છે અને એડિટર દ્વારા રિવ્યૂ કરાયો છે.
            </p>

            {/* Action row */}
            <div className="flex items-center justify-between pt-1">
              <Link
                href={`/news/${currentArticle.slug}`}
                className="px-5 py-2 rounded-full border-2 border-[#B3121B] text-[#B3121B] font-black text-[15.5px] hover:bg-[#B3121B] hover:text-white transition-colors active:scale-95"
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

          {/* Swipe hint */}
          <div className="flex justify-center py-2">
            <ChevronDown className="w-3.5 h-3.5 text-neutral-300 animate-bounce" />
          </div>
        </div>

        {/* ── Right-side nav buttons ── */}
        <div className="flex flex-col gap-3 shrink-0 self-center">
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
