'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ExternalLink, Play, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublicAdBySection, getPublicTributes, TributeItem } from '@/lib/api';
import TributeCard from '@/components/tributes/TributeCard';
import type { Language } from '@/types';

export interface SidebarAdBannerProps {
  slot: 'SIDEBAR_HERO_TOP' | 'SIDEBAR_GUJARAT' | 'SIDEBAR_WORLD' | 'SIDEBAR_POPULAR';
  language?: Language;
  fallbackTitleGu: string;
  fallbackTitleEn: string;
  fallbackTagGu: string;
  fallbackTagEn: string;
  fallbackCtaGu: string;
  fallbackCtaEn: string;
  fallbackGradient?: string;
  minHeight?: number;
  className?: string;
  enableTributeSlides?: boolean;
}

type SlideItem =
  | { type: 'AD'; data: any }
  | { type: 'BIRTHDAY'; data: TributeItem }
  | { type: 'SHRADHANJALI'; data: TributeItem };

export default function SidebarAdBanner({
  slot,
  language = 'gu',
  fallbackTitleGu,
  fallbackTitleEn,
  fallbackTagGu,
  fallbackTagEn,
  fallbackCtaGu,
  fallbackCtaEn,
  fallbackGradient = 'linear-gradient(135deg,#FF6B35,#C81D25)',
  minHeight = 180,
  className = '',
  enableTributeSlides = true,
}: SidebarAdBannerProps) {
  // Only allow birthday & shradhanjali tributes in the main home page first ad (SIDEBAR_HERO_TOP)
  const allowTributes = Boolean(enableTributeSlides && slot === 'SIDEBAR_HERO_TOP');

  const [adData, setAdData] = useState<any>(null);
  const [tributes, setTributes] = useState<{ birthdays: TributeItem[]; shradhanjalis: TributeItem[] }>({
    birthdays: [],
    shradhanjalis: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getPublicAdBySection(slot),
      allowTributes ? getPublicTributes() : Promise.resolve({ birthdays: [], shradhanjalis: [], all: [] }),
    ]).then(([adRes, tributesRes]) => {
      if (isMounted) {
        setAdData(adRes);
        if (tributesRes && allowTributes) {
          setTributes({
            birthdays: tributesRes.birthdays || [],
            shradhanjalis: tributesRes.shradhanjalis || [],
          });
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slot, allowTributes]);

  // Construct Slide Sequence:
  // 1. First: Ad
  // 2. If have birthday: show Birthday(s)
  // 3. If have shradhanjali: after that show Shradhanjali(s)
  // Strictly restricted to SIDEBAR_HERO_TOP only
  const slides: SlideItem[] = [{ type: 'AD', data: adData }];

  if (allowTributes) {
    if (tributes.birthdays && tributes.birthdays.length > 0) {
      tributes.birthdays.forEach((b) => {
        slides.push({ type: 'BIRTHDAY', data: b });
      });
    }
    if (tributes.shradhanjalis && tributes.shradhanjalis.length > 0) {
      tributes.shradhanjalis.forEach((s) => {
        slides.push({ type: 'SHRADHANJALI', data: s });
      });
    }
  }

  // Auto-play sliding interval (5 seconds)
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isHovered]);

  // Ensure currentSlideIndex stays valid if slides change
  const activeIndex = currentSlideIndex >= slides.length ? 0 : currentSlideIndex;
  const currentSlide = slides[activeIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const hasCustomMedia =
    adData &&
    adData.isActive &&
    adData.image1 &&
    adData.image1.trim() !== '';

  const mediaUrl = hasCustomMedia ? adData.image1.trim() : '';
  const redirectLink = hasCustomMedia && adData.link1 ? adData.link1.trim() : '#';
  const mediaType = hasCustomMedia
    ? (adData.mediaType || 'IMAGE').toUpperCase()
    : 'IMAGE';

  const isVideo =
    mediaType === 'VIDEO' ||
    /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl) ||
    mediaUrl.includes('youtube.com') ||
    mediaUrl.includes('youtu.be');

  // Fallback Styled Card content
  const title = language === 'gu' ? fallbackTitleGu : fallbackTitleEn;
  const tag = language === 'gu' ? fallbackTagGu : fallbackTagEn;
  const cta = language === 'gu' ? fallbackCtaGu : fallbackCtaEn;

  // Header Title for current slide
  let headerLabel = language === 'gu' ? 'જાહેરાત' : 'Advertisement';
  if (currentSlide.type === 'BIRTHDAY') {
    headerLabel = language === 'gu' ? '🎂 જન્મદિવસની હાર્દિક શુભકામના' : '🎂 Birthday Wishes';
  } else if (currentSlide.type === 'SHRADHANJALI') {
    headerLabel = language === 'gu' ? '🕊️ ભાવપૂર્ણ શ્રદ્ધાંજલિ / સ્મૃતિ' : '🕊️ In Loving Memory';
  }

  // Render Ad Slide Content
  const renderAdContent = () => {
    if (hasCustomMedia) {
      return (
        <a
          href={redirectLink && redirectLink !== '#' ? redirectLink : undefined}
          target={redirectLink && redirectLink !== '#' ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="group relative flex flex-col w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-red-500/30 block"
          style={{ minHeight }}
        >
          {isVideo ? (
            <div className="relative w-full h-full min-h-[inherit] bg-black overflow-hidden flex items-center justify-center" style={{ minHeight }}>
              {mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? (
                <iframe
                  src={`${mediaUrl.replace('watch?v=', 'embed/')}?autoplay=1&mute=1&loop=1&playlist=${mediaUrl.split('v=')[1] || ''}`}
                  title="Advertisement Video"
                  className="w-full h-full pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {/* Overlay controls badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <VolumeX className="h-3 w-3 text-red-400" />
                <span>Video Ad</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full min-h-[inherit] overflow-hidden" style={{ minHeight }}>
              <Image
                src={mediaUrl}
                alt="Advertisement"
                fill
                unoptimized={mediaUrl.startsWith('http')}
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 320px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          )}

          {/* Top-Right AD Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm z-10">
            <span>AD</span>
            {redirectLink && redirectLink !== '#' && (
              <ExternalLink className="h-2.5 w-2.5 opacity-80" />
            )}
          </div>
        </a>
      );
    }

    // Default Fallback Styled Ad
    return (
      <div className="ad-inner w-full">
        <div
          className="ad-creative rounded-xl p-5 text-white flex flex-col justify-between shadow-sm relative overflow-hidden"
          style={{
            background: fallbackGradient.includes('linear-gradient')
              ? fallbackGradient
              : undefined,
            minHeight,
          }}
        >
          <div>
            <div className="ad-brand font-black text-xl uppercase tracking-wide select-none">
              {title}
            </div>
            <div className="ad-tag text-[13px] font-bold mt-2 leading-snug text-white/95">
              {tag}
            </div>
          </div>
          <button
            type="button"
            className="ad-cta bg-white text-slate-900 rounded-full px-5 py-2 text-[12px] font-black transition duration-200 hover:-translate-y-0.5 hover:shadow-lg w-max mt-4 shadow-sm"
          >
            {cta} ↗
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`ad-slot w-full relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Slide Category Header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider select-none truncate">
          {headerLabel}
        </p>

        {slides.length > 1 && (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 select-none">
            {activeIndex + 1} / {slides.length}
          </span>
        )}
      </div>

      {/* Main Slide Carousel Container */}
      <div className="relative w-full rounded-xl overflow-hidden group">
        {/* Active Slide Renderer */}
        <div className="w-full transition-opacity duration-300">
          {currentSlide.type === 'AD' ? (
            renderAdContent()
          ) : (
            <TributeCard tribute={currentSlide.data} minHeight={minHeight} />
          )}
        </div>

        {/* Carousel Prev/Next Arrow Buttons (Only when 2+ slides exist) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              type="button"
              aria-label="Previous Slide"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 cursor-pointer shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              aria-label="Next Slide"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 cursor-pointer shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Carousel Pagination Indicator Dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {slides.map((s, idx) => {
            const isActive = idx === activeIndex;
            let dotColor = 'bg-[#B3121B] dark:bg-red-500';
            if (s.type === 'BIRTHDAY') {
              dotColor = 'bg-amber-500 dark:bg-amber-400';
            } else if (s.type === 'SHRADHANJALI') {
              dotColor = 'bg-stone-600 dark:bg-stone-400';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `w-5 ${dotColor}`
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

