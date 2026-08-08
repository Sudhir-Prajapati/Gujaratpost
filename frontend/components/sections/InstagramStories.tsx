'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getPublicReels } from '@/lib/api';

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
}

export default function InstagramStories() {
  const { language } = useApp();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
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

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleReelClick = (reel: ReelItem) => {
    const url = reel.type === 'VIDEO' ? reel.videoUrl : reel.instaUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (reels.length === 0) return null;

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-8 mb-6 relative overflow-hidden">
      <div className="relative">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-4">
          <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
            {language === 'gu' ? 'ઇન્સ્ટાગ્રામ રિલ્સ' : language === 'hi' ? 'इन्स्टाग्राम रील्स' : 'Instagram Reels'}
          </span>
          <a
            href="https://www.instagram.com/gujaratpostnews"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
          >
            {language === 'gu' ? 'વધુ રિલ્સ →' : 'More →'}
          </a>
        </div>

        {/* Horizontal Grid Scroll */}
        <div className="relative group/slider-wrap">
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60 transition-all duration-200 shadow-md backdrop-blur-sm cursor-pointer border-0"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}

          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60 transition-all duration-200 shadow-md backdrop-blur-sm cursor-pointer border-0"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
          >
            {reels.map((reel) => {
              const displayTitle = language === 'gu' ? reel.headingGu : language === 'hi' ? reel.headingHi : reel.heading;
              return (
                <div
                  key={reel.id}
                  onClick={() => handleReelClick(reel)}
                  className="flex-none w-[140px] sm:w-[165px] cursor-pointer snap-start group"
                >
                  <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-900/90 dark:border-slate-800 bg-muted shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
                    <div className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#B3121B] text-white shadow-md">
                      <ReelsBadgeIcon className="h-3.5 w-3.5 text-white" />
                    </div>

                    {/* Gradient Background since there is no thumbnail */}
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
            href="https://www.instagram.com/gujaratpostnews"
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
