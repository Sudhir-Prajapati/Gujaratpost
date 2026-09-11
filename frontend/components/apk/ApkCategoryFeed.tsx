'use client';

import { useState, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Share2, Clock, Flame, Sparkles, MapPin, Eye, Check } from 'lucide-react';
import type { Article } from '@/types';
import { useApp } from '@/components/AppProvider';
import { getLocalized, formatDate, formatViews } from '@/data';
import { toGu } from '@/lib/utils';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';
import ApkAdBanner from './ApkAdBanner';

interface ApkCategoryFeedProps {
  articles: Article[];
  category: {
    name: string;
    nameGu: string;
    nameHi: string;
    description?: string;
    icon?: string;
    color?: string;
  };
  trending?: Article[];
  slug: string;
}

type CategoryTab = 'all' | 'latest' | 'trending';

export default function ApkCategoryFeed({
  articles = [],
  category,
  trending = [],
  slug,
}: ApkCategoryFeedProps) {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [visibleCount, setVisibleCount] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Localized Category Title
  const categoryTitle = useMemo(() => {
    if (slug === 'gujarat' || slug === 'state') {
      return getLocalized(language, { gu: 'ગુજરાત', hi: 'गुजरात', en: 'Gujarat' });
    }
    if (slug === 'national' || slug === 'india') {
      return getLocalized(language, { gu: 'દેશ - ભારત', hi: 'देश', en: 'India' });
    }
    if (slug === 'world') {
      return getLocalized(language, { gu: 'વિદેશ સમાચાર', hi: 'विदेश', en: 'World' });
    }
    if (slug === 'politics') {
      return getLocalized(language, { gu: 'રાજકારણ', hi: 'राजनीति', en: 'Politics' });
    }
    if (slug === 'crime') {
      return getLocalized(language, { gu: 'ક્રાઇમ ડાયરી', hi: 'क्राइम', en: 'Crime' });
    }
    if (slug === 'business') {
      return getLocalized(language, { gu: 'વેપાર & બજાર', hi: 'व्यापार', en: 'Business' });
    }
    if (slug === 'sports') {
      return getLocalized(language, { gu: 'રમત-જગત', hi: 'खेल', en: 'Sports' });
    }
    if (slug === 'entertainment') {
      return getLocalized(language, { gu: 'મનોરંજન', hi: 'मनोरंजन', en: 'Entertainment' });
    }
    if (slug === 'technology') {
      return getLocalized(language, { gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी', en: 'Technology' });
    }
    return getLocalized(language, {
      gu: category?.nameGu || category?.name || slug,
      hi: category?.nameHi || category?.name || slug,
      en: category?.name || slug,
    });
  }, [language, category, slug]);

  // Share handler
  const handleShare = async (e: React.MouseEvent, art: Article) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/news/${art.slug || art.id}` : '';
    const title = language === 'gu' ? art.titleGu || art.title : language === 'hi' ? art.titleHi || art.title : art.title;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedId(art.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filtered articles based on activeTab
  const filteredArticles = useMemo(() => {
    if (activeTab === 'trending') {
      if (trending && trending.length > 0) return trending;
      return [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    if (activeTab === 'latest') {
      return [...articles].sort((a, b) => {
        const aT = new Date((a as any).updatedAt || a.publishedAt || 0).getTime();
        const bT = new Date((b as any).updatedAt || b.publishedAt || 0).getTime();
        return bT - aT;
      });
    }
    return articles;
  }, [articles, trending, activeTab]);

  const heroArticle = filteredArticles[0];
  const streamArticles = filteredArticles.slice(1, visibleCount);

  // Time format helper
  const getRelativeTime = (art: Article) => {
    if (language === 'gu') return (art as any).relativeTimeGu || formatDate(art.publishedAt);
    if (language === 'hi') return (art as any).relativeTimeHi || formatDate(art.publishedAt);
    return art.relativeTime || formatDate(art.publishedAt);
  };

  return (
    <div className="pb-10 max-w-md mx-auto w-full select-none">
      {/* ── 1. CATEGORY HEADER BANNER ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-200/80 dark:border-gray-800 px-3.5 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#B3121B] rounded-full inline-block" />
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
              {categoryTitle}
            </h1>
          </div>
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-gray-700">
            {language === 'gu' ? toGu(filteredArticles.length) : filteredArticles.length} {getLocalized(language, { gu: 'સમાચાર', hi: 'समाचार', en: 'News' })}
          </span>
        </div>

        {/* ── 2. QUICK FILTER TABS (All / Latest / Trending) ──────────── */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', gu: 'બધું', hi: 'सभी', en: 'All' },
            { id: 'latest', gu: 'તાજા સમાચાર', hi: 'ताज़ा समाचार', en: 'Latest' },
            { id: 'trending', gu: 'ટ્રેન્ડિંગ', hi: 'ट्रेंडिंग', en: 'Trending' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as CategoryTab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-[#B3121B] text-white shadow-xs font-extrabold'
                  : 'bg-gray-100 dark:bg-[#222228] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200'
              }`}
            >
              {getLocalized(language, { gu: tab.gu, hi: tab.hi, en: tab.en })}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. HERO ARTICLE (FEATURED TOP STORY) ───────────────────────── */}
      {heroArticle && (
        <div className="p-3">
          <Link
            href={`/news/${heroArticle.slug || heroArticle.id}`}
            prefetch={true}
            className="group block bg-white dark:bg-[#18181b] rounded-2xl overflow-hidden border border-gray-200/90 dark:border-gray-800 shadow-xs hover:shadow-md transition active:scale-[0.99]"
          >
            {/* Hero Image */}
            <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <Image
                src={heroArticle.image || (heroArticle as any).featuredImage || '/logo.png'}
                alt={heroArticle.titleGu || heroArticle.title}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 450px"
              />
              <span className="absolute top-2.5 left-2.5 bg-[#B3121B] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wide">
                {categoryTitle}
              </span>
            </div>

            {/* Hero Details */}
            <div className="p-3.5">
              <h2 className="text-[15px] font-black leading-snug text-gray-900 dark:text-gray-100 group-hover:text-[#B3121B] transition-colors line-clamp-3">
                <AutoArticleTitle article={heroArticle} language={language} />
              </h2>

              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {getRelativeTime(heroArticle)}
                  </span>
                  {heroArticle.views ? (
                    <span className="flex items-center gap-1 text-gray-400">
                      <span>·</span>
                      <Eye className="w-3 h-3" />
                      {language === 'gu' ? toGu(formatViews(heroArticle.views)) : formatViews(heroArticle.views)}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleShare(e, heroArticle)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 flex items-center justify-center text-gray-600 dark:text-gray-300 transition active:scale-90"
                  aria-label="Share article"
                >
                  {copiedId === heroArticle.id ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── 3.5. APK CATEGORY AD BANNER (SLOT 1) ─────────────────────── */}
      <ApkAdBanner slotIndex={0} className="px-3 my-2" />

      {/* ── 4. VERTICAL STREAM OF NEWS CARDS ───────────────────────────── */}
      <div className="px-3 space-y-2.5">
        {streamArticles.map((art, idx) => (
          <Fragment key={`apk-cat-wrap-${art.id || art.slug || idx}`}>
            <Link
              key={`apk-cat-${art.id || art.slug}`}
              href={`/news/${art.slug || art.id}`}
              prefetch={true}
              className="group flex gap-3 p-3 bg-white dark:bg-[#18181b] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:shadow-xs transition active:scale-[0.99] items-start"
            >
              {/* Left: Text Information */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <div>
                  <span className="text-[10px] font-black text-[#B3121B] uppercase tracking-wide">
                    {categoryTitle}
                  </span>
                  <h3 className="mt-0.5 text-[13.5px] font-extrabold leading-snug text-gray-900 dark:text-gray-100 group-hover:text-[#B3121B] transition-colors line-clamp-2">
                    <AutoArticleTitle article={art} language={language} />
                  </h3>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {getRelativeTime(art)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleShare(e, art)}
                    className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 flex items-center justify-center text-gray-500 dark:text-gray-400 transition active:scale-90"
                    aria-label="Share article"
                  >
                    {copiedId === art.id ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Crisp Rounded Thumbnail */}
              <div className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-2xs">
                <Image
                  src={art.image || (art as any).featuredImage || '/logo.png'}
                  alt={art.titleGu || art.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="96px"
                />
              </div>
            </Link>
          </Fragment>
        ))}
      </div>

      {/* ── 5. LOAD MORE BUTTON ───────────────────────────────────────── */}
      {visibleCount < filteredArticles.length && (
        <div className="mt-5 px-3 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 15)}
            className="w-full max-w-xs py-2.5 px-4 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-[#202128] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-black rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-center"
          >
            {getLocalized(language, {
              gu: 'વધુ સમાચાર લોડ કરો',
              hi: 'और समाचार लोड करें',
              en: 'Load More Stories',
            })}
          </button>
        </div>
      )}
    </div>
  );
}
