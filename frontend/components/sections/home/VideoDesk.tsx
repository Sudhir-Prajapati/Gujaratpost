'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Play, ChevronLeft, ChevronRight, X, Clock, MoreVertical } from 'lucide-react';
import type { Language } from '@/types';
import { VIDEOS, formatViews, getLocalized } from '@/data';
import { safeYouTubeId } from '@/lib/youtube';
import { cleanVideoTitle } from './homeHelpers';

export default function VideoDesk({ videos, language, showShorts = true, onlyShorts = false }: { videos: typeof VIDEOS; language: Language; showShorts?: boolean; onlyShorts?: boolean }) {
  const [playId, setPlayId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const sidebarPaused = useRef(false);
  const isShortsPaused = useRef(false);

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [featuredHovered, setFeaturedHovered] = useState(false);

  // Auto-change the featured video every 2 seconds if no video is playing and not hovered
  useEffect(() => {
    if (playId || featuredHovered || !videos || !videos.length) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % Math.min(videos.length, 6));
    }, 2000);
    return () => clearInterval(interval);
  }, [playId, featuredHovered, videos]);

  // Auto-scroll the right sidebar using setInterval (checks ref each tick)
  useEffect(() => {
    const interval = setInterval(() => {
      const el = sidebarRef.current;
      if (!el || sidebarPaused.current) return;
      el.scrollTop += 1;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        el.scrollTop = 0;
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll the horizontal Shorts container smoothly (60fps continuous loop)
  useEffect(() => {
    if (!onlyShorts) return;
    let animId: number;
    const scrollStep = () => {
      const el = scrollContainerRef.current;
      if (el && !isShortsPaused.current && !playId) {
        el.scrollLeft += 0.8;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(scrollStep);
    };
    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [onlyShorts, playId]);

  const updateArrows = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

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
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSidebarClick = (youtubeId: string, id: string) => {
    setPlayId(youtubeId);
    const originalIndex = (videos || []).findIndex(vid => vid.id === id);
    if (originalIndex !== -1) {
      setFeaturedIndex(originalIndex);
    }
  };

  // Restrict VideoDesk to ONLY featured videos if featured videos exist in database/admin
  const featuredOnly = (videos || []).filter(v => (v as any).isFeatured);
  const sourcePool = featuredOnly.length > 0 ? featuredOnly : (videos || []);

  // Hard filter: exclude Shorts when showShorts=false (extra safety layer)
  const displayVideos = !showShorts
    ? sourcePool.filter(v => v.type === 'video' || !v.type)
    : onlyShorts
      ? sourcePool.filter(v => v.type === 'short')
      : sourcePool;

  if (!videos || !videos.length || !displayVideos.length) return null;

  const featuredVideo = displayVideos[featuredIndex % displayVideos.length];
  // Filter out current featured video from sidebar list to avoid duplication
  const sidebarVideos = displayVideos.filter((_, idx) => idx !== (featuredIndex % displayVideos.length)).slice(0, 15);

  if (onlyShorts) {
    const customShorts = [
      {
        id: 's1',
        categoryGu: 'હવામાન',
        categoryEn: 'Weather',
        titleGu: '60 સેકન્ડમાં વરસાદ એલર્ટ',
        viewsGu: '12K',
        duration: '0:60',
        isBannerCard: true,
        youtubeId: 'sA6BrUmBXiA'
      },
      {
        id: 's2',
        categoryGu: 'ગુજરાત',
        categoryEn: 'Gujarat',
        titleGu: 'ગુજરાત ટાઇટન્સની ટ્રેનિંગ મોમેન્ટ',
        viewsGu: '8.4K',
        duration: '0:45',
        image: '/assets/demo/3.jpg',
        youtubeId: 'rQHoqCTiQvI'
      },
      {
        id: 's3',
        categoryGu: 'બિઝનેસ',
        categoryEn: 'Business',
        titleGu: 'શેર બજારમાં ઐતિહાસિક ઉછાળો',
        viewsGu: '6.7K',
        duration: '0:40',
        image: '/assets/demo/5.jpg',
        youtubeId: 'WF2Kuec5HV0'
      },
      {
        id: 's4',
        categoryGu: 'લાઈફસ્ટાઈલ',
        categoryEn: 'Lifestyle',
        titleGu: 'ચોમાસામાં આરોગ્ય ટિપ્સ',
        viewsGu: '14.2K',
        duration: '0:40',
        image: '/assets/demo/6.jpg',
        youtubeId: 'LDDtOMwdJ_0'
      },
      {
        id: 's5',
        categoryGu: 'ફિટનેસ',
        categoryEn: 'Fitness',
        titleGu: 'યોગા અને માનસિક શાંતિ',
        viewsGu: '9.3K',
        duration: '0:35',
        image: '/assets/demo/7.jpg',
        youtubeId: '-iXZuFoHqiw'
      },
      {
        id: 's6',
        categoryGu: 'ટેકનોલોજી',
        categoryEn: 'Technology',
        titleGu: 'નવા AI ટૂલ્સની શક્તિશાળી સુવિધાઓ',
        viewsGu: '7.1K',
        duration: '0:30',
        image: '/assets/demo/8.jpg',
        youtubeId: 'uJalvs-jgFc'
      },
      {
        id: 's7',
        categoryGu: 'સમાચાર',
        categoryEn: 'News',
        titleGu: 'નવરાત્રી સેટની એક્લુદ ક્લિપ',
        viewsGu: '11K',
        duration: '0:59',
        image: '/assets/demo/1.jpg',
        youtubeId: 'A_5vL-ngK4M'
      },
      {
        id: 's8',
        categoryGu: 'રાજકારણ',
        categoryEn: 'Politics',
        titleGu: 'વિધાનસભા ચોમાસુ સત્રના તાજા દ્રશ્યો',
        viewsGu: '15.8K',
        duration: '0:50',
        image: '/assets/demo/4.jpg',
        youtubeId: 'sA6BrUmBXiA'
      },
      {
        id: 's9',
        categoryGu: 'સ્પોર્ટ્સ',
        categoryEn: 'Sports',
        titleGu: 'ક્રિકેટ મેચની રોમાંચક પળો',
        viewsGu: '18.4K',
        duration: '0:42',
        image: '/assets/demo/2.jpg',
        youtubeId: 'rQHoqCTiQvI'
      },
      {
        id: 's10',
        categoryGu: 'મનોરંજન',
        categoryEn: 'Entertainment',
        titleGu: 'નવી ગુજરાતી ફિલ્મનું ટ્રેલર',
        viewsGu: '22.1K',
        duration: '0:48',
        image: '/assets/demo/6.jpg',
        youtubeId: 'WF2Kuec5HV0'
      },
      {
        id: 's11',
        categoryGu: 'શિક્ષણ',
        categoryEn: 'Education',
        titleGu: 'વિદ્યાર્થીઓ માટે સ્કોલરશિપ અપડેટ',
        viewsGu: '10.5K',
        duration: '0:38',
        image: '/assets/demo/3.jpg',
        youtubeId: 'LDDtOMwdJ_0'
      },
      {
        id: 's12',
        categoryGu: 'વાયરલ',
        categoryEn: 'Viral',
        titleGu: 'સોશિયલ મીડિયા પર વાયરલ થયેલો વીડિયો',
        viewsGu: '25.6K',
        duration: '0:33',
        image: '/assets/demo/7.jpg',
        youtubeId: '-iXZuFoHqiw'
      }
    ];

    return (
      <section className="mt-6">
        {/* Red Panel containing only Shorts */}
        <div className="w-full bg-[#B3121B] text-white rounded-sm px-5 md:px-8 py-6 border border-white/10 relative overflow-hidden shadow-lg">

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-5 select-none">
            <span className="bg-white/20 text-white font-black text-[12.5px] px-3.5 py-1.5 rounded-sm tracking-wide border border-white/25">
              {language === 'gu' ? 'શોર્ટ  વીડિયો' : language === 'hi' ? 'शॉर्ट  वीडियो' : 'Short Videos'}
            </span>
            <Link
              href="/shorts"
              className="text-white/95 font-extrabold text-[13px] md:text-[14px] hover:text-white hover:underline flex items-center gap-1"
            >
              {language === 'gu' ? 'વધુ શોર્ટ્સ →' : 'More Shorts →'}
            </Link>
          </div>

          {/* Shorts Strip */}
          <div className="relative z-10">
            <div className="relative">
              {/* Left arrow */}
              {showLeftArrow && (
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="absolute left-[-14px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-[#B3121B] flex items-center justify-center shadow-xl border border-slate-200 hover:scale-105 transition-transform"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6 stroke-[3]" />
                </button>
              )}

              {/* Scrollable list */}
              <div
                ref={scrollContainerRef}
                onScroll={updateArrows}
                onMouseEnter={() => { isShortsPaused.current = true; }}
                onMouseLeave={() => { isShortsPaused.current = false; }}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
              >
                {[...customShorts, ...customShorts].map((card, index) => (
                  <div
                    key={`${card.id}-${index}`}
                    className="group relative flex-shrink-0 w-[145px] sm:w-[165px] md:w-[175px] cursor-pointer"
                    onClick={() => setPlayId(card.youtubeId)}
                  >
                    {/* Vertical Card 9/16 matching Image 1 */}
                    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/15 shadow-md flex flex-col justify-between p-3 select-none">
                      {card.isBannerCard ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-[#800A11] via-[#5C060B] to-[#3B0306] flex flex-col justify-between p-3.5">
                          {/* Top row */}
                          <div className="flex items-center justify-between z-10">
                            <span className="bg-[#B3121B] text-white px-2.5 py-0.5 text-[10.5px] font-black rounded-full shadow-sm">
                              {language === 'gu' ? card.categoryGu : card.categoryEn}
                            </span>
                            <MoreVertical className="h-4 w-4 text-white/80" />
                          </div>

                          {/* Middle Alert Banner Text */}
                          <div className="my-auto text-left leading-tight py-2 z-10">
                            <h3 className="text-3xl font-black text-white drop-shadow">60</h3>
                            <h3 className="text-lg font-black text-white drop-shadow">સેકન્ડમાં</h3>
                            <h3 className="text-lg font-black text-[#B3121B] bg-white px-1.5 py-0.5 inline-block rounded-sm mt-0.5 shadow">વરસાદ</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <h3 className="text-lg font-black text-white drop-shadow">એલર્ટ</h3>
                              <span className="w-6 h-6 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow">
                                <Play className="h-3 w-3 fill-current ml-0.5" />
                              </span>
                            </div>
                          </div>

                          {/* Bottom metadata */}
                          <div className="z-10">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/90">
                              <Eye className="h-3 w-3" />
                              <span>{card.viewsGu} વ્યુ</span>
                              <span>|</span>
                              <Clock className="h-3 w-3" />
                              <span>{card.duration}</span>
                            </div>
                            <div className="h-1 w-4 bg-[#B3121B] rounded-full mt-1.5" />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Image */}
                          <Image
                            src={card.image || '/assets/demo/3.jpg'}
                            alt={card.titleGu}
                            fill
                            sizes="175px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                          {/* Top row */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="bg-[#B3121B] text-white px-2.5 py-0.5 text-[10.5px] font-black rounded-full shadow-sm">
                              {language === 'gu' ? card.categoryGu : card.categoryEn}
                            </span>
                            <MoreVertical className="h-4 w-4 text-white/80" />
                          </div>

                          {/* Center Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="w-11 h-11 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 border border-white/20">
                              <Play className="h-5 w-5 fill-current ml-0.5" />
                            </span>
                          </div>

                          {/* Bottom title & metadata */}
                          <div className="relative z-10 mt-auto">
                            <p className="text-white text-[12px] font-black leading-snug line-clamp-2 drop-shadow">
                              {card.titleGu}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-white/90 mt-1.5 drop-shadow">
                              <Eye className="h-3 w-3 text-white/80" />
                              <span>{card.viewsGu} વ્યુ</span>
                              <span>|</span>
                              <Clock className="h-3 w-3 text-white/80" />
                              <span>{card.duration}</span>
                            </div>
                            <div className="h-1 w-4 bg-[#B3121B] rounded-full mt-1.5" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right arrow */}
              {showRightArrow && (
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-[#B3121B] flex items-center justify-center shadow-xl border border-slate-200 hover:scale-105 transition-transform"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6 stroke-[3]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        {playId && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6"
            onClick={() => setPlayId(null)}
          >
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
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
                  src={`https://www.youtube.com/embed/${safeYouTubeId(playId)}?autoplay=1&rel=0`}
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

  return (
    <section className="mt-6">
      {/* ── Red Panel containing Videos ── */}
      <div className="w-full bg-[#B3121B] text-white rounded-sm px-5 md:px-8 pt-5 pb-5 border border-white/10 relative overflow-hidden shadow-lg">

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-white font-black text-[18px] md:text-[20px] select-none tracking-tight">
              {language === 'gu' ? 'વીડિયો' : 'Videos'}
            </span>
          </div>
          <Link
            href="/videos"
            className="text-white/95 font-extrabold text-[13px] md:text-[14px] hover:text-white hover:underline flex items-center gap-1"
          >
            {language === 'gu' ? 'વધુ જુઓ →' : 'See All →'}
          </Link>
        </div>

        {/* 2-Column Layout: Featured left, List right */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-stretch">

          {/* Left: Featured Video */}
          <div
            className="group flex flex-col cursor-pointer"
            onClick={() => setPlayId(featuredVideo.youtubeId)}
            onMouseEnter={() => setFeaturedHovered(true)}
            onMouseLeave={() => setFeaturedHovered(false)}
          >
            {/* Large thumbnail */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm bg-black/30 mb-3.5 shadow-inner border border-white/10">
              <Image
                key={featuredIndex}
                src={featuredVideo.thumbnail}
                alt={featuredVideo.titleGu}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02] animate-in fade-in duration-500"
              />
              {/* Large play button */}
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[54px] h-[54px] rounded-full bg-white/95 text-[#B3121B] flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110">
                <Play className="h-6 w-6 fill-current ml-0.5" />
              </span>
              {/* Duration badge */}
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-black px-2 py-0.5 rounded-sm">
                {featuredVideo.duration}
              </span>
            </div>

            {/* Title container with fixed exact height & clean titles */}
            <div className="h-[46px] md:h-[50px] overflow-hidden flex items-start mt-1">
              <h3 key={`title-${featuredIndex}`} className="font-extrabold text-[15px] md:text-[18px] leading-[1.35] text-white group-hover:underline transition-all line-clamp-2 animate-in fade-in duration-500">
                {cleanVideoTitle(getLocalized(language, { en: featuredVideo.title, gu: featuredVideo.titleGu || featuredVideo.title, hi: featuredVideo.titleHi || featuredVideo.title }))}
              </h3>
            </div>

            {/* Meta */}
            <div key={`meta-${featuredIndex}`} className="flex items-center gap-1.5 mt-2 text-[11.5px] text-white/70 font-semibold select-none animate-in fade-in duration-500">
              <Eye className="h-3.5 w-3.5" />
              <span>
                {formatViews(featuredVideo.views)} {language === 'gu' ? 'વ્યુઝ' : 'views'}
              </span>
              <span>·</span>
              <span>{featuredVideo.duration}</span>
            </div>
          </div>

          {/* Right: Sidebar container */}
          <div className="flex flex-col h-full min-w-0">
            {/* Sidebar video list */}
            <div
              ref={sidebarRef}
              onMouseEnter={() => { sidebarPaused.current = true; }}
              onMouseLeave={() => { sidebarPaused.current = false; }}
              className="flex flex-col divide-y divide-white/10 h-full max-h-[450px] overflow-y-auto p-3 pr-2 scrollbar-hide bg-black/15 rounded-sm"
            >
              {sidebarVideos.map((v) => (
                <div
                  key={v.id}
                  className="group flex gap-3 py-3.5 cursor-pointer first:pt-0"
                  onClick={() => handleSidebarClick(v.youtubeId, v.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-[68px] w-[108px] shrink-0 overflow-hidden rounded-sm bg-black/30 border border-white/10">
                    <Image
                      src={v.thumbnail}
                      alt={v.titleGu || v.title}
                      fill
                      sizes="108px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Mini play */}
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-[#B3121B] flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </span>
                    {/* Duration */}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                      {v.duration}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <div className="h-[36px] overflow-hidden flex items-start">
                      <h4 className="text-[13px] font-extrabold leading-[1.3] text-white group-hover:underline transition-all line-clamp-2">
                        {cleanVideoTitle(getLocalized(language, { en: v.title, gu: v.titleGu || v.title, hi: v.titleHi || v.title }))}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/65 font-semibold">
                      <span>{formatViews(v.views)}</span>
                      <span>·</span>
                      <span>{v.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Video Player Modal */}
      {playId && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 py-6"
          onClick={() => setPlayId(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
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
                src={`https://www.youtube.com/embed/${safeYouTubeId(playId)}?autoplay=1&rel=0`}
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
export { VideoDesk };

