'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Flame, Eye, Play, ChevronRight, ChevronLeft, Camera, X } from 'lucide-react';
import {
  getArticleTitle,
  getArticleExcerpt,
  formatTime,
  formatDate,
  formatViews,
  getCategoryLabel,
  VIDEOS,
  getLocalized,
  ARTICLES,
  getArticlesByCategory,
} from '@/data';
import { getCategoryColor } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import type { Article, Language } from '@/types';
import YouTubeLatest from '@/components/sections/YouTubeLatest';
import YouTubeShorts from '@/components/sections/YouTubeShorts';
import InstagramStories from '@/components/sections/InstagramStories';
import AstrologySection from '@/components/sections/AstrologySection';

const CHANNEL_URL = 'https://www.youtube.com/@Gujaratpostnews';
const CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
const LATEST_VIDEO_ID = 'A_5vL-ngK4M';

const HOME_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
  'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80',
  'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&q=80',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
  'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&q=80',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
  'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80',
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
];

function makeHomeImagesUnique<T extends Article>(sections: T[][]): T[][] {
  const used = new Set<string>();
  let fallbackIndex = 0;

  return sections.map((section) =>
    section.map((article) => {
      let image = article.image;

      if (used.has(image)) {
        for (let tries = 0; tries < HOME_IMAGE_FALLBACKS.length; tries++) {
          const candidateIndex = (fallbackIndex + tries) % HOME_IMAGE_FALLBACKS.length;
          const candidate = HOME_IMAGE_FALLBACKS[candidateIndex];

          if (!used.has(candidate)) {
            image = candidate;
            fallbackIndex = (candidateIndex + 1) % HOME_IMAGE_FALLBACKS.length;
            break;
          }
        }
      }

      used.add(image);
      return image === article.image ? article : { ...article, image };
    })
  );
}

