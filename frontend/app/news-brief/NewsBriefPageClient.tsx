'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, ArrowLeft, ChevronUp, ChevronDown, BookOpen } from 'lucide-react';
import { getArticleTitle, getArticleExcerpt, getArticleContent, getCategoryLabel } from '@/data';
import { getPublicArticles } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import type { Article } from '@/types';
import { useAutoTranslate } from '@/lib/translate';

function cleanBriefText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/<[^>]*>/g, '') // Strip HTML tags (<p>, <h2>, <ul>, <li>, etc.)
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

export default function NewsBriefPageClient() {
  const { language } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [briefArticles, setBriefArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [animDir, setAnimDir] = useState<'up' | 'down' | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch initial 20 articles for News Brief (Page 1)
  useEffect(() => {
    getPublicArticles({ page: 1, limit: 20 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setBriefArticles(res.articles);
      }
    });
  }, []);

  // Automatically load 20 MORE articles when user reaches 15th article (or within 5 items of end)
  useEffect(() => {
    if (
      briefArticles.length > 0 &&
      activeIndex >= briefArticles.length - 6 &&
      !isLoadingMore &&
      hasMore
    ) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      getPublicArticles({ page: nextPage, limit: 20 })
        .then((res) => {
          if (res && res.articles && res.articles.length > 0) {
            setBriefArticles((prev) => {
              const existingIds = new Set(prev.map((a) => a.id));
              const newItems = res.articles.filter((a) => !existingIds.has(a.id));
              if (newItems.length === 0) {
                setHasMore(false);
                return prev;
              }
              return [...prev, ...newItems];
            });
            setPage(nextPage);
          } else {
            setHasMore(false);
          }
        })
        .finally(() => {
          setIsLoadingMore(false);
        });
    }
  }, [activeIndex, briefArticles.length, isLoadingMore, hasMore, page]);

  // Keyboard navigation
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
    if (briefArticles.length === 0) return;
    if (activeIndex < briefArticles.length - 1) {
      setAnimDir('up');
      setTimeout(() => setAnimDir(null), 350);
      setActiveIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (briefArticles.length === 0 || activeIndex === 0) return;
    setAnimDir('down');
    setTimeout(() => setAnimDir(null), 350);
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartY.current = null;
  };

  const handleShare = async () => {
    if (!currentArticle) return;
    const url = `${window.location.origin}/news/${currentArticle.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: getArticleTitle(currentArticle, language),
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const rawTitle = currentArticle ? getArticleTitle(currentArticle, language) : '';
  const category = currentArticle ? getCategoryLabel(currentArticle, language) : '';
  const rawExcerpt = currentArticle ? getArticleExcerpt(currentArticle, language) : '';
  const rawContent = currentArticle ? getArticleContent(currentArticle, language) : '';

  const cleanedExcerpt = cleanBriefText(rawExcerpt);
  const cleanedContent = cleanBriefText(rawContent);

  // Use full content if longer to fill the available space nicely
  const rawDisplayParagraph = (cleanedContent.length > cleanedExcerpt.length && cleanedContent.length > 50)
    ? cleanedContent
    : (cleanedExcerpt.length > 20 ? cleanedExcerpt : cleanedContent);

  const title = useAutoTranslate(rawTitle, language);
  const displayParagraph = useAutoTranslate(rawDisplayParagraph, language);

  if (!currentArticle) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8f9fa] overflow-hidden gap-3">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-[#B3121B] rounded-full animate-spin" />
        <p className="text-neutral-500 font-semibold text-sm">સમાચાર લોડ થઈ રહ્યા છે...</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen h-[100dvh] w-full flex flex-col overflow-hidden select-none"
      style={{ background: 'linear-gradient(160deg, #f8f9fa 0%, #eef1f4 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── TOP BAR ── */}
      <div
        className="relative bg-[#B3121B] text-white px-4 flex items-center justify-between shrink-0 shadow-lg"
        style={{ minHeight: 52 }}
      >
        {/* Back button */}
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 active:scale-90 transition border border-white/20 shrink-0"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4 text-white stroke-[2.5]" />
        </Link>

        {/* Center title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-white/80" />
          <span className="font-black text-sm tracking-widest uppercase text-white/95">
            NEWS BRIEF
          </span>
        </div>

        {/* Counter badge */}
        <div className="shrink-0 bg-white/15 border border-white/25 rounded-full px-3 py-1 text-[11px] font-extrabold text-white/90 tracking-wide">
          {activeIndex + 1} / {briefArticles.length}
        </div>
      </div>

      {/* ── MAIN CARD AREA ── */}
      <div className="flex-1 flex flex-col min-h-0 px-3 pt-3 pb-3 overflow-hidden">
        {/* Card */}
        <div
          className="flex-1 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] overflow-hidden flex flex-col min-h-0 border border-neutral-200/60"
          style={{
            transition: 'transform 0.28s cubic-bezier(.4,0,.2,1), opacity 0.28s',
            transform: animDir === 'up' ? 'translateY(-8px)' : animDir === 'down' ? 'translateY(8px)' : 'none',
            opacity: animDir ? 0.7 : 1,
          }}
        >
          {/* Hero Image */}
          <div className="relative w-full shrink-0" style={{ aspectRatio: '16/9' }}>
            <Image
              src={currentArticle.image}
              alt={title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            {/* Category label overlaid on image */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-6 pb-2.5 px-3">
              <span className="inline-block bg-[#B3121B] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                {category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-3">
            {/* Title */}
            <h2 className="font-black text-neutral-900 leading-snug mb-2.5 text-[16px] line-clamp-2 shrink-0">
              {title}
            </h2>

            {/* Summary */}
            <div className="flex-1 min-h-0 overflow-hidden mb-3">
              <p className="text-[13px] text-neutral-600 leading-relaxed text-justify line-clamp-[7]">
                {displayParagraph}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between shrink-0 border-t border-neutral-100 pt-3">
              <Link
                href={`/news/${currentArticle.slug}`}
                className="flex items-center gap-1.5 bg-[#B3121B] text-white font-black text-[12px] px-5 py-2.5 rounded-full active:scale-95 transition shadow-sm"
              >
                {language === 'gu' ? 'વધુ વાંચો' : language === 'hi' ? 'और पढ़ें' : 'Read More'}
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className="relative bg-neutral-900 text-white rounded-full p-2.5 h-10 w-10 flex items-center justify-center active:scale-95 transition shadow-sm"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4 stroke-[2.2]" />
                {copied && (
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION BAR (below card) ── */}
        <div className="shrink-0 flex items-center justify-center gap-4 mt-3">
          {/* Prev Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md transition active:scale-90 border ${
              activeIndex === 0
                ? 'bg-neutral-200 text-neutral-400 border-neutral-200 opacity-40 cursor-not-allowed'
                : 'bg-white text-[#B3121B] border-neutral-200 hover:bg-red-50 cursor-pointer'
            }`}
            aria-label="Previous article"
          >
            <ChevronUp className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(briefArticles.length, 5) }).map((_, i) => {
              const total = Math.min(briefArticles.length, 5);
              const offset = Math.max(0, Math.min(activeIndex - 2, briefArticles.length - total));
              const dotIdx = offset + i;
              const isActive = dotIdx === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => setActiveIndex(dotIdx)}
                  className={`rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-5 h-2.5 bg-[#B3121B]'
                      : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to article ${dotIdx + 1}`}
                />
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={activeIndex >= briefArticles.length - 1 && !hasMore}
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md transition active:scale-90 border ${
              activeIndex >= briefArticles.length - 1 && !hasMore
                ? 'bg-neutral-200 text-neutral-400 border-neutral-200 opacity-40 cursor-not-allowed'
                : 'bg-[#B3121B] text-white border-[#B3121B] hover:bg-[#9a0f16] cursor-pointer'
            }`}
            aria-label="Next article"
          >
            <ChevronDown className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
