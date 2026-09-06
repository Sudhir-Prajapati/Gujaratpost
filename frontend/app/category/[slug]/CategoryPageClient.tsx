'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Clock, Play, Video as VideoIcon } from 'lucide-react';
import { Article } from '@/types';
import { useApp } from '@/components/AppProvider';
import {
  getLocalized,
  getArticleTitle,
  getCategoryLabel,
  formatViews,
  formatDate,
} from '@/data';
import { getCategoryColor, toGu } from '@/lib/utils';
import { getPublicVideos } from '@/lib/api';
import { safeYouTubeId, youtubeEmbedUrl } from '@/lib/youtube';
import NewsCard from '@/components/ui/NewsCard';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoArticleExcerpt } from '@/components/ui/AutoTranslatedArticleText';

/* ── Types ────────────────────────────────────────────────── */
interface Props {
  articles: Article[];
  category: { name: string; nameGu: string; nameHi: string };
  trending: Article[];
  currentPage: number;
  totalPages: number;
  slug: string;
}

type FilterTab = 'all' | 'latest' | 'video';

const GUJARAT_MOCK_TAGS = {
  gu: ['ચૂંટણી 2027', 'વરસાદ', 'સોના-ચાંદી', 'ક્રિકેટ', 'મેટ્રો', 'સેમિકન્ડક્ટર', 'ડાયમંડ ઉદ્યોગ', 'ટ્રાફિક'],
  hi: ['चुनाव 2027', 'बारिश', 'सोना-चांदी', 'क्रिकेट', 'मेट्रो', 'सेमीकंडक्टर', 'डायमंड उद्योग', 'ट्रैफिक'],
  en: ['Election 2027', 'Rain', 'Gold-Silver', 'Cricket', 'Metro', 'Semiconductor', 'Diamond Industry', 'Traffic']
};

/* ══════════════════════════════════════════════════════════════
   CATEGORY PAGE CLIENT
   ══════════════════════════════════════════════════════════════ */
