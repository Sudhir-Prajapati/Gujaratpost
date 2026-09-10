'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
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
  fixedHeight?: number;
  className?: string;
  enableTributeSlides?: boolean;
}

type SlideItem =
  | { type: 'AD'; data: { image?: string; link?: string; mediaType?: string; title?: string } | null }
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
  minHeight = 210,
  fixedHeight,
  className = '',
  enableTributeSlides = true,
}: SidebarAdBannerProps) {
  // Lock the banner height so changing slides NEVER causes the container size to jump
  const bannerHeight = fixedHeight || (minHeight ? Math.max(minHeight, 210) : 210);

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
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [slot, allowTributes]);

  // Construct Slide Sequence:
  // 1. All available ad images (image1, image2, image3)
  // 2. If have birthday: show Birthday(s)
  // 3. If have shradhanjali: after that show Shradhanjali(s)
  const slides: SlideItem[] = [];

  const adItems: { image: string; link: string; mediaType?: string; title?: string }[] = [];
  if (adData && adData.isActive) {
    if (adData.image1 && adData.image1.trim() !== '') {
      adItems.push({
        image: adData.image1.trim(),
        link: adData.link1 ? adData.link1.trim() : '#',
        mediaType: adData.mediaType,
        title: adData.title,
      });
    }
    if (adData.image2 && adData.image2.trim() !== '') {
      adItems.push({
        image: adData.image2.trim(),
        link: adData.link2 ? adData.link2.trim() : '#',
        mediaType: adData.mediaType,
        title: adData.title,
      });
    }
    if (adData.image3 && adData.image3.trim() !== '') {
      adItems.push({
        image: adData.image3.trim(),
        link: adData.link3 ? adData.link3.trim() : '#',
        mediaType: adData.mediaType,
        title: adData.title,
      });
    }
  }

  if (adItems.length > 0) {
    adItems.forEach((item) => slides.push({ type: 'AD', data: item }));
  }

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

  // Ensure currentSlideIndex stays valid if slides array changes
  const activeIndex = currentSlideIndex >= slides.length ? 0 : currentSlideIndex;
  const currentSlide = slides[activeIndex] || slides[0] || { type: 'AD', data: null };

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

  // Render Ad Slide Content (strictly locked to bannerHeight)
  const renderAdContent = (slideData: { image?: string; link?: string; mediaType?: string; title?: string } | null) => {
    const hasMedia = Boolean(slideData && slideData.image && slideData.image.trim() !== '');
    const mediaUrl = hasMedia ? slideData!.image!.trim() : '';
    const redirectLink = hasMedia && slideData!.link ? slideData!.link!.trim() : '#';
    const mediaType = hasMedia ? (slideData!.mediaType || 'IMAGE').toUpperCase() : 'IMAGE';

    const isVideo =
      mediaType === 'VIDEO' ||
      /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl) ||
      mediaUrl.includes('youtube.com') ||
      mediaUrl.includes('youtu.be');

    if (hasMedia) {
      return (
        <a
          href={redirectLink && redirectLink !== '#' ? redirectLink : undefined}
          target={redirectLink && redirectLink !== '#' ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="group relative flex flex-col w-full h-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-red-500/30 block select-none"
          style={{ height: bannerHeight }}
        >
          {isVideo ? (
            <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
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
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={mediaUrl}
                alt={slideData?.title || 'Advertisement'}
                fill
                unoptimized={mediaUrl.startsWith('http')}
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 340px"
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
      <div className="ad-inner w-full h-full" style={{ height: bannerHeight }}>
        <div
          className="ad-creative rounded-xl p-4 text-white flex flex-col justify-between shadow-sm relative overflow-hidden w-full h-full select-none"
          style={{
            background: fallbackGradient.includes('linear-gradient')
              ? fallbackGradient
              : undefined,
            height: bannerHeight,
          }}
        >
          <div>
            <div className="ad-brand font-black text-lg uppercase tracking-wide select-none">
              {title}
            </div>
            <div className="ad-tag text-[12px] font-bold mt-1.5 leading-snug text-white/95 line-clamp-2">
              {tag}
            </div>
          </div>
          <button
            type="button"
            className="ad-cta bg-white text-slate-900 rounded-full px-4 py-1.5 text-[11px] font-black transition duration-200 hover:-translate-y-0.5 hover:shadow-lg w-max mt-2 shadow-sm"
          >
            {cta} ↗
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`ad-slot w-full relative ${className}`}>
        <div className="flex items-center justify-between mb-1.5 px-1 h-5">
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div
          className="relative w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
          style={{ height: bannerHeight }}
        />
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      className={`ad-slot w-full relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Slide Category Header (Fixed Height to prevent shifts) */}
      <div className="flex items-center justify-between mb-1.5 px-1 h-5">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider select-none truncate">
          {headerLabel}
        </p>

        {slides.length > 1 && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 select-none">
            {activeIndex + 1} / {slides.length}
          </span>
        )}
      </div>

      {/* Main Slide Carousel Container (Strictly locked to bannerHeight) */}
      <div
        className="relative w-full rounded-xl overflow-hidden group shadow-sm"
        style={{ height: bannerHeight, minHeight: bannerHeight, maxHeight: bannerHeight }}
      >
        {/* Active Slide Renderer */}
        <div className="w-full h-full transition-opacity duration-300">
          {currentSlide.type === 'AD' ? (
            renderAdContent(currentSlide.data)
          ) : (
            <TributeCard
              tribute={currentSlide.data}
              className="w-full h-full"
              minHeight={bannerHeight}
            />
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

      {/* Carousel Pagination Indicator Dots (Fixed Height) */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2 h-3">
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