/* ===========================================================================
   Main HeroSection -- tv9gujarati.com style 3-column layout
=========================================================================== */
export default function HeroSection() {
  const { language } = useApp();
  const [videoMode, setVideoMode] = useState<'latest' | 'live'>('latest');

  // DB-backed article state
  const [topNews, setTopNews] = useState<Article[]>([]);
  const [topStories, setTopStories] = useState<Article[]>([]);
  const [trendingArtDB, setTrendingArtDB] = useState<Article[]>([]);
  const [gujaratArtDB, setGujaratArtDB] = useState<Article[]>([]);
  const [crimeArtDB, setCrimeArtDB] = useState<Article[]>([]);
  const [nationalArtDB, setNationalArtDB] = useState<Article[]>([]);
  const [worldArtDB, setWorldArtDB] = useState<Article[]>([]);
  const [businessArtDB, setBusinessArtDB] = useState<Article[]>([]);
  const [sportsArtDB, setSportsArtDB] = useState<Article[]>([]);

  const fetchArticles = async (url: string): Promise<Article[]> => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      return json.success ? (json.data?.articles || []) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    Promise.all([
      fetchArticles('/api/news/top-news?limit=6'),
      fetchArticles('/api/news/top-stories?limit=16'),
      fetchArticles('/api/news/trending?limit=10'),
      fetchArticles('/api/category/state?limit=16'),
      fetchArticles('/api/category/crime?limit=4'),
      fetchArticles('/api/category/national?limit=4'),
      fetchArticles('/api/category/world?limit=4'),
      fetchArticles('/api/category/business?limit=4'),
      fetchArticles('/api/category/sports?limit=7'),
    ]).then(([news, stories, trend, guj, crime, natl, world, biz, sports]) => {
      setTopNews(news.length ? news : ARTICLES.slice(0, 6));
      setTopStories(stories.length ? stories : ARTICLES.filter((a) => a.isFeatured).slice(0, 16));
      setTrendingArtDB(trend.length ? trend : ARTICLES.filter((a) => a.isTrending).slice(0, 10));
      setGujaratArtDB(guj.length ? guj : getArticlesByCategory('state').slice(0, 16));
      setCrimeArtDB(crime.length ? crime : getArticlesByCategory('crime').slice(0, 4));
      setNationalArtDB(natl.length ? natl : getArticlesByCategory('national').slice(0, 4));
      setWorldArtDB(world.length ? world : getArticlesByCategory('world').slice(0, 4));
      setBusinessArtDB(biz.length ? biz : getArticlesByCategory('business').slice(0, 4));
      setSportsArtDB(sports.length ? sports : getArticlesByCategory('sports').slice(0, 7));
    });
  }, []);

  // Derived slices
  const leftItems = topNews.slice(0, 5);
  const topStoriesSlice = topStories.slice(0, 16);
  const stateRowArticles = [
    ...gujaratArtDB,
    ...topStories,
    ...trendingArtDB,
    ...topNews,
  ].filter((article, index, list) => list.findIndex((item) => item.id === article.id) === index).slice(0, 16);

  // Videos — still from static data
  const videos = VIDEOS.filter(v => v.type === 'video').slice(0, 5);

  const [
    uniqueLeftItems,
    uniqueTopStories,
    uniqueGujaratArt,
    uniqueCrimeArt,
    uniqueNationalArt,
    uniqueWorldArt,
    uniqueBusinessArt,
    uniqueSportsArt,
    uniqueTrendingArt,
  ] = makeHomeImagesUnique([
    leftItems,
    topStoriesSlice,
    stateRowArticles,
    crimeArtDB,
    nationalArtDB,
    worldArtDB,
    businessArtDB,
    sportsArtDB,
    trendingArtDB,
  ]);

  const leadStoryId = uniqueTopStories[0]?.id;
  const leadSideArticles = [
    ...uniqueLeftItems,
    ...uniqueTopStories.slice(9),
    ...uniqueGujaratArt,
  ].filter((article, index, list) => (
    article.id !== leadStoryId &&
    list.findIndex((item) => item.id === article.id) === index
  )).slice(0, 8);

  if (!topStories.length) return <HeroSectionSkeleton language={language} />;

  return (
    <div className="mx-auto max-w-screen-xl px-2 py-0.5 space-y-1">

      {/* ── ROW 1: 3-column main section ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-1 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
        <div className="min-w-0">
            {/* ── REDESIGNED HERO NEWS SECTION (3 columns layout: 50% Left, 25% Middle, 25% Right) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              
              {/* LEFT COLUMN (Featured News + compact article list) */}
              <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4 w-full">
                {uniqueTopStories[0] && (
                  <Link href={`/news/${uniqueTopStories[0].slug}`} className="group relative flex flex-col w-full">
                    <div className="relative aspect-[2.3/1] w-full overflow-hidden rounded-lg border border-border/10 shadow-sm">
                      <Image
                        src={uniqueTopStories[0].image}
                        alt={uniqueTopStories[0].title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        priority
                      />
                    </div>
                    <span className="text-accent font-bold text-[13px] uppercase tracking-wide mt-2.5">
                      {getCategoryLabel(uniqueTopStories[0], language)}
                    </span>
                    <h1 className="text-[#111] dark:text-white font-extrabold text-[22px] md:text-[26px] lg:text-[30px] leading-[1.18] tracking-tight mt-1.5 transition-colors group-hover:text-accent line-clamp-3">
                      {getArticleTitle(uniqueTopStories[0], language)}
                    </h1>
                  </Link>
                )}

                {leadSideArticles.length > 0 && (
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-border/70 pt-3 sm:grid-cols-2">
                    {leadSideArticles.map((art) => (
                      <Link
                        key={art.id}
                        href={`/news/${art.slug}`}
                        className="group relative flex min-h-[66px] gap-2 rounded-md py-0.5 transition-colors hover:bg-muted/30"
                      >
                        <div className="relative h-[60px] w-[88px] shrink-0 overflow-hidden rounded-lg border border-border/10 bg-muted shadow-sm">
                          <Image
                            src={art.image}
                            alt={art.title}
                            fill
                            sizes="88px"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-accent font-bold text-[10px] uppercase tracking-wide">
                            {getCategoryLabel(art, language)}
                          </span>
                          <h2 className="mt-0.5 line-clamp-3 text-[13.5px] font-black leading-snug text-[#111] transition-colors group-hover:text-accent dark:text-white md:text-[14px]">
                            {getArticleTitle(art, language)}
                          </h2>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* MIDDLE COLUMN (4 Vertical Cards) */}
              <div className="md:col-span-1 lg:col-span-1 flex flex-col gap-4 w-full">
                {uniqueTopStories.slice(1, 5).map((art) => {
                  const showVideoIcon = art.isTrending || art.isFeatured || Number(art.id) % 3 === 0;
                  return (
                    <Link key={art.id} href={`/news/${art.slug}`} className="group relative flex flex-col w-full">
                      <div className="relative aspect-[2.8/1] w-full overflow-hidden rounded-lg border border-border/10 shadow-sm">
                        <Image
                          src={art.image}
                          alt={art.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                      <span className="text-accent font-bold text-[11px] uppercase tracking-wide mt-1.5 block">
                        {getCategoryLabel(art, language)}
                      </span>
                      <h2 className="text-[#111] dark:text-white font-bold text-[14px] md:text-[14.5px] lg:text-[15px] leading-snug mt-0.5 transition-colors group-hover:text-accent line-clamp-3">
                        {showVideoIcon && (
                          <span className="inline-flex items-center text-red-600 mr-1 shrink-0 -mt-0.5 align-middle">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 7l-7 5 7 5V7z" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                          </span>
                        )}
                        {getArticleTitle(art, language)}
                      </h2>
                    </Link>
                  );
                })}
              </div>

              {/* RIGHT COLUMN (4 Vertical Cards) */}
              <div className="md:col-span-1 lg:col-span-1 flex flex-col gap-4 w-full">
                {uniqueTopStories.slice(5, 9).map((art) => {
                  const showVideoIcon = art.isTrending || art.isFeatured || Number(art.id) % 3 === 0;
                  return (
                    <Link key={art.id} href={`/news/${art.slug}`} className="group relative flex flex-col w-full">
                      <div className="relative aspect-[2.8/1] w-full overflow-hidden rounded-lg border border-border/10 shadow-sm">
                        <Image
                          src={art.image}
                          alt={art.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                      <span className="text-accent font-bold text-[11px] uppercase tracking-wide mt-1.5 block">
                        {getCategoryLabel(art, language)}
                      </span>
                      <h2 className="text-[#111] dark:text-white font-bold text-[14px] md:text-[14.5px] lg:text-[15px] leading-snug mt-0.5 transition-colors group-hover:text-accent line-clamp-3">
                        {showVideoIcon && (
                          <span className="inline-flex items-center text-red-600 mr-1 shrink-0 -mt-0.5 align-middle">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 7l-7 5 7 5V7z" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                          </span>
                        )}
                        {getArticleTitle(art, language)}
                      </h2>
                    </Link>
                  );
                })}
              </div>

            </div>

          <AapKiAdalatSection videos={videos.slice(0, 5)} language={language} />

          {/* Trending News moved to Right Sidebar under EPaper Widget */}

          <div className="min-w-0">
            {/* ── Rajya Samachar (fills remaining white space) */}
            <CategoryRow
              title="State News" titleGu="રાજ્ય સમાચાર"
              href="/category/state"
              articles={uniqueGujaratArt} language={language}
            />
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <LiveTVWidget language={language} videoMode={videoMode} setVideoMode={setVideoMode} />
          <WeatherWidget language={language} />
          <EPaperWidget language={language} />
          <TrendingSidebarWidget articles={uniqueTrendingArt} language={language} />
        </div>
      </div>

      {/* YouTube latest videos (moved immediately after Rajya Samachar/Row 1 section) */}
      <YouTubeLatest />

      {/* YouTube shorts videos */}
      <YouTubeShorts />

      {/* Web Stories styled like Instagram Stories */}
      <InstagramStories />

      {/* ── ROW 2: 4-column category columns (National, World, Crime, Business) */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-4">
        <CategoryColumn title="National" titleGu="રાષ્ટ્રીય" href="/category/national" articles={uniqueNationalArt} language={language} showExcerpt={true} />
        <CategoryColumn title="World" titleGu="વિશ્વ" href="/category/world" articles={uniqueWorldArt} language={language} />
        <CategoryColumn title="Crime" titleGu="અપરાધ" href="/category/crime" articles={uniqueCrimeArt} language={language} />
        <CategoryColumn title="Business" titleGu="બિઝનેસ" href="/category/business" articles={uniqueBusinessArt} language={language} />
      </div>

      {/* Astrology / Horoscope Section */}
      <AstrologySection />

      <SportsShowcase articles={uniqueSportsArt} language={language} />

      {/* ── ROW 3: Videos strip ───────────────────────────────────────────── */}
      <VideoStrip videos={videos} language={language} />
    </div>
  );
}

/* --- Aap Ki Adalat Video Section ------------------------------------------ */
function AapKiAdalatSection({ videos, language }: { videos: typeof VIDEOS; language: Language }) {
  const [playId, setPlayId] = useState<string | null>(null);

  if (!videos.length) return null;

  return (
    <section className="mt-5 pb-5">
      {/* Header with Short Underline */}
      <div className="mb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="inline-block border-b-[3px] border-accent pb-1.5 pr-10 text-[20px] md:text-[24px] font-black text-foreground">
          {getLocalized(language, { en: 'Gujarat Post Specials', gu: 'ગુજરાત પોસ્ટ વિશેષ', hi: 'गुजरात पोस्ट विशेष' })}
        </h2>
      </div>

      {/* Grid of Videos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => setPlayId(video.youtubeId)}
            className="group block overflow-hidden rounded-lg shadow-sm border border-border/10 cursor-pointer bg-accent"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute left-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-2 ring-white/70 transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </span>
            </div>
            {/* Title Container with Solid Accent Color */}
            <div className="px-2.5 py-3.5 min-h-[86px] bg-accent text-white">
              <h3 className="line-clamp-2 text-[13px] md:text-[14px] font-black leading-snug">
                {getLocalized(language, { en: video.title, gu: video.titleGu, hi: video.titleHi })}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Centered View More Button */}
      <div className="mt-4 flex justify-center">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 bg-zinc-800 px-4.5 py-1.5 text-[12.5px] md:text-[13px] font-black text-white transition hover:bg-zinc-700"
        >
          {getLocalized(language, { en: 'View More', gu: 'વધુ જુઓ', hi: 'और देखें' })}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Video Player Modal */}
      {playId && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6"
          onClick={() => setPlayId(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-4 top-4 z-20">
              <button
                type="button"
                onClick={() => setPlayId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${playId}?autoplay=1&rel=0`}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* --- Trending Sidebar Widget ------------------------------------------------ */
function TrendingSidebarWidget({ articles, language }: { articles: Article[]; language: Language }) {
  if (!articles.length) return null;

  return (
    <div className="border border-border/85 bg-card rounded-xl p-4 shadow-sm mt-3">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
        <Flame className="h-5 w-5 text-accent animate-pulse fill-current shrink-0" />
        <h3 className="text-[16px] font-black text-foreground">
          {getLocalized(language, { en: 'Trending News', gu: 'ટ્રેન્ડિંગ સમાચાર', hi: 'ट्रेंडिंग समाचार' })}
        </h3>
      </div>

      {/* Vertical List */}
      <div className="flex flex-col gap-3.5">
        {articles.slice(0, 10).map((art, idx) => (
          <Link
            key={art.id}
            href={`/news/${art.slug}`}
            className="group flex items-start gap-3 transition-colors pb-3 border-b border-border/40 last:border-0 last:pb-0"
          >
            {/* Number Rank */}
            <span className="text-[20px] font-black text-accent/80 group-hover:text-accent w-6 shrink-0 mt-0.5 text-center">
              {idx + 1}
            </span>
            {/* Small Thumbnail */}
            <div className="relative h-[38px] w-[56px] shrink-0 overflow-hidden rounded-md border border-border/10 bg-muted">
              <Image
                src={art.image}
                alt={art.title}
                fill
                sizes="56px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {/* Title */}
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-3 text-[13.5px] leading-snug font-medium text-foreground group-hover:text-accent transition-colors duration-150">
                {getArticleTitle(art, language)}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* --- Section Label ---------------------------------------------------------- */
function SectionLabel({ title, titleGu, language }: { title: string; titleGu: string; language: Language }) {
  const display = language === 'en' ? title : titleGu;
  return (
    <div className="flex items-center gap-1.5 mb-1 border-b-2 border-accent pb-0.5">
      <Flame className="h-5 w-5 text-accent fill-current shrink-0" />
      <span className="text-[19px] md:text-[21px] font-black leading-tight text-foreground">{display}</span>
    </div>
  );
}

/* --- Article Hover Preview Removed ----------------------------------------- */

/* --- Left List Item --------------------------------------------------------- */
function LeftListItem({ article, language }: { article: Article; language: Language }) {
  const title = getArticleTitle(article, language);
  const cat = getCategoryLabel(article, language);
  const cc = getCategoryColor(article.category);
  return (
    <Link href={`/news/${article.slug}`} className="group flex min-h-[58px] gap-2 rounded px-1 py-1.5 transition hover:bg-muted/50">
      <div className="relative h-[50px] w-[68px] shrink-0 overflow-hidden rounded-md">
        <Image src={article.image} alt={article.title} fill sizes="68px" className="object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className="min-w-0 flex flex-1 flex-col justify-between">
        <div>
          <span className="rounded px-1.5 py-[2px] text-[8px] font-black leading-none text-white" style={{ background: cc }}>{cat}</span>
          <p className="mt-0.5 line-clamp-2 text-[13.5px] font-black leading-[1.2] text-foreground transition-colors group-hover:text-accent">{title}</p>
        </div>
        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{formatTime(article.publishedAt)}</span>
          <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{formatViews(article.views)}</span>
        </div>
      </div>
    </Link>
  );
}

/* --- Story Row (horizontal list view matching user design) ----------------- */
function StoryRow({ article, language }: { article: Article; language: Language }) {
  const title = getArticleTitle(article, language);
  const cc = getCategoryColor(article.category || '');

  // Decide overlay icons for visual interest matching user screenshot
  const categoryLower = article.category?.toLowerCase() || '';
  const showPlay = ['entertainment', 'world', 'politics', 'sports'].includes(categoryLower);
  const showCamera = ['technology', 'business', 'lifestyle', 'crime'].includes(categoryLower);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex items-center justify-between gap-4 py-3 hover:bg-muted/40 transition-colors duration-200 first:pt-1 last:pb-1"
    >
      {/* Title (left side) */}
      <h3 className="flex-1 text-[14px] md:text-[15.5px] font-black leading-snug text-foreground transition-colors duration-200 group-hover:text-accent line-clamp-3 pr-2">
        {title}
      </h3>

      {/* Image Thumbnail (right side) */}
      <div className="relative h-[66px] w-[100px] shrink-0 overflow-hidden rounded-lg border border-border/10 shadow-sm">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="100px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay icon at bottom-left of image */}
        {showPlay && (
          <div className="absolute left-1 bottom-1 bg-red-600 text-white rounded p-1 flex items-center justify-center shadow-lg">
            <Play className="h-3 w-3 fill-current text-white" />
          </div>
        )}
        {showCamera && (
          <div className="absolute left-1 bottom-1 bg-red-600 text-white rounded p-1 flex items-center justify-center shadow-lg">
            <Camera className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </Link>
  );
}

/* --- Category Row (4-col horizontal) --------------------------------------- */
function CategoryRow({
  title, titleGu, href, articles, language
}: { title: string; titleGu: string; href: string; articles: Article[]; language: Language }) {
  const display = language === 'en' ? title : titleGu;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 border-b border-border pb-1">
        <span className="section-heading text-[18px] md:text-[20px] font-black leading-tight text-foreground">{display}</span>
        <Link href={href} className="flex items-center gap-0.5 text-[13px] md:text-[14px] font-bold text-accent hover:underline">
          {language === 'gu' ? 'બધા જુઓ' : 'View all'} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.slice(0, 16).map((art: Article) => {
          const t = getArticleTitle(art, language);
          const cc = getCategoryColor(art.category);
          return (
            <Link key={art.id} href={`/news/${art.slug}`} className="news-card group flex h-[98px] gap-2 overflow-hidden rounded-md border border-border bg-card p-1.5 shadow-sm transition hover:border-accent/40 hover:shadow-md">
              <div className="relative h-full w-[82px] shrink-0 overflow-hidden rounded">
                <Image src={art.image} alt={art.title} fill sizes="82px" className="object-cover transition group-hover:scale-105" />
              </div>
              <div className="min-w-0 flex flex-1 flex-col justify-between py-1">
                <p className="line-clamp-3 text-[13px] md:text-[13.5px] font-black leading-[1.2] text-foreground transition-colors group-hover:text-accent">{t}</p>
                <div className="flex items-center gap-1 text-[10.5px] leading-none text-muted-foreground border-t border-border/30 pt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cc }} />
                  <span>{formatTime(art.publishedAt)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* --- Category Row Compact (2-col split layout) ------------------------------ */
/* --- Category Column (4 side-by-side vertical grids) ----------------------- */
function CategoryColumn({
  title, titleGu, href, articles, language, showExcerpt = false
}: {
  title: string;
  titleGu: string;
  href: string;
  articles: Article[];
  language: Language;
  showExcerpt?: boolean;
}) {
  const displayTitle = language === 'en' ? title : titleGu;
  const viewAllText = language === 'gu' ? 'વધુ જુઓ >' : 'View all >';

  if (!articles || articles.length === 0) return null;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-2.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/80">
        <div className="flex items-center gap-1.5">
          <span className="h-4 w-[3px] bg-accent shrink-0 rounded-sm" />
          <span className="text-[15px] md:text-[16px] font-black text-foreground">{displayTitle}</span>
        </div>
        <Link href={href} className="text-[11px] font-black text-accent hover:underline">
          {viewAllText}
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {articles.slice(0, 4).map((art: Article, idx: number) => {
          const t = getArticleTitle(art, language);
          const excerpt = getArticleExcerpt(art, language);

          if (idx === 0) {
            // First item: larger
            return (
              <Link key={art.id} href={`/news/${art.slug}`} className="group flex gap-2.5 pb-2.5 border-b border-border/40">
                <div className="relative h-[74px] w-[110px] shrink-0 overflow-hidden rounded-md">
                  <Image src={art.image} alt={art.title} fill sizes="110px" className="object-cover group-hover:scale-105 transition duration-300" />
                </div>
                <div className="min-w-0 flex flex-col justify-between flex-1">
                  <div>
                    <p className="line-clamp-2 text-[12px] font-black leading-snug text-foreground group-hover:text-accent transition duration-200">
                      {t}
                    </p>
                    {showExcerpt && excerpt && (
                      <p className="line-clamp-2 text-[10.5px] text-muted-foreground leading-normal mt-0.5 font-semibold">
                        {excerpt}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-[9.5px] text-accent font-bold mt-1">
                    <Clock className="h-2.5 w-2.5 text-accent fill-none stroke-[3]" />
                    {formatTime(art.publishedAt)}
                  </span>
                </div>
              </Link>
            );
          } else {
            // Sub-items: smaller
            return (
              <Link key={art.id} href={`/news/${art.slug}`} className="group flex gap-2.5 items-start pb-2 border-b border-border/40 last:border-b-0 last:pb-0 last:mb-0">
                <div className="relative h-[50px] w-[70px] shrink-0 overflow-hidden rounded-md">
                  <Image src={art.image} alt={art.title} fill sizes="70px" className="object-cover group-hover:scale-105 transition duration-300" />
                </div>
                <div className="min-w-0 flex flex-col justify-between flex-1 min-h-[50px]">
                  <p className="line-clamp-2 text-[11px] font-black leading-snug text-foreground group-hover:text-accent transition duration-200">
                    {t}
                  </p>
                  <span className="flex items-center gap-1 text-[9.5px] text-accent font-bold mt-0.5">
                    <Clock className="h-2.5 w-2.5 text-accent fill-none stroke-[3]" />
                    {formatTime(art.publishedAt)}
                  </span>
                </div>
              </Link>
            );
          }
        })}
      </div>
    </div>
  );
}

interface SportsCricketScore {
  title: string;
  status: string;
  teams: Array<{ name: string; score: string }>;
}

interface SportsFootballScore {
  id: string;
  league: string;
  status: string;
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
}

function SportsShowcase({ articles, language }: { articles: Article[]; language: Language }) {
  if (!articles.length) return null;

  const mainArticle = articles[0];
  const listArticles = articles.slice(1, 6);
  const sideArticle = articles[6] ?? articles[4] ?? articles[1] ?? articles[0];

  return (
    <section className="rounded-sm border border-border bg-card px-4 py-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-6 w-[3px] rounded-full bg-accent" />
          <h2 className="text-[18px] font-black leading-none text-foreground">
            રમતગમત
            <span className="ml-2 align-middle text-[11px] font-black text-muted-foreground">Sports</span>
          </h2>
        </div>
        <Link href="/category/sports" className="text-[11px] font-black text-accent hover:underline">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_1.05fr_0.85fr_1.05fr]">
        <SportsFeatureCard article={mainArticle} language={language} label="IPL 2025" large />
        <div className="flex flex-col rounded-md border border-border bg-background">
          {listArticles.map((article) => (
            <SportsListItem key={article.id} article={article} language={language} />
          ))}
        </div>
        <SportsFeatureCard article={sideArticle} language={language} label="ટેનિસ" />
        <SportsScorePanel language={language} />
      </div>
    </section>
  );
}

function SportsFeatureCard({
  article,
  language,
  label,
  large = false,
}: {
  article: Article;
  language: Language;
  label: string;
  large?: boolean;
}) {
  const title = getArticleTitle(article, language);
  const excerpt = getArticleExcerpt(article, language);
  const cc = getCategoryColor(article.category);

  return (
    <Link href={`/news/${article.slug}`} className="group relative block min-h-[210px] overflow-hidden rounded-md bg-slate-950">
      <Image
        src={article.image}
        alt={article.title}
        fill
        sizes={large ? '(max-width: 1024px) 100vw, 34vw' : '(max-width: 1024px) 100vw, 22vw'}
        className="object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
      <span
        className="absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-black text-white"
        style={{ background: label === 'IPL 2025' ? '#dc2626' : cc }}
      >
        {label}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className={`${large ? 'text-[19px]' : 'text-[15px]'} line-clamp-2 font-black leading-snug`}>
          {title}
        </h3>
        {large && <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-relaxed text-white/85">{excerpt}</p>}
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-white/85">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViews(article.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SportsListItem({ article, language }: { article: Article; language: Language }) {
  const title = getArticleTitle(article, language);
  const cat = getCategoryLabel(article, language);

  return (
    <Link href={`/news/${article.slug}`} className="group flex flex-1 gap-3 border-b border-border p-2.5 last:border-b-0 hover:bg-muted/60">
      <div className="relative h-[70px] w-[96px] shrink-0 overflow-hidden rounded">
        <Image src={article.image} alt={article.title} fill sizes="96px" className="object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className="min-w-0 flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[11px] font-black leading-none text-accent">{cat}</p>
          <p className="mt-1 line-clamp-2 text-[12.5px] font-black leading-snug text-foreground group-hover:text-accent">
            {title}
          </p>
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-2.5 w-2.5" />
            {formatViews(article.views)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SportsScorePanel({ language }: { language: Language }) {
  const [cricket, setCricket] = useState<SportsCricketScore | null>(null);
  const [football, setFootball] = useState<SportsFootballScore[]>([]);

  useEffect(() => {
    fetch('/api/live/sports', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { cricket?: SportsCricketScore | null; football?: SportsFootballScore[] }) => {
        setCricket(data.cricket ?? null);
        setFootball(data.football ?? []);
      })
      .catch(() => {
        setCricket(null);
        setFootball([]);
      });
  }, []);

  const cricketRows = cricket?.teams.length
    ? cricket.teams.slice(0, 2)
    : [
      { name: 'GT', score: '196/4' },
      { name: 'MI', score: '160/8' },
    ];
  const footballRow = football[0];

  return (
    <aside className="rounded-md border border-dashed border-accent/55 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-black text-accent">
          {language === 'en' ? 'Live Score' : 'લાઇવ સ્કોર'}
        </h3>
        <Link href="/live" className="text-[10px] font-black text-accent underline">
          View All
        </Link>
      </div>

      <div className="space-y-2">
        <ScoreBox
          title={cricket?.title ?? 'IPL 2025'}
          rows={cricketRows.map((team) => ({ name: team.name, score: team.score }))}
          status={cricket?.status ?? 'GT won by 36 runs'}
          statusColor="text-emerald-600"
        />
        <ScoreBox
          title={footballRow?.league ?? 'Ranji Trophy'}
          rows={[
            { name: footballRow?.home ?? 'Gujarat', score: footballRow?.homeScore ?? '275/6' },
            { name: footballRow?.away ?? 'Mumbai', score: footballRow?.awayScore ?? '312/10' },
          ]}
          status={footballRow?.status ?? 'Day 2 - Stumps'}
          statusColor="text-accent"
        />
        <ScoreBox
          title="Pro Kabaddi"
          rows={[
            { name: 'GUJ', score: '32' },
            { name: 'BEN', score: '28' },
          ]}
          status="GUJ won"
          statusColor="text-emerald-600"
        />
      </div>
    </aside>
  );
}

function ScoreBox({
  title,
  rows,
  status,
  statusColor,
}: {
  title: string;
  rows: Array<{ name: string; score: string }>;
  status: string;
  statusColor: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm">
      <p className="mb-2 text-[10px] font-black text-sky-600">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={`${title}-${row.name}`} className="flex items-center justify-between gap-3 text-[12px] font-black text-foreground">
            <span className="min-w-0 truncate">{row.name}</span>
            <span className="shrink-0">{row.score}</span>
          </div>
        ))}
      </div>
      <p className={`mt-2 text-right text-[10px] font-black ${statusColor}`}>{status}</p>
    </div>
  );
}

/* --- Video Strip ------------------------------------------------------------ */
function VideoStrip({ videos, language }: { videos: typeof VIDEOS; language: Language }) {
  const [playId, setPlayId] = useState<string | null>(null);

  const activeVideo = videos.find(v => v.id === playId);
  return (
    <div>
      {/* Modal Overlay */}
      {playId && activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6"
          onClick={() => setPlayId(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-black/80 px-4 py-3 backdrop-blur-sm">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{getLocalized(language, { en: activeVideo.title, gu: activeVideo.titleGu, hi: activeVideo.titleHi })}</p>
                <p className="text-xs text-white/70">{getLocalized(language, { en: 'Gujarat Post', gu: 'ગુજરાત પોસ્ટ', hi: 'गुजरात पोस्ट' })}</p>
              </div>
              <button
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/15"
                onClick={() => setPlayId(null)}
              >
                Close
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={getLocalized(language, { en: activeVideo.title, gu: activeVideo.titleGu, hi: activeVideo.titleHi })}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-1 border-b border-border pb-0.5">
        <span className="section-heading text-[17px] md:text-[18px] font-black text-foreground">
          {language === 'gu' ? 'વીડિયો' : language === 'hi' ? 'वीडियो' : 'Videos'}
        </span>
        <Link href="/videos" className="flex items-center gap-0.5 text-[12px] md:text-[13px] font-bold text-accent hover:underline">
          {language === 'gu' ? 'બધા જુઓ' : 'View all'} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {videos.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative aspect-video overflow-hidden rounded-[24px] bg-slate-950">
              {playId === v.id ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0`}
                  title={getLocalized(language, { en: v.title, gu: v.titleGu, hi: v.titleHi })}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="group/v relative h-full w-full cursor-pointer" onClick={() => setPlayId(v.id)}>
                  <Image src={v.thumbnail} alt={v.title} fill sizes="20vw" className="object-cover transition duration-300 group-hover/v:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover/v:opacity-100">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-xl transition-transform duration-300 group-hover/v:scale-110">
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    {v.duration}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-[12px] font-black leading-snug text-foreground">
                {getLocalized(language, { en: v.title, gu: v.titleGu, hi: v.titleHi })}
              </p>
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground mt-2">
                <Eye className="h-3 w-3" />{formatViews(v.views)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Live TV Widget --------------------------------------------------------- */
interface LiveTVWidgetProps { language: Language; videoMode: 'latest' | 'live'; setVideoMode: (m: 'latest' | 'live') => void; }
function LiveTVWidget({ language, videoMode, setVideoMode }: LiveTVWidgetProps) {
  const [liveStatus, setLiveStatus] = useState<'checking' | 'live' | 'offline'>('checking');
  useEffect(() => {
    fetch('/api/live/tv').then(r => r.json()).then((d: { isLive: boolean }) => {
      setLiveStatus(d.isLive ? 'live' : 'offline');
      setVideoMode(d.isLive ? 'live' : 'latest');
    }).catch(() => { setLiveStatus('offline'); setVideoMode('latest'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isLive = liveStatus === 'live';
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between bg-accent px-3 py-1">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[12px] md:text-sm font-black text-white uppercase tracking-wide">
            {language === 'gu' ? 'લાઈવ ટીવી' : 'Live TV'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setVideoMode('latest')}
            className={`rounded px-2.5 py-0.5 text-[10px] md:text-xs font-black transition cursor-pointer ${videoMode === 'latest' ? 'bg-white text-accent' : 'text-white/80 hover:text-white'}`}>
            {language === 'gu' ? 'તાજા' : 'Latest'}
          </button>
          {isLive && (
            <button type="button" onClick={() => setVideoMode('live')}
              className={`rounded px-2.5 py-0.5 text-[10px] md:text-xs font-black transition cursor-pointer ${videoMode === 'live' ? 'bg-white text-accent' : 'text-white/80 hover:text-white'}`}>
              LIVE
            </button>
          )}
        </div>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <iframe key={videoMode} className="absolute inset-0 h-full w-full"
          src={videoMode === 'live'
            ? `https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}&autoplay=1&mute=1&rel=0`
            : `https://www.youtube.com/embed/${LATEST_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1`}
          title="Gujarat Post Live"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-1">
        <div className="flex items-center gap-1.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[10px] md:text-xs font-black text-white">GP</span>
          <p className="text-xs md:text-sm font-black text-foreground">Gujarat Post</p>
        </div>
        <a href={CHANNEL_URL} target="_blank" rel="noreferrer"
          className="rounded bg-[#ff0000] px-3 py-1 text-[10px] md:text-xs font-black text-white hover:bg-red-600 transition">
          {language === 'gu' ? 'સબ્સ.' : 'Subscribe'}
        </a>
      </div>
    </div>
  );
}

/* --- Weather Widget --------------------------------------------------------- */
function WeatherWidget({ language }: { language: Language }) {
  const [weather, setWeather] = useState<Array<{ city: string; state: string; temperature: number; condition: string; humidity: number; windSpeed: number }> | null>(null);
  useEffect(() => {
    const FALLBACK_WEATHER = [
      { city: 'Ahmedabad', state: 'Gujarat', temperature: 32, condition: 'Partly cloudy', humidity: 65, windSpeed: 12 },
      { city: 'Vadodara', state: 'Gujarat', temperature: 31, condition: 'Sunny', humidity: 62, windSpeed: 10 }
    ];
    fetch('/api/live/weather?cities=Ahmedabad,Vadodara').then(r => r.json())
      .then((d: { weather?: Array<{ city: string; state: string; temperature: number; condition: string; humidity: number; windSpeed: number }> }) => {
        setWeather(d.weather && d.weather.length ? d.weather : FALLBACK_WEATHER);
      }).catch(() => { setWeather(FALLBACK_WEATHER); });
  }, []);
  const label = language === 'gu' ? 'હવામાન' : language === 'hi' ? 'मौसम' : 'Weather';
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <span className="text-xs md:text-sm font-black text-foreground">{label}</span>
        {/* <span className="text-[10px] md:text-[11px] font-semibold uppercase text-accent tracking-wide">Ahmedabad · Gandhinagar · Vadodara</span> */}
      </div>
      {!weather ? (
        <div className="py-8 text-center text-sm font-semibold text-muted-foreground">Loading weather…</div>
      ) : weather.length === 0 ? (
        <div className="py-8 text-center text-sm font-semibold text-muted-foreground">Weather unavailable</div>
      ) : (
        <div className="space-y-3">
          {(Array.isArray(weather) ? weather.slice(0, 2) : []).map((item) => (
            <div key={item.city} className="rounded-2xl border border-border/80 bg-white/95 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-foreground">{item.city}</p>
                  <p className="text-[11px] text-muted-foreground">{item.condition}</p>
                </div>
                <span className="text-3xl font-black text-accent">{item.temperature}°C</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                <div className="rounded-xl bg-slate-50 p-2 text-center">
                  <p className="font-semibold text-foreground">Humidity</p>
                  <p>{item.humidity}%</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2 text-center">
                  <p className="font-semibold text-foreground">Wind</p>
                  <p>{item.windSpeed} km/h</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2 text-center">
                  <p className="font-semibold text-foreground">Feels like</p>
                  <p>{item.temperature}°C</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- E-Paper Widget --------------------------------------------------------- */
function EPaperWidget({ language }: { language: Language }) {
  const label = language === 'gu' ? 'ઈ-પેપર' : 'E-Paper';
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between border-b border-border pb-1 mb-1.5">
        <span className="text-xs md:text-sm font-black text-foreground">{label}</span>
        <span className="text-[11px] md:text-xs text-accent font-bold">
          {language === 'gu' ? 'ઓનલાઈન વાંચો' : 'Read Online'}
        </span>
      </div>
      <Link href="/epaper" className="group flex items-center gap-3 hover:opacity-80 transition">
        <div className="relative h-[90px] w-[80px] shrink-0 overflow-hidden rounded border border-border shadow-md">
          <Image
            src="https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&q=80"
            alt="E-Paper"
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm md:text-base font-black text-foreground leading-snug">Gujarat Post</p>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="pt-1">
            <span
              className="inline-flex items-center gap-1 rounded bg-accent px-3 py-1 text-[10px] md:text-xs font-black text-white transition hover:bg-accent/90 shadow-sm">
              {language === 'gu' ? 'PDF ડાઉનલોડ' : 'PDF Download'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* --- Hero Section Skeleton Loader ------------------------------------------- */
function HeroSectionSkeleton({ language }: { language: Language }) {
  const isGu = language === 'gu';
  const labelTopNews = isGu ? 'મુખ્ય સમાચાર' : 'Top News';
  const labelTopStories = isGu ? 'ટૉપ સ્ટોરી' : 'Top Stories';
  const labelTrending = isGu ? 'ટ્રેન્ડિંગ સમાચાર' : 'Trending News';
  const labelStateNews = isGu ? 'રાજ્ય સમાચાર' : 'State News';
  const labelLiveTV = isGu ? 'લાઈવ ટીવી' : 'Live TV';
  const labelWeather = isGu ? 'હવામાન' : 'Weather';
  const labelEPaper = isGu ? 'ઈ-પેપર' : 'E-Paper';

  return (
    <div className="mx-auto max-w-screen-xl px-2 py-0.5 space-y-2 animate-pulse">
      {/* ROW 1: 3-column main section */}
      <div className="grid grid-cols-1 gap-1 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
        <div className="min-w-0">
            {/* ── REDESIGNED HERO NEWS SECTION SKELETON ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-pulse">
              
              {/* LEFT COLUMN (Featured News + 3 Horizontal Cards Skeleton) */}
              <div className="w-full flex flex-col gap-6">
                <div className="w-full">
                  <div className="relative aspect-[16/9] w-full rounded-lg bg-muted" />
                  <div className="h-3.5 w-16 bg-muted rounded mt-3" />
                  <div className="h-8 w-full bg-muted rounded mt-2" />
                  <div className="h-8 w-3/4 bg-muted rounded mt-2" />
                </div>
                <div className="flex flex-col gap-5 border-t border-border/80 pt-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="relative w-[88px] h-[58px] rounded-lg bg-muted shrink-0" />
                      <div className="flex-1 space-y-1.5 py-1">
                        <div className="h-3 w-16 bg-muted rounded" />
                        <div className="h-4.5 w-full bg-muted rounded" />
                        <div className="h-4.5 w-5/6 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT SIDE (2-Column Grid of 6 Small Cards Skeleton) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col w-full">
                    <div className="relative aspect-[2/1] w-full rounded-lg bg-muted" />
                    <div className="h-3 w-16 bg-muted rounded mt-2" />
                    <div className="h-4.5 w-full bg-muted rounded mt-2" />
                    <div className="h-4.5 w-5/6 bg-muted rounded mt-1.5" />
                  </div>
                ))}
              </div>

            </div>

          {/* Trending Bar skeleton */}
          <div className="min-w-0 mt-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-[18px] w-[18px] text-accent/20 fill-current" />
                  <span className="text-[15px] font-black leading-tight text-muted-foreground/35">{labelTrending}</span>
                </div>
                <div className="flex gap-1">
                  <div className="h-6 w-6 rounded-full bg-muted" />
                  <div className="h-6 w-6 rounded-full bg-muted" />
                </div>
              </div>
              <div className="flex divide-x divide-border px-1 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 px-3.5 py-1 shrink-0 w-[240px] md:w-[280px]">
                    <div className="h-8 w-4 rounded bg-muted" />
                    <div className="h-[40px] w-[56px] shrink-0 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-3/4 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rajya Samachar / State News skeleton */}
          <div className="min-w-0 mt-2">
            <div className="flex items-center justify-between mb-1 border-b border-border pb-1">
              <span className="text-[18px] md:text-[20px] font-black leading-tight text-muted-foreground/35">{labelStateNews}</span>
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex h-[98px] gap-2 rounded border border-border bg-card p-1.5 shadow-sm">
                  <div className="h-full w-[82px] shrink-0 rounded bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT WIDGETS skeleton */}
        <div className="flex flex-col gap-1.5 w-full lg:w-[280px]">
          {/* Live TV Widget Skeleton */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between bg-accent/20 px-3 py-1.5">
              <span className="text-xs md:text-sm font-black text-muted-foreground/30 uppercase tracking-wide">{labelLiveTV}</span>
              <div className="h-4 w-12 rounded bg-muted" />
            </div>
            <div className="relative aspect-[4/3] bg-muted" />
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="h-6 w-24 rounded bg-muted" />
              <div className="h-6 w-16 rounded bg-muted" />
            </div>
          </div>

          {/* Weather Widget Skeleton */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
              <span className="text-xs md:text-sm font-black text-muted-foreground/30">{labelWeather}</span>
            </div>
            <div className="rounded-2xl border border-border/80 bg-white/95 p-3 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
                <div className="h-8 w-12 rounded bg-muted" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="h-8 rounded-xl bg-slate-50" />
                <div className="h-8 rounded-xl bg-slate-50" />
                <div className="h-8 rounded-xl bg-slate-50" />
              </div>
            </div>
          </div>

          {/* EPaper Widget Skeleton */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-1 mb-1">
              <span className="text-xs md:text-sm font-black text-muted-foreground/30">{labelEPaper}</span>
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="flex gap-3">
              <div className="h-[90px] w-[80px] shrink-0 rounded bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-6 w-24 rounded bg-muted mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
