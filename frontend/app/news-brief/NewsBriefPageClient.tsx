'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Search, ArrowUp, ArrowDown, Share2, ArrowLeft } from 'lucide-react';
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

  // Lock body scroll so browser scrollbars never appear on this page
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

  // Keyboard navigation support (Arrow Up / Arrow Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, briefArticles.length]);

  const currentArticle = briefArticles[activeIndex];

  const handleNext = () => {
    if (briefArticles.length === 0) return;
    if (activeIndex < briefArticles.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (briefArticles.length === 0 || activeIndex === 0) return; // Do nothing if on 1st article
    setActiveIndex((prev) => Math.max(0, prev - 1));
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

  if (!currentArticle) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FA] overflow-hidden">
        <p className="text-neutral-500 font-semibold">Loading news briefs...</p>
      </div>
    );
  }

  const rawTitle = getArticleTitle(currentArticle, language);
  const category = getCategoryLabel(currentArticle, language);
  const rawExcerpt = getArticleExcerpt(currentArticle, language);
  const rawContent = getArticleContent(currentArticle, language);

  const cleanedExcerpt = cleanBriefText(rawExcerpt);
  const cleanedContent = cleanBriefText(rawContent);

  // Use full content if longer to fill the available space nicely
  const rawDisplayParagraph = (cleanedContent.length > cleanedExcerpt.length && cleanedContent.length > 50)
    ? cleanedContent
    : (cleanedExcerpt.length > 20 ? cleanedExcerpt : cleanedContent);

  const title = useAutoTranslate(rawTitle, language);
  const displayParagraph = useAutoTranslate(rawDisplayParagraph, language);

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#F8F9FA] flex flex-col font-sans select-none overflow-hidden">
      {/* Custom Clean Header */}
      <header className="bg-white border-b border-neutral-200/80 py-2.5 px-6 flex items-center justify-between w-full shadow-sm shrink-0 h-14">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <div className="relative h-8 w-30 md:h-9 md:w-34">
            <Image
              src="/logo.jpg"
              alt="Gujarat Post"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative h-6 w-[110px] md:h-7 md:w-[130px]">
            <Image
              src="/rightSide.png"
              alt="NEWS BRIEF"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </header>

      {/* Main Swiper Section */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 overflow-hidden relative min-h-0">
        <div className="relative flex items-center justify-center gap-4 sm:gap-6 w-full max-w-[540px] h-full max-h-[620px] shrink-0">
          {/* Central News Card (Fixed dimensions) */}
          <div className="w-full max-w-[390px] sm:max-w-[410px] h-full max-h-[580px] sm:max-h-[600px] bg-white border border-neutral-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col p-4 sm:p-5 text-left transition-all duration-300 shrink-0">
            {/* Image with Counter Badge */}
            <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl mb-3 bg-neutral-100 border border-neutral-100 dark:border-neutral-800">
              <Image
                src={currentArticle.image}
                alt={title}
                fill
                sizes="410px"
                className="object-cover transition-all duration-700"
                priority
              />
              <div className="absolute top-2.5 right-2.5 bg-black/75 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border border-white/20">
                {activeIndex + 1} / {briefArticles.length}
              </div>
            </div>

            {/* Meta Row */}
            <div className="text-xs flex items-center gap-2 mb-2 select-none shrink-0">
              <span className="font-extrabold text-red-600 tracking-wider uppercase">
                {category}
              </span>
              <span className="text-neutral-300 font-bold">|</span>
              <span className="text-neutral-400 font-bold">
                {language === 'gu' ? 'તાજા સમાચાર' : language === 'hi' ? 'તાજા સમાચાર' : 'Latest News'}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-black text-neutral-900 leading-snug mb-2 text-left w-full text-[15.5px] sm:text-[17px] line-clamp-2 shrink-0">
              {title}
            </h2>

            {/* Brief content description */}
            <div className="flex-1 min-h-0 overflow-hidden mb-2">
              <p className="text-xs sm:text-[13.5px] text-neutral-600 leading-relaxed text-justify w-full line-clamp-7 sm:line-clamp-8">
                {displayParagraph}
              </p>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between w-full border-t border-neutral-100 pt-3 shrink-0 select-none">
              <Link
                href={`/news/${currentArticle.slug}`}
                className="border-2 border-red-600 hover:bg-red-600 hover:border-red-600 text-red-600 hover:text-white font-black text-xs px-4 py-2 rounded-full transition-all duration-200 active:scale-95"
              >
                {language === 'gu' ? 'વધુ વાંચો' : language === 'hi' ? 'और पढ़ें' : 'Read More'}
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className="relative bg-neutral-800 hover:bg-neutral-900 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                aria-label="Share Brief"
              >
                <Share2 className="h-4 w-4 stroke-[2.5]" />
                {copied && (
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[11px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </button>
            </div>

            {/* Center chevron icon */}
            <div className="flex justify-center mt-1 text-neutral-300 shrink-0">
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </div>
          </div>

          {/* Scroll Buttons Next to Card (Right side) */}
          <div className="flex flex-col gap-3 select-none shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className={`font-bold rounded-full h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all border ${
                activeIndex === 0
                  ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed opacity-40'
                  : 'bg-black hover:bg-neutral-900 text-white border-neutral-200/40 hover:scale-105 active:scale-95 cursor-pointer'
              }`}
              aria-label="Previous Brief"
            >
              <ArrowUp className="h-5 w-5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex >= briefArticles.length - 1 && !hasMore}
              className={`font-bold rounded-full h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all ${
                activeIndex >= briefArticles.length - 1 && !hasMore
                  ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed opacity-40'
                  : 'bg-black hover:bg-neutral-900 text-white hover:scale-105 active:scale-95 cursor-pointer'
              }`}
              aria-label="Next Brief"
            >
              <ArrowDown className="h-5 w-5 stroke-[3]" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
