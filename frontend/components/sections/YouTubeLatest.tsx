'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Play, ExternalLink, Bell, RefreshCw, AlertCircle, X, ChevronLeft, ChevronRight, Flame, Check } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

function YoutubeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface VideoItem {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  videoUrl: string;
}

// Stable mock duration generator based on video ID to make them consistent
const getMockDuration = (videoId: string): string => {
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const mins = Math.abs(hash % 12) + 2; // 2-13 mins
  const secs = Math.abs(hash % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Stable mock view count generator based on video ID to make them consistent
const getMockViews = (videoId: string): string => {
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const base = Math.abs(hash % 900) + 10; // 10-910
  if (base > 500) {
    const millions = (base / 500).toFixed(1);
    return `${millions}M views`;
  }
  return `${base}K views`;
};

const FALLBACK_VIDEOS: VideoItem[] = [
  {
    id: 'sA6BrUmBXiA',
    title: 'ધી સાબરકાંઠા જિલ્લા સહકારી ખરીદ વેચાણ સંઘ બન્યો ભ્રષ્ટાચારનો અડ્ડો ! આવી રીતે થાય છે લાખોની ઉચાપત',
    publishedAt: '2026-06-10T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/sA6BrUmBXiA/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=sA6BrUmBXiA',
  },
  {
    id: 'rQHoqCTiQvI',
    title: 'કપડવંજ TDO કચેરીમાં ભ્રષ્ટાચારનો સડો, સાંભળો- વિસ્તરણ અધિકારીએ ગરીબોને લૂંટવા વચેટિયાને આપ્યો  આદેશ',
    publishedAt: '2026-06-10T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/rQHoqCTiQvI/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=rQHoqCTiQvI',
  },
  {
    id: 'WF2Kuec5HV0',
    title: 'વડોદરાના AAP નેતાનું પાપ, ચાર વર્ષ સુધી પક્ષની મહિલા સાથે દુષ્કર્મ આચર્યું, અશ્લિલ વીડિયો બનાવ્યાં',
    publishedAt: '2026-06-03T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/WF2Kuec5HV0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=WF2Kuec5HV0',
  },
  {
    id: 'LDDtOMwdJ_0',
    title: 'રાજકોટમાં IPS એ પત્રકારની ગુદામાં પ્રવેશ કર્યો ? આ સિનિયર પત્રકારે સંઘવીને કેમ નિષ્ફળ કહ્યાં !',
    publishedAt: '2026-04-01T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/LDDtOMwdJ_0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=LDDtOMwdJ_0',
  },
  {
    id: '-iXZuFoHqiw',
    title: 'સંમેલન SPG નું કે ભાજપનું ? નીતિન પટેલે ભાજપની વાહવાહી કરી, કોઇએ કહ્યું  કે મોદી ભક્તોના મગજ બંધ છે',
    publishedAt: '2026-04-01T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/-iXZuFoHqiw/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=-iXZuFoHqiw',
  },
  {
    id: 'uJalvs-jgFc',
    title: 'ભાજપ સરકારના ભુક્કા કાઢી નાખ્યાં, સાણંદ દારુ પાર્ટી મુદ્દે શંકરસિંહ વાઘેલા તો સરકાર સામે બગડ્યાં',
    publishedAt: '2026-03-01T05:34:27.000Z',
    thumbnail: 'https://i.ytimg.com/vi/uJalvs-jgFc/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=uJalvs-jgFc',
  }
];

export default function YouTubeLatest() {
  const { language } = useApp();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const fetchVideos = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/live/youtube', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json() as { videos: VideoItem[] };
        setVideos(data.videos);
        setError(null);
      } else {
        setVideos(FALLBACK_VIDEOS);
        setError(null);
      }
    } catch {
      setVideos(FALLBACK_VIDEOS);
      setError(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const updateArrows = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // Show left arrow if scrolled to the right
    setShowLeftArrow(el.scrollLeft > 10);
    // Show right arrow if there is still content to scroll on the right
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve();
      if (active) {
        void fetchVideos();
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [fetchVideos]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    
    // Run update right away and attach listeners
    updateArrows();
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [videos, loading, updateArrows]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Helper to calculate relative time
  const getRelativeTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) {
        return getLocalized(language, {
          en: `${diffMins}m ago`,
          gu: `${diffMins} મિનિટ પહેલા`,
          hi: `${diffMins} मिनट पहले`
        });
      } else if (diffHours < 24) {
        return getLocalized(language, {
          en: `${diffHours}h ago`,
          gu: `${diffHours} કલાક પહેલા`,
          hi: `${diffHours} घंटे पहले`
        });
      } else {
        return getLocalized(language, {
          en: `${diffDays}d ago`,
          gu: `${diffDays} દિવસ પહેલા`,
          hi: `${diffDays} दिन पहले`
        });
      }
    } catch {
      return '';
    }
  };

  return (
    <section className="bg-card border-y border-border py-8 relative overflow-hidden">
      {/* Background Glows for Premium Aesthetic */}
      <div className="pointer-events-none absolute -left-40 top-0 h-72 w-72 rounded-full bg-red-600/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-red-600/5 blur-3xl" />

      <div className="mx-auto max-w-screen-xl px-4 relative">
        {/* Header Block */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ff0000] text-white shadow-lg shadow-red-500/20">
                <YoutubeIcon className="h-6 w-6 fill-current" />
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground md:text-2xl">
                {getLocalized(language, { en: 'YouTube Latest Videos', gu: 'તાજેતરના યૂટ્યૂબ વીડિયો', hi: 'नवीनतम यूट्यूब वीडियो' })}
              </h2>
            </div>
            
            {/* Live & Latest Updates badge inline */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-[#ff0000] dark:bg-red-950/20 dark:text-red-400">
              <Flame className="h-3.5 w-3.5 fill-current animate-pulse" />
              <span>{getLocalized(language, { en: 'Live & Latest Updates', gu: 'લાઇવ અને તાજા સમાચાર', hi: 'लाइव और ताजा अपडेट' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void fetchVideos(true)}
              disabled={refreshing || loading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-bold text-foreground transition hover:bg-muted disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {getLocalized(language, { en: 'Refresh', gu: 'રિફ્રેશ', hi: 'रीफ्रेश' })}
            </button>

            <a
              href="https://www.youtube.com/@Gujaratpostnews"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-black text-foreground shadow-sm hover:border-[#ff0000]/35 hover:text-[#ff0000] transition"
            >
              {getLocalized(language, { en: 'View all on YouTube', gu: 'યૂટ્યૂબ પર બધા જુઓ', hi: 'यूट्यूब पर सभी देखें' })}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://www.youtube.com/@Gujaratpostnews?sub_confirmation=1"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#ff0000] px-4 text-xs font-black text-white shadow-md shadow-red-950/20 hover:bg-red-600 transition"
            >
              <Bell className="h-3.5 w-3.5" />
              {getLocalized(language, { en: 'Subscribe', gu: 'સબસ્ક્રાઇબ', hi: 'सब्सक्राइब' })}
            </a>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        {/* Slider Container Wrapper */}
        <div className="relative group/slider-wrap">
          {/* Left Arrow Button */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-3 sm:-left-6 top-[80px] sm:top-[90px] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl text-foreground hover:bg-white dark:hover:bg-slate-950 hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
          )}

          {/* Right Arrow Button */}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-3 sm:-right-6 top-[80px] sm:top-[90px] z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl text-foreground hover:bg-white dark:hover:bg-slate-950 hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 stroke-[2.5]" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4"
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-none w-[280px] sm:w-[320px] rounded-2xl border border-border bg-card overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-video w-full bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                    <div className="h-3 w-1/3 rounded bg-muted pt-2" />
                  </div>
                </div>
              ))
            ) : (
              videos.map((video) => {
                const duration = getMockDuration(video.id);
                const views = getMockViews(video.id);
                return (
                  <article
                    key={video.id}
                    onClick={() => setSelectedVideoId(video.id)}
                    className="group flex-none w-[280px] sm:w-[320px] snap-start flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition hover:border-[#ff0000]/30 cursor-pointer"
                  >
                    {/* Thumbnail container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Duration badge at bottom-right */}
                      <span className="absolute bottom-2.5 right-2.5 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wider">
                        {duration}
                      </span>
                      {/* Glassmorphic Play Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff0000] text-white shadow-lg transition-transform duration-300 scale-90 group-hover:scale-100">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </span>
                      </div>
                    </div>

                    {/* Info Container */}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-[#ff0000] transition-colors h-[2.5rem]">
                        {video.title}
                      </h3>
                      
                      {/* Channel Row with Verified Badge */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <span>Gujarat Post</span>
                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground">
                          <Check className="h-2.5 w-2.5 stroke-[4]" />
                        </span>
                      </div>
                      
                      {/* Views and time */}
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground/80 font-medium font-mono">
                        <span>{views}</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <span>{getRelativeTime(video.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Video Video Player Modal */}
      {selectedVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedVideoId(null)} />
          
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 z-10 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedVideoId(null)}
              className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Video Player Embed */}
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0&modestbranding=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
