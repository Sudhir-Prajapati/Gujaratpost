'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getPublicReels } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';

function ReelsBadgeIcon({ className = "h-4 w-4 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H9l2 4H8L6 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zM8 17V9.5l7 3.75L8 17z" />
    </svg>
  );
}

interface ReelItem {
  id: string;
  type: string;
  heading: string;
  headingGu: string;
  headingHi: string;
  videoUrl: string | null;
  instaUrl: string | null;
  thumbnail?: string | null;
  views?: number;
}

const formatInstaViews = (views: number | undefined | null): string | null => {
  if (!views || views <= 0) return null;
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${Math.round(views / 1000)}K`;
  return `${views}`;
};

export function getReelThumbnail(reel: ReelItem): string | null {
  const url = (reel.videoUrl || reel.instaUrl || '').trim();
  const instaMatch = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
  const shortcode = instaMatch?.[1] || '';

  // Direct thumbnail URL (proxy Instagram CDN links)
  if (reel.thumbnail?.trim()) {
    const rawThumb = reel.thumbnail.trim();
    if (rawThumb.includes('instagram') || rawThumb.includes('fbcdn.net') || shortcode) {
      return `/api/instagram-image?url=${encodeURIComponent(rawThumb)}&shortcode=${shortcode}`;
    }
    return rawThumb;
  }

  if (!url) return null;

  // 1. YouTube video or shorts URL
  const ytId = safeYouTubeId(url);
  if (ytId && ytId !== url && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
    return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  }

  // 2. Instagram shortcode proxy
  if (shortcode) {
    return `/api/instagram-image?shortcode=${shortcode}`;
  }

  // 3. Direct image link
  if (/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url)) {
    return url;
  }

  return null;
}

function ReelCard({ reel, language, onReelClick }: { reel: ReelItem; language: string; onReelClick: (reel: ReelItem) => void }) {
  const displayTitle = language === 'gu' ? (reel.headingGu || reel.heading) : language === 'hi' ? (reel.headingHi || reel.heading) : reel.heading;
  const thumbUrl = getReelThumbnail(reel);
  const [imgFailed, setImgFailed] = useState(false);
  const viewsText = formatInstaViews(reel.views);

  const showImage = thumbUrl && !imgFailed;

  return (
    <div
      onClick={() => onReelClick(reel)}
      className="flex-none w-[140px] sm:w-[165px] cursor-pointer snap-start group select-none"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-900/90 dark:border-slate-800 bg-muted shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
        {/* Top Badge Icon */}
        <div className="absolute top-2.5 left-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#B3121B] text-white shadow-md">
          <ReelsBadgeIcon className="h-3.5 w-3.5 text-white" />
        </div>

        {/* Thumbnail Image OR Instagram Gradient Background */}
        {showImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl}
              alt={displayTitle || 'Reel'}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgFailed(true)}
              loading="lazy"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10" />
            {/* Center Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10 opacity-90 group-hover:opacity-100 transition-opacity">
              <span className="w-10 h-10 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-lg border border-white/20 transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current ml-0.5" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            {reel.type === 'VIDEO' ? (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-1" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            ) : (
              <ReelsBadgeIcon className="h-12 w-12 text-white/30" />
            )}
          </div>
        )}

        {/* Bottom Title Container Box */}
        <div className="absolute bottom-2 inset-x-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-xl p-2.5 flex items-center justify-between shadow-lg border border-slate-100 dark:border-slate-800 z-20">
          <div className="flex flex-col min-w-0 flex-1 pr-1">
            <div className="flex items-center gap-1 mb-0.5">
              <ReelsBadgeIcon className="h-3 w-3 text-[#B3121B] shrink-0" />
              {viewsText && (
                <span className="text-[10px] font-extrabold text-[#B3121B]">{viewsText} views</span>
              )}
            </div>
            <p className="text-[11px] sm:text-[12px] font-black leading-tight text-slate-900 dark:text-white line-clamp-2">
              {displayTitle || reel.heading}
            </p>
          </div>
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#B3121B] text-white shrink-0 ml-1 shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-[12px] font-black leading-none">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

const DEMO_REELS: ReelItem[] = [
  {
    id: 'demo-1',
    type: 'VIDEO',
    heading: 'Gujarat Post Daily News Highlights',
    headingGu: 'ગુજરાત પોસ્ટ સમાચાર વાયરલ અપડેટ્સ',
    headingHi: 'गुजरात पोस्ट समाचार अपडेट्स',
    videoUrl: 'https://www.youtube.com/watch?v=sA6BrUmBXiA',
    instaUrl: 'https://www.instagram.com/gujaratpostnews',
  },
  {
    id: 'demo-2',
    type: 'VIDEO',
    heading: 'Breaking Politics & City News',
    headingGu: 'ગાંધીનગર રાજકારણ તાજા વાયરલ દ્રશ્યો',
    headingHi: 'गांधीनगर राजनीति ताजा समाचार',
    videoUrl: 'https://www.youtube.com/watch?v=rQHoqCTiQvI',
    instaUrl: 'https://www.instagram.com/gujaratpostnews',
  },
  {
    id: 'demo-3',
    type: 'VIDEO',
    heading: 'Live Weather & Special Report',
    headingGu: 'ગુજરાત હવામાન તથા વિશેષ ન્યૂઝ રિલ',
    headingHi: 'गुजरात मौसम तथा विशेष रिपोर्ट',
    videoUrl: 'https://www.youtube.com/watch?v=WF2Kuec5HV0',
    instaUrl: 'https://www.instagram.com/gujaratpostnews',
  },
];

export default function InstagramStories({ initialReels }: { initialReels?: ReelItem[] }) {
  const { language } = useApp();
  const [reels, setReels] = useState<ReelItem[]>(initialReels || []);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    // Only fetch if no initial reels were provided server-side
    if (initialReels && initialReels.length > 0) return;
    getPublicReels().then((res) => {
      if (res && res.length > 0) {
        setReels(res);
      }
    });
  }, []);

  const updateArrows = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  // Continuous smooth 60fps auto-scroll loop (like YouTube Shorts)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || reels.length === 0) return;

    updateArrows();

    let animId: number;
    let lastTime = performance.now();
    const SPEED = 40; // pixels per second for smooth drifting

    const scrollStep = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      if (!isPausedRef.current && el) {
        scrollPosRef.current += (SPEED * dt) / 1000;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (scrollPosRef.current >= maxScroll && maxScroll > 0) {
          scrollPosRef.current = 0;
        }
        el.scrollLeft = scrollPosRef.current;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);

    const handleNativeScroll = () => {
      if (el) {
        scrollPosRef.current = el.scrollLeft;
        updateArrows();
      }
    };

    el.addEventListener('scroll', handleNativeScroll, { passive: true });
    window.addEventListener('resize', updateArrows);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('scroll', handleNativeScroll);
      window.removeEventListener('resize', updateArrows);
    };
  }, [reels, updateArrows]);

  // Smooth button scroll like YouTube Shorts
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isPausedRef.current = true;
    const scrollAmount = el.clientWidth * 0.75;
    const target = Math.max(0, Math.min(
      el.scrollWidth - el.clientWidth,
      direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount
    ));
    el.scrollTo({ left: target, behavior: 'smooth' });
    scrollPosRef.current = target;
    setShowLeftArrow(target > 10);
    setShowRightArrow(target < el.scrollWidth - el.clientWidth - 10);

    setTimeout(() => {
      if (el) scrollPosRef.current = el.scrollLeft;
      isPausedRef.current = false;
    }, 700);
  };

  const handleReelClick = (reel: ReelItem) => {
    const url = reel.type === 'VIDEO' ? reel.videoUrl : reel.instaUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (reels.length === 0) return null;

  const displayList = reels.length > 0 ? [...reels, ...reels] : [];

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-8 mb-6 relative overflow-hidden select-none">
      <div className="relative">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-4">
          <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
            {language === 'gu' ? 'ઇન્સ્ટાગ્રામ રિલ્સ' : language === 'hi' ? 'इन्स्टाग्राम रीલ્સ' : 'Instagram Reels'}
          </span>
          <a
            href="https://www.instagram.com/gujaratpost.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
          >
            {language === 'gu' ? 'વધુ રિલ્સ →' : 'More →'}
          </a>
        </div>

        {/* Horizontal Grid Scroll Container with YouTube Shorts-Style Smooth Auto-Scroll */}
        <div
          className="relative group/slider-wrap"
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => { isPausedRef.current = false; }}
          onTouchStart={() => { isPausedRef.current = true; }}
          onTouchEnd={() => { isPausedRef.current = false; }}
        >
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white text-[#B3121B] dark:bg-slate-900 dark:text-white flex items-center justify-center shadow-2xl border border-slate-200 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 stroke-[3]" />
            </button>
          )}

          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white text-[#B3121B] dark:bg-slate-900 dark:text-white flex items-center justify-center shadow-2xl border border-slate-200 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 stroke-[3]" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 py-1"
          >
            {reels.map((reel) => {
              const displayTitle = language === 'gu' ? (reel.headingGu || reel.heading) : language === 'hi' ? (reel.headingHi || reel.heading) : reel.heading;
              const videoSrc = reel.videoUrl || reel.instaUrl;

              // Extract Instagram reel embed URL if present
              let instaEmbedUrl: string | null = null;
              if (videoSrc && (videoSrc.includes('instagram.com/reel/') || videoSrc.includes('instagram.com/p/') || videoSrc.includes('instagram.com/tv/'))) {
                const match = videoSrc.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
                if (match && match[1]) {
                  instaEmbedUrl = `https://www.instagram.com/p/${match[1]}/embed`;
                }
              }

              // Extract YouTube embed URL if present
              let ytEmbedUrl: string | null = null;
              if (videoSrc && (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be'))) {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
                const match = videoSrc.match(regExp);
                if (match && match[2] && match[2].length === 11) {
                  ytEmbedUrl = `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}&controls=0&modestbranding=1&rel=0`;
                }
              }

              // Check if URL is a direct video file (mp4, webm, uploads, blob, etc.)
              const isDirectVideo = videoSrc && (
                videoSrc.endsWith('.mp4') ||
                videoSrc.endsWith('.webm') ||
                videoSrc.endsWith('.ogg') ||
                videoSrc.includes('/uploads/') ||
                videoSrc.startsWith('blob:') ||
                videoSrc.startsWith('data:video/')
              );

              return (
                <div
                  key={reel.id}
                  onClick={() => handleReelClick(reel)}
                  className="flex-none w-[140px] sm:w-[165px] cursor-pointer snap-start group"
                >
                  <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-900/90 dark:border-slate-800 bg-slate-950 shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
                    <div className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#B3121B] text-white shadow-md">
                      <ReelsBadgeIcon className="h-3.5 w-3.5 text-white" />
                    </div>

                    {/* Render Reel Video (HTML5 Video, Instagram Embed, YouTube Shorts, or Dark Video Cover) */}
                    {isDirectVideo ? (
                      <video
                        src={videoSrc!}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : instaEmbedUrl ? (
                      <iframe
                        src={instaEmbedUrl}
                        className="absolute inset-0 h-[140%] w-[120%] -top-[20%] -left-[10%] pointer-events-none object-cover border-0"
                        allow="autoplay; encrypted-media"
                        title={displayTitle}
                      />
                    ) : ytEmbedUrl ? (
                      <iframe
                        src={ytEmbedUrl}
                        className="absolute inset-0 h-full w-full pointer-events-none border-0"
                        allow="autoplay; encrypted-media"
                        title={displayTitle}
                      />
                    ) : (
                      /* Dark sleek video cover card - NO ORANGE GRADIENT */
                      <div className="absolute inset-0 h-full w-full bg-slate-900 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-slate-900/70 to-black/40" />
                        <div className="relative z-10 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border border-white/30 group-hover:bg-[#B3121B] transition-colors">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-0.5" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Bottom Title Container Box */}
                    <div className="absolute bottom-2 inset-x-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-xl p-2.5 flex items-center justify-between shadow-lg border border-slate-100 dark:border-slate-800 z-10">
                      <div className="flex flex-col min-w-0 flex-1 pr-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <ReelsBadgeIcon className="h-3 w-3 text-[#B3121B] shrink-0" />
                        </div>
                        <p className="text-[11px] sm:text-[12px] font-black leading-tight text-slate-900 dark:text-white line-clamp-2">
                          {displayTitle || reel.heading}
                        </p>
                      </div>
                      <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#B3121B] text-white shrink-0 ml-1 shadow-sm group-hover:scale-105 transition-transform">
                        <span className="text-[12px] font-black leading-none">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Follow us on Instagram Row */}
        <div className="relative flex items-center justify-center mt-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-red-200 dark:border-red-950/40" />
          </div>
          <a
            href="https://www.instagram.com/gujaratpost.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-2.5 shadow-sm text-slate-900 dark:text-white font-black text-[13px] md:text-[14px] hover:border-[#B3121B] hover:text-[#B3121B] transition-all select-none"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#B3121B] stroke-[2]" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span>{language === 'gu' ? 'અમને ઇન્સ્ટાગ્રામ પર ફોલો કરો' : language === 'hi' ? 'हमें इंस्टाग्राम पर फॉलो करें' : 'Follow us on Instagram'}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
