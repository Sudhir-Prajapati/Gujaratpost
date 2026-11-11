'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Share2, Flame, Sparkles, MapPin, Eye, Check } from 'lucide-react';
import type { Article } from '@/types';
import { useApp } from '@/components/AppProvider';
import { getLocalized, formatDate, formatViews } from '@/data';
import { toGu, sortArticlesByLatest } from '@/lib/utils';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';
import { getPublicArticles } from '@/lib/api';
import { CATEGORY_PAIRS } from '@/app/category/[slug]/CategoryPageClient';
import ApkAdBanner from './ApkAdBanner';
import MobileModernArticleCard from '@/components/ui/MobileModernArticleCard';
import { SocialIcon } from '@/components/ui/SocialLinks';

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

type CategoryTab = 'all' | 'paired' | 'latest' | 'trending';

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

  const normSlug = (slug || '').toLowerCase().trim();
  const pairedCategory = CATEGORY_PAIRS[normSlug];
  const [pairedArticles, setPairedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!pairedCategory?.slug) {
      setPairedArticles([]);
      return;
    }
    let isMounted = true;
    getPublicArticles({ categorySlug: pairedCategory.slug, page: 1, limit: 30 })
      .then((res) => {
        if (!isMounted) return;
        setPairedArticles(sortArticlesByLatest(res?.articles || []));
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [pairedCategory?.slug]);

  // Localized Category Title
  const categoryTitle = useMemo(() => {
    if (slug === 'gujarat' || slug === 'state') {
      return getLocalized(language, { gu: 'ગુજરાત', hi: 'गुजरात', en: 'Gujarat' });
    }
    if (slug === 'national' || slug === 'india') {
      return getLocalized(language, { gu: 'ભારત', hi: 'भारत', en: 'Bharat' });
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
    if (activeTab === 'paired') {
      return pairedArticles.length > 0 ? pairedArticles : articles;
    }
    if (activeTab === 'latest') {
      return sortArticlesByLatest(articles);
    }
    return sortArticlesByLatest(articles);
  }, [articles, trending, activeTab, pairedArticles]);

  const heroArticle = filteredArticles[0];
  const streamArticles = filteredArticles.slice(1, visibleCount);

  const tabs = useMemo(() => {
    const list: { id: CategoryTab; gu: string; hi: string; en: string }[] = [
      { id: 'all', gu: 'બધું', hi: 'सभी', en: 'All' },
    ];
    if (pairedCategory) {
      list.push({
        id: 'paired',
        gu: pairedCategory.gu,
        hi: pairedCategory.hi,
        en: pairedCategory.name,
      });
    } else {
      list.push({
        id: 'latest',
        gu: 'તાજા સમાચાર',
        hi: 'ताज़ा समाचार',
        en: 'Latest',
      });
    }
    list.push({ id: 'trending', gu: 'ટ્રેન્ડિંગ', hi: 'ट्रेंडिंग', en: 'Trending' });
    return list;
  }, [pairedCategory]);

  return (
    <div className="pb-10 max-w-md mx-auto w-full select-none">
      {/* ── 1. CATEGORY HEADER BANNER ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-400/80 dark:border-gray-800 px-3.5 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#B3121B] rounded-full inline-block" />
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
              {categoryTitle}
            </h1>
          </div>
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-400/60 dark:border-gray-700">
            {language === 'gu' ? toGu(filteredArticles.length) : filteredArticles.length} {getLocalized(language, { gu: 'સમાચાર', hi: 'समाचार', en: 'News' })}
          </span>
        </div>

        {/* ── 2. QUICK FILTER TABS (All / Latest / Trending) ──────────── */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', gu: 'બધું', hi: 'सभी', en: 'All' },
            { id: 'latest', gu: 'લેટેસ્ટ સમાચાર', hi: 'ताज़ा समाचार', en: 'Latest' },
            { id: 'trending', gu: 'ટ્રેન્ડિંગ', hi: 'ट्रेंडिंग', en: 'Trending' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as CategoryTab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 ${activeTab === tab.id
                ? 'bg-[#B3121B] text-white shadow-xs font-extrabold'
                : 'bg-gray-100 dark:bg-[#222228] text-gray-700 dark:text-gray-300 border border-gray-400 dark:border-gray-700 hover:bg-gray-200'
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
            className="group block bg-white dark:bg-[#18181b] rounded-2xl overflow-hidden border border-gray-400/90 dark:border-gray-800 shadow-xs hover:shadow-md transition active:scale-[0.99]"
          >
            {/* Hero Image */}
            <div className="relative aspect-[16/9] w-full bg-neutral-950 dark:bg-black overflow-hidden">
              <Image
                src={heroArticle.image || (heroArticle as any).featuredImage || '/logo.png'}
                alt={heroArticle.titleGu || heroArticle.title}
                fill
                priority
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                style={{ objectFit: 'contain', objectPosition: 'center' }}
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

              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-gray-400 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 font-semibold">
                <div className="flex items-center gap-2">
                  {heroArticle.views ? (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Eye className="w-3 h-3" />
                      {language === 'gu' ? toGu(formatViews(heroArticle.views)) : formatViews(heroArticle.views)}
                    </span>
                  ) : <span />}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleShare(e, heroArticle)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[12px] font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs cursor-pointer select-none"
                  aria-label="Share article"
                >
                  <SocialIcon platform="whatsapp" className="w-3.5 h-3.5 fill-current" />
                  <span>{language === 'gu' ? 'શેર' : language === 'hi' ? 'શેર' : 'Share'}</span>
                </button>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── 3.5. APK CATEGORY AD BANNER (SLOT 1) ─────────────────────── */}
      <ApkAdBanner slotIndex={0} className="px-3 my-2" />

      {/* ── 4. VERTICAL STREAM OF NEWS CARDS ───────────────────────────── */}
      <div className="px-3 space-y-3">
        {streamArticles.map((art, idx) => (
          <Fragment key={`apk-cat-wrap-${art.id || art.slug || idx}`}>
            <MobileModernArticleCard
              key={`apk-cat-${art.id || art.slug}`}
              article={art}
              language={language}
              index={idx}
              catSlug={slug}
              catLabel={categoryTitle}
            />
          </Fragment>
        ))}
      </div>

      {/* ── 5. LOAD MORE BUTTON ───────────────────────────────────────── */}
      {visibleCount < filteredArticles.length && (
        <div className="mt-5 px-3 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 15)}
            className="w-full max-w-xs py-2.5 px-4 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-[#202128] border border-gray-400 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-black rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-center"
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