export default function CategoryPageClient({ articles, category, slug }: Props) {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [visibleCount, setVisibleCount] = useState(9);

  // Videos state for Video filter
  const [videos, setVideos] = useState<any[]>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Scroll page to top instantly whenever category page mounts or slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  // Fetch public videos stream for Video tab
  useEffect(() => {
    getPublicVideos('video')
      .then((res) => {
        if (res && Array.isArray(res)) {
          setVideos(res);
        }
      })
      .catch(() => { });
  }, []);

  // Get localized category name aligned exactly with header menu links
  const getCategoryTitleLocalized = () => {
    if (slug === 'other-cities' || slug === 'otherCities') {
      return getLocalized(language, { en: 'Other Cities', gu: 'અન્ય શહેરો', hi: 'अन्य शहर' });
    }
    if (slug === 'gujarat' || slug === 'state') {
      return getLocalized(language, { en: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' });
    }
    if (slug === 'national') {
      return getLocalized(language, { en: 'National', gu: 'દેશ', hi: 'देश' });
    }
    if (slug === 'crime') {
      return getLocalized(language, { en: 'Crime', gu: 'ક્રાઈમ', hi: 'क्राइम' });
    }
    if (slug === 'technology') {
      return getLocalized(language, { en: 'Technology', gu: 'ટેક્નોલોજી', hi: 'ટેક્નોલોજી' });
    }
    if (slug === 'lifestyle') {
      return getLocalized(language, { en: 'Lifestyle', gu: 'લાઈફસ્ટાઈલ', hi: 'લાઈફસ્ટાઈલ' });
    }
    return getLocalized(language, {
      en: category?.name || '',
      gu: category?.nameGu || '',
      hi: category?.nameHi || '',
    });
  };

  const categoryName = getCategoryTitleLocalized();

  /* Get localized location */
  const getArticleLocation = (art: Article) => {
    if (language === 'gu') {
      return (art as any).categoryGu || art.tagsGu?.[0] || getCategoryLabel(art, language);
    }
    if (language === 'hi') {
      return (art as any).categoryHi || art.tagsHi?.[0] || getCategoryLabel(art, language);
    }
    return art.category || art.tags?.[0] || getCategoryLabel(art, language);
  };

  /* Get localized relative time / fallback to date */
  const getArticleTime = (art: Article) => {
    if (language === 'gu') return (art as any).relativeTimeGu || formatDate(art.publishedAt);
    if (language === 'hi') return (art as any).relativeTimeHi || formatDate(art.publishedAt);
    return art.relativeTime || formatDate(art.publishedAt);
  };

  /* Get localized views */
  const getArticleViews = (art: Article) => {
    if (language === 'gu') return (art as any).viewsGu || toGu(formatViews(art.views));
    if (language === 'hi') return (art as any).viewsHi || formatViews(art.views);
    return (art as any).views || formatViews(art.views);
  };

  /* Most-read = Top 6 articles published/updated within current running month (last 30 days) sorted by views */
  const mostReadToDisplay = useMemo(() => {
    const all = articles || [];
    if (all.length === 0) return [];

    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const currentMonthArticles = all.filter((art) => {
      const artTime = new Date((art as any).updatedAt || art.publishedAt || (art as any).createdAt || 0).getTime();
      return !isNaN(artTime) && artTime > 0 && (now - artTime) <= THIRTY_DAYS_MS;
    });

    const pool = currentMonthArticles.length > 0 ? currentMonthArticles : all;
    return [...pool].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 7);
  }, [articles]);

  const getArticleTimeMs = (art: Article) => {
    const updatedVal = (art as any).updatedAt;
    const publishedVal = art.publishedAt || (art as any).createdAt;
    const updatedMs = updatedVal ? new Date(updatedVal).getTime() : 0;
    const publishedMs = publishedVal ? new Date(publishedVal).getTime() : 0;
    const t = !isNaN(updatedMs) && updatedMs > 0 ? updatedMs : publishedMs;
    return isNaN(t) ? 0 : t;
  };

  /* Filter & Sort logic based on activeTab specifically for Section (Hero + Sub-Hero + Top Stories) */

  // 1. Articles with Video OR YouTube videos whose title/description explicitly contains the category name (e.g. Surat / સુરત)
  const categoryVideoItems = useMemo(() => {
    const catNameLower = (category?.name || '').toLowerCase().trim();
    const catGuLower = (category?.nameGu || '').toLowerCase().trim();
    const slugLower = (slug || '').toLowerCase().trim();

    // Articles in this category with video
    const videoArticles = (articles || [])
      .filter((a: any) => a.videoUrl || a.youtubeUrl || a.mediaType === 'video' || a.isVideo)
      .map((a: any) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        titleGu: a.titleGu,
        titleHi: a.titleHi,
        image: a.image || a.featuredImage,
        category: a.category,
        categoryGu: a.categoryGu,
        categoryHi: a.categoryHi,
        publishedAt: a.publishedAt,
        relativeTimeGu: a.relativeTimeGu,
        relativeTime: a.relativeTime,
        videoUrl: a.videoUrl || a.youtubeUrl,
        videoId: safeYouTubeId(a.videoUrl || a.youtubeUrl),
        isVideoItem: true,
        isArticle: true,
      }));

    // YouTube videos ONLY if title/description contains category title/slug (e.g. Surat / સુરત)
    const categoryMatchingYouTubeVideos = (videos || [])
      .filter((v: any) => {
        if (!v) return false;
        const textToSearch = `${v.title || ''} ${v.titleGu || ''} ${v.description || ''} ${v.category || ''}`.toLowerCase();
        return (
          (catNameLower && textToSearch.includes(catNameLower)) ||
          (catGuLower && textToSearch.includes(catGuLower)) ||
          (slugLower && textToSearch.includes(slugLower))
        );
      })
      .map((v: any) => ({
        id: v.id || v.videoId,
        slug: v.slug || `video-${v.id}`,
        title: v.title || v.titleGu,
        titleGu: v.titleGu || v.title,
        titleHi: v.titleHi || v.title,
        image: v.thumbnail || v.image,
        category: v.category || categoryName,
        categoryGu: v.categoryGu || categoryName,
        categoryHi: v.categoryHi || categoryName,
        publishedAt: v.publishedAt || new Date().toISOString(),
        relativeTimeGu: v.relativeTimeGu || 'હમણાં જ',
        relativeTime: v.relativeTime || 'Just now',
        videoUrl: v.youtubeUrl || (v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : ''),
        videoId: v.videoId || safeYouTubeId(v.youtubeUrl),
        isVideoItem: true,
        isYouTube: true,
      }));

    const combined: any[] = [...videoArticles, ...categoryMatchingYouTubeVideos];

    // If fewer than 6 video items exist, fill remaining slots with standard category news articles
    // so Top Stories and Sub-Hero slots are always 100% full with no empty space
    const usedIds = new Set(combined.map((item) => item.id).filter(Boolean));
    const fillArticles = (articles || []).filter((art) => !usedIds.has(art.id));

    return [...combined, ...fillArticles];
  }, [articles, videos, category, slug, categoryName]);

  // Items for "બધું" (All) tab: Mix of standard news articles, video articles, and 1-2 YouTube videos
  const allSectionItems = useMemo(() => {
    const catNameLower = (category?.name || '').toLowerCase().trim();
    const catGuLower = (category?.nameGu || '').toLowerCase().trim();
    const slugLower = (slug || '').toLowerCase().trim();

    // Matching YouTube videos for this category (up to 2)
    const matchingYouTubeVideos = (videos || [])
      .filter((v: any) => {
        if (!v) return false;
        const textToSearch = `${v.title || ''} ${v.titleGu || ''} ${v.description || ''} ${v.category || ''}`.toLowerCase();
        return (
          (catNameLower && textToSearch.includes(catNameLower)) ||
          (catGuLower && textToSearch.includes(catGuLower)) ||
          (slugLower && textToSearch.includes(slugLower))
        );
      })
      .map((v: any) => ({
        id: v.id || v.videoId,
        slug: v.slug || `video-${v.id}`,
        title: v.title || v.titleGu,
        titleGu: v.titleGu || v.title,
        titleHi: v.titleHi || v.title,
        image: v.thumbnail || v.image,
        category: v.category || categoryName,
        categoryGu: v.categoryGu || categoryName,
        categoryHi: v.categoryHi || categoryName,
        publishedAt: v.publishedAt || new Date().toISOString(),
        relativeTimeGu: v.relativeTimeGu || 'હમણાં જ',
        relativeTime: v.relativeTime || 'Just now',
        videoUrl: v.youtubeUrl || (v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : ''),
        videoId: v.videoId || safeYouTubeId(v.youtubeUrl),
        isVideoItem: true,
        isYouTube: true,
      }));

    const selectedVideos = matchingYouTubeVideos.length > 0
      ? matchingYouTubeVideos.slice(0, 2)
      : (videos || []).slice(0, 2).map((v: any) => ({
          id: v.id || v.videoId,
          slug: v.slug || `video-${v.id}`,
          title: v.title || v.titleGu,
          titleGu: v.titleGu || v.title,
          titleHi: v.titleHi || v.title,
          image: v.thumbnail || v.image,
          category: v.category || categoryName,
          categoryGu: v.categoryGu || categoryName,
          categoryHi: v.categoryHi || categoryName,
          publishedAt: v.publishedAt || new Date().toISOString(),
          relativeTimeGu: v.relativeTimeGu || 'હમણાં જ',
          relativeTime: v.relativeTime || 'Just now',
          videoUrl: v.youtubeUrl || (v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : ''),
          videoId: v.videoId || safeYouTubeId(v.youtubeUrl),
          isVideoItem: true,
          isYouTube: true,
        }));

    const result: any[] = [];
    const usedIds = new Set();

    // 1. Top category news article
    const firstArticle = (articles || [])[0];
    if (firstArticle) {
      result.push(firstArticle);
      usedIds.add(firstArticle.id);
    }

    // 2. Interleave 1-2 YouTube videos and video articles
    selectedVideos.forEach((v) => {
      if (!usedIds.has(v.id)) {
        result.push(v);
        usedIds.add(v.id);
      }
    });

    // 3. Articles in this category with video
    (articles || []).forEach((a: any) => {
      if ((a.videoUrl || a.youtubeUrl || a.mediaType === 'video' || a.isVideo) && !usedIds.has(a.id)) {
        result.push({
          ...a,
          videoId: safeYouTubeId(a.videoUrl || a.youtubeUrl),
          isVideoItem: true,
        });
        usedIds.add(a.id);
      }
    });

    // 4. Fill remaining slots with standard category articles
    (articles || []).forEach((a: any) => {
      if (!usedIds.has(a.id)) {
        result.push(a);
        usedIds.add(a.id);
      }
    });

    return result;
  }, [articles, videos, category, slug, categoryName]);

  // Dynamic Section Items (Hero + Sub-Hero + Top Stories) driven by activeTab
  const currentSectionItems = useMemo(() => {
    if (activeTab === 'latest') {
      // Strictly latest uploaded articles sorted by time descending
      return [...(articles || [])].sort((a, b) => getArticleTimeMs(b) - getArticleTimeMs(a));
    }

    if (activeTab === 'video') {
      return categoryVideoItems;
    }

    // Default 'all' (બધું): Mixed feed of standard news articles, 1-2 YouTube videos, and video articles
    return allSectionItems;
  }, [activeTab, articles, categoryVideoItems, allSectionItems]);

  // Section Hero Article / Item
  const heroArticle = currentSectionItems[0] || articles[0];

  // Section Sub-Hero Small Article
  const subHeroArticle = currentSectionItems[1];

  // Section 4 Top Stories (Items 3 to 6)
  const topStories = useMemo(() => {
    const sliced = currentSectionItems.slice(2, 6);
    if (sliced.length >= 4) return sliced;

    const usedIds = new Set([heroArticle?.id, subHeroArticle?.id, ...sliced.map((a: any) => a.id)].filter(Boolean));
    const pool = currentSectionItems.length > 2 ? currentSectionItems : sliced;
    const fallbacks = pool.filter((a: any) => !usedIds.has(a.id));
    return [...sliced, ...fallbacks].slice(0, 4);
  }, [currentSectionItems, heroArticle, subHeroArticle]);

  const topStoriesIds = useMemo(() => new Set([heroArticle?.id, subHeroArticle?.id, ...topStories.map((a: any) => a.id)].filter(Boolean)), [heroArticle, subHeroArticle, topStories]);

  // Remaining articles for Popular News grid (steady view)
  const popularArticles = useMemo(() => {
    return (articles || []).filter((art) => !topStoriesIds.has(art.id));
  }, [articles, topStoriesIds]);

  /* 3 Filter tabs */
  const tabs: { id: FilterTab; gu: string; hi: string; en: string }[] = [
    { id: 'all', gu: 'બધું', hi: 'सभी', en: 'All' },
    { id: 'latest', gu: 'તાજા સમાચાર', hi: 'તાઝા સમાચાર', en: 'Latest' },
    { id: 'video', gu: 'વીડિયો', hi: 'वीडियो', en: 'Video' },
  ];

  if (!heroArticle && videos.length === 0) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 text-center text-muted-foreground">
        {getLocalized(language, { en: 'No stories found.', gu: 'કોઈ સમાચાર મળ્યા નહીં.', hi: 'कोई खबर नहीं मिली.' })}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-screen-xl px-4 py-6">

        {/* ── TOP ROW: Category name ─────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-7 bg-accent rounded-sm inline-block" />
            <h1 className="text-2xl font-black text-foreground">{categoryName}</h1>
          </div>
        </div>

        {/* ── FILTER TABS (3 Options: Badhu, Taja Samachar, Video) ────── */}
        <div className="flex gap-2 flex-wrap mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPlayingVideoId(null);
              }}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-black transition cursor-pointer ${activeTab === tab.id
                  ? 'bg-accent text-white font-black shadow-sm'
                  : 'border border-border bg-card text-foreground hover:border-accent hover:text-accent font-semibold'
                }`}
            >
              {getLocalized(language, { en: tab.en, gu: tab.gu, hi: tab.hi })}
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT + SIDEBAR ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── LEFT: Hero + Top Stories (Controlled by activeTab) ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-8 min-w-0">
            {/* Left Column: Hero Article + Sub Hero Small Article */}
            <div className="flex flex-col">
              {/* Main Big Hero Article / Video Card */}
              {heroArticle && (
                <div>
                  {heroArticle.videoId ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-black shadow-sm mb-3">
                      {playingVideoId === (heroArticle.id || heroArticle.videoId) ? (
                        <iframe
                          src={youtubeEmbedUrl(heroArticle.videoId, 'autoplay=1')}
                          title={getArticleTitle(heroArticle, language)}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div
                          onClick={() => setPlayingVideoId(heroArticle.id || heroArticle.videoId)}
                          className="relative w-full h-full cursor-pointer group"
                        >
                          <ArticleMedia
                            src={heroArticle.image || (heroArticle as any).thumbnail || `https://img.youtube.com/vi/${heroArticle.videoId}/hqdefault.jpg`}
                            alt={getArticleTitle(heroArticle, language)}
                            className="transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition">
                            <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                              <Play className="w-7 h-7 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                            <VideoIcon className="w-3 h-3 text-red-500" /> VIDEO
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href={heroArticle.slug ? `/news/${heroArticle.slug}` : '#'} className="group block">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-muted shadow-sm">
                        <ArticleMedia
                          src={heroArticle.image || (heroArticle as any).featuredImage}
                          alt={getArticleTitle(heroArticle, language)}
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                        {heroArticle.videoId && (
                          <span className="absolute top-2.5 right-2.5 bg-black/80 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                            <VideoIcon className="w-3 h-3 text-red-500" /> VIDEO
                          </span>
                        )}
                      </div>
                    </Link>
                  )}

                  <div className="mt-3">
                    <span className="text-xs font-black uppercase tracking-wide text-accent">
                      {getArticleLocation(heroArticle)}
                    </span>
                    <h2 className="mt-1 text-xl md:text-[22px] font-black leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-1">
                      <AutoArticleTitle article={heroArticle} language={language} />
                    </h2>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground/70" />{getArticleTime(heroArticle)}</span>
                      <span>·</span>
                      <span>{formatDate(heroArticle.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Small Article below Hero Article */}
              {subHeroArticle && (
                <div className="mt-4 pt-3.5 border-t border-border">
                  <Link href={subHeroArticle.slug ? `/news/${subHeroArticle.slug}` : '#'} className="group flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wide text-accent">
                        {getArticleLocation(subHeroArticle)}
                      </span>
                      <h3 className="mt-0.5 text-[13.5px] md:text-[14px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">
                        <AutoArticleTitle article={subHeroArticle} language={language} />
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                        <span>{getArticleTime(subHeroArticle)}</span>
                        <span>·</span>
                        <span>{formatDate(subHeroArticle.publishedAt)}</span>
                      </div>
                    </div>
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-muted shadow-sm">
                      <ArticleMedia
                        src={subHeroArticle.image || (subHeroArticle as any).featuredImage || (subHeroArticle as any).thumbnail}
                        alt={getArticleTitle(subHeroArticle, language)}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Top Stories column */}
            <div>
              <div className="flex items-center gap-2.5 mb-3 pb-2 border-b-2 border-accent/25">
                <span className="w-1 h-4 bg-accent inline-block shrink-0 rounded-sm" />
                <span className="text-sm font-black text-foreground">
                  {getLocalized(language, { en: 'Top Stories', gu: 'ટોપ સ્ટોરીઝ', hi: 'टॉप स्टोरीज' })}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {topStories.map((art: any) => (
                  <Link key={art.id} href={art.slug ? `/news/${art.slug}` : '#'} className="group flex items-start gap-4 py-3 first:pt-1 last:pb-1">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wide text-accent">
                        {getArticleLocation(art)}
                      </span>
                      <h3 className="mt-0.5 text-[13.5px] md:text-[14.5px] font-bold leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-3">
                        {getArticleTitle(art, language)}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                        <span>{getArticleTime(art)}</span>
                        <span>·</span>
                        <span>{formatDate(art.publishedAt)}</span>
                      </div>
                    </div>
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-muted shadow-sm">
                      <ArticleMedia
                        src={art.image || art.featuredImage || art.thumbnail}
                        alt={getArticleTitle(art, language)}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Most Read */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-border">
              <span className="w-2 h-2 bg-accent rotate-45 shrink-0 inline-block" />
              <span className="text-sm font-black text-foreground">
                {getLocalized(language, { en: 'Most Read', gu: 'સૌથી વધુ વંચાયેલા', hi: 'सबसे ज़्यादा पढ़े गए' })}
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {mostReadToDisplay.map((art: any, i: number) => (
                <Link key={art.id} href={`/news/${art.slug}`} className="group flex items-start gap-3 py-3 first:pt-1.5 last:pb-1.5">
                  <span
                    className="text-[28px] font-extrabold leading-none select-none w-8 shrink-0 text-center"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: 'transparent',
                      WebkitTextStroke: '1.5px var(--ink-3)',
                    }}
                  >
                    {language === 'gu' ? toGu(i + 1) : i + 1}
                  </span>
                  <p className="text-[13px] md:text-[13.5px] font-bold leading-snug text-foreground/90 group-hover:text-accent transition-colors line-clamp-3">
                    {language === 'gu' ? art.titleGu : language === 'hi' ? art.titleHi : art.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* POPULAR ARTICLES GRID */}
        <div className="mt-10">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border">
            <span className="w-2 h-2 bg-accent rotate-45 shrink-0 inline-block" />
            <span className="text-base font-black text-foreground">
              {getLocalized(language, { en: 'Popular News', gu: 'લોકપ્રિય સમાચાર', hi: 'लोकप्रिय समाचार' })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
            {popularArticles.slice(0, visibleCount).map((article) => (
              <NewsCard key={article.id} article={article} variant="flat" />
            ))}
          </div>

          {/* Load More */}
          {visibleCount < popularArticles.length && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount((v) => v + 9)}
                className="rounded border border-accent px-10 py-3 text-sm font-black text-accent hover:bg-accent hover:text-white transition cursor-pointer"
              >
                {getLocalized(language, { en: 'Load More', gu: 'વધુ લોડ કરો', hi: 'और लोड करें' })}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
