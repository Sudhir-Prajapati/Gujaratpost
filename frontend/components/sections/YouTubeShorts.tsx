'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, X, ChevronLeft, ChevronRight, Eye, Clock } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';
import { getPublicVideos } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import { ConsentGate } from '@/components/consent/ConsentGate';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

interface ShortItem {
  id: string;
  youtubeId?: string;
  title: string;
  titleGu?: string;
  publishedAt?: string;
  thumbnail: string;
  videoUrl?: string;
  categoryGu?: string;
  categoryEn?: string;
  viewsGu?: string;
  duration?: string;
  isBannerCard?: boolean;
}

const CATEGORIES_GU = ['સમાચાર', 'ગુજરાત', 'રાજકારણ', 'બિઝનેસ', 'સ્પોર્ટ્સ', 'ટેકનોલોજી', 'મનોરંજન', 'ધર્મ', 'લાઈફસ્ટાઈલ'];
const CATEGORIES_EN = ['News', 'Gujarat', 'Politics', 'Business', 'Sports', 'Technology', 'Entertainment', 'Religion', 'Lifestyle'];

// Fallback Shorts matching project defaults and reference image
const DUMMY_SHORTS: ShortItem[] = [
  {
    id: 's1',
    categoryGu: 'સમાચાર',
    categoryEn: 'News',
    title: 'જમીનમાંથી નાણ 5M ભરીને રૂપિયા મળ્યાં...',
    titleGu: 'જમીનમાંથી નાણ 5M ભરીને રૂપિયા મળ્યાં...',
    viewsGu: '1.4K',
    duration: '0:58',
    isBannerCard: true,
    thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=sA6BrUmBXiA',
  },
  {
    id: 's2',
    categoryGu: 'ગુજરાત',
    categoryEn: 'Gujarat',
    title: 'આણંદમાં PSI ના પંથદ દિલી પટેલની કારમાંથી..',
    titleGu: 'આણંદમાં PSI ના પંથદ દિલી પટેલની કારમાંથી..',
    viewsGu: '1.3K',
    duration: '0:58',
    thumbnail: '/assets/demo/3.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=rQHoqCTiQvI',
  },
  {
    id: 's3',
    categoryGu: 'સમાચાર',
    categoryEn: 'News',
    title: 'પોલીસ તો ચોંકી ગઈ, વાહનમાં નીકળ્યાં...',
    titleGu: 'પોલીસ તો ચોંકી ગઈ, વાહનમાં નીકળ્યાં...',
    viewsGu: '1.2K',
    duration: '0:58',
    thumbnail: '/assets/demo/5.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=WF2Kuec5HV0',
  },
  {
    id: 's4',
    categoryGu: 'રાજકારણ',
    categoryEn: 'Politics',
    title: 'સરકાર અને રેન્જ IG વિરુદ્ધ કોંગ્રેસનો...',
    titleGu: 'સરકાર અને રેન્જ IG વિરુદ્ધ કોંગ્રેસનો...',
    viewsGu: '1.5K',
    duration: '0:58',
    thumbnail: '/assets/demo/6.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=LDDtOMwdJ_0',
  },
  {
    id: 's5',
    categoryGu: 'રાજકારણ',
    categoryEn: 'Politics',
    title: 'PM મોદીની ગાબ લડી, ખેડગેએ કહ્યું અને...',
    titleGu: 'PM મોદીની ગાબ લડી, ખેડગેએ કહ્યું અને...',
    viewsGu: '2.1K',
    duration: '0:58',
    thumbnail: '/assets/demo/7.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=-iXZuFoHqiw',
  },
  {
    id: 's6',
    categoryGu: 'ટેકનોલોજી',
    categoryEn: 'Technology',
    title: 'નવા AI ટૂલ્સની શક્તિશાળી સુવિધાઓ',
    titleGu: 'નવા AI ટૂલ્સની શક્તિશાળી સુવિધાઓ',
    viewsGu: '1.8K',
    duration: '0:45',
    thumbnail: '/assets/demo/8.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=uJalvs-jgFc',
  },
];

export default function YouTubeShorts() {
  const { language } = useApp();
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const isInViewportRef = useRef<boolean>(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [activeDot, setActiveDot] = useState<number>(0);

  const loadShortsData = useCallback(async () => {
    setLoading(true);
    try {
      const liveRes = await getPublicVideos('short');
      if (liveRes && liveRes.length > 0) {
        const seen = new Set<string>();
        const mapped: ShortItem[] = [];
        const sorted = [...liveRes].sort((a: any, b: any) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        let i = 0;
        for (const v of sorted) {
          const key = safeYouTubeId(v.youtubeId) || v.id;
          if (key && !seen.has(key)) {
            seen.add(key);
            let rawViews = v.views;
            if (!rawViews || rawViews === 500) {
              const vid = key;
              let hash = 0;
              for (let c = 0; c < vid.length; c++) {
                hash = (hash << 5) - hash + vid.charCodeAt(c);
                hash |= 0;
              }
              rawViews = Math.abs(hash % 450) + 35;
            }

            let viewsStr = `${rawViews}`;
            if (rawViews >= 1000000) {
              viewsStr = `${(rawViews / 1000000).toFixed(1)}M`;
            } else if (rawViews >= 1000) {
              viewsStr = `${(rawViews / 1000).toFixed(1)}K`;
            }

            // CRITICAL FIX: Use the actual video scene thumbnail (hqdefault.jpg),
            // NEVER oar2.jpg which baked in the top red headline banner and duplicate logo
            const thumbUrl = v.thumbnail && !v.thumbnail.includes('oar2.jpg')
              ? v.thumbnail
              : `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;

            mapped.push({
              id: key,
              title: v.titleGu || v.title,
              titleGu: v.titleGu || v.title,
              thumbnail: thumbUrl,
              videoUrl: `https://www.youtube.com/shorts/${key}`,
              categoryGu: CATEGORIES_GU[i % CATEGORIES_GU.length],
              categoryEn: CATEGORIES_EN[i % CATEGORIES_EN.length],
              viewsGu: viewsStr,
              duration: v.duration || '0:58',
            });
            i++;
            if (mapped.length >= 30) break;
          }
        }

        setShorts(mapped.length > 0 ? mapped : DUMMY_SHORTS);
      } else {
        setShorts(DUMMY_SHORTS);
      }
    } catch {
      setShorts(DUMMY_SHORTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShortsData();
  }, [loadShortsData]);

  // Track viewport visibility to pause autoplay when off-screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewportRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update arrow buttons and active dot indicator with passive, debounced scroll handling
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || loading || shorts.length === 0) return;

    let timeoutId: any;
    const handleScrollEvent = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setShowLeftArrow(el.scrollLeft > 15);
        setShowRightArrow(el.scrollLeft < maxScroll - 15);

        const firstCard = el.firstElementChild as HTMLElement;
        const cardWidth = firstCard?.offsetWidth || 215;
        const gap = 18;
        const totalStep = cardWidth + gap;
        if (totalStep > 0) {
          const dotIdx = Math.round(el.scrollLeft / totalStep) % 5;
          setActiveDot(Math.min(4, Math.max(0, dotIdx)));
        }
      }, 70);
    };

    el.addEventListener('scroll', handleScrollEvent, { passive: true });
    window.addEventListener('resize', handleScrollEvent);
    handleScrollEvent();

    return () => {
      el.removeEventListener('scroll', handleScrollEvent);
      window.removeEventListener('resize', handleScrollEvent);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, shorts.length]);

  // Smooth Autoplay Carousel (Clean 5s interval, NO 60fps RAF loop, zero jank or re-renders)
  useEffect(() => {
    if (loading || shorts.length <= 5) return;

    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el || isPausedRef.current || !isInViewportRef.current || document.hidden || selectedVideoId) return;

      const firstCard = el.firstElementChild as HTMLElement;
      const cardWidth = firstCard?.offsetWidth || 215;
      const gap = 18;
      const step = cardWidth + gap;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft + step >= maxScroll - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [loading, shorts.length, selectedVideoId]);

  // Previous and Next button click handlers using native smooth scrolling
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isPausedRef.current = true;

    const firstCard = el.firstElementChild as HTMLElement;
    const cardWidth = firstCard?.offsetWidth || 215;
    const gap = 18;
    const step = (cardWidth + gap) * (window.innerWidth < 768 ? 1 : 2);

    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });

    // Resume autoplay after user interaction
    setTimeout(() => {
      isPausedRef.current = false;
    }, 3500);
  };

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-screen-xl px-2.5 sm:px-4 py-2 sm:py-3 select-none" aria-label="Gujarat Post Shorts Section">
      {/* ─── OUTER CONTAINER: Premium White Card with Light Red Accent Border & Curved Ribbon ─── */}
      <div className="relative overflow-hidden w-full bg-[#FFFDFD] dark:bg-[#151722] rounded-[24px] sm:rounded-[28px] border-[1.5px] border-red-200/80 dark:border-white/10 shadow-[0_6px_30px_rgba(200,16,30,0.06)] dark:shadow-[0_6px_30px_rgba(0,0,0,0.45)] p-4 sm:p-6 md:p-7 transition-all">
        {/* Subtle Bottom-Right Red Curved Ribbon Wave (Matching Reference Image 2) */}
        <div
          className="pointer-events-none absolute -bottom-6 -right-6 w-52 sm:w-64 h-24 sm:h-32 bg-gradient-to-tl from-[#C8101E]/40 via-[#C8101E]/15 to-transparent rounded-full blur-xl opacity-80 select-none z-0"
          aria-hidden="true"
        />

        {/* ─── HEADER ROW: Logo + Divider + Shorts Title + Subtitle + All Shorts Button (Right Aligned on Mobile) ─── */}
        <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/5 mb-3.5 sm:mb-5">
          {/* Left: Brand and Title Group */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* 1. Official Gujarat Post Logo Asset */}
            <Link href="/" className="flex shrink-0 items-center">
              <div className="relative h-5 sm:h-7 md:h-8 w-20 sm:w-28 md:w-32 overflow-hidden">
                <Image
                  src="/assets/gujarat-post-logo.png"
                  alt="Gujarat Post"
                  fill
                  sizes="(max-width: 640px) 80px, 128px"
                  className="object-contain object-left"
                  priority
                  unoptimized
                />
              </div>
            </Link>

            {/* Vertical Divider Line */}
            <span className="inline-block h-4 sm:h-6 md:h-7 w-[1.5px] bg-slate-300 dark:bg-slate-700 shrink-0" aria-hidden="true" />

            {/* 2. Red YouTube Shorts Glyph + Gujarati Title: શોર્ટ્સ */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="relative flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-[#C8101E] drop-shadow-xs">
                  <path d="M17.77 10.32l-1.2-.5a3.86 3.86 0 00-4.9-2.31 3.94 3.94 0 00-2.34 4.95l.48 1.22-1.2.5a3.86 3.86 0 00-2.31 4.9 3.94 3.94 0 004.95 2.34l1.2-.5.48 1.22a3.86 3.86 0 004.9 2.31 3.94 3.94 0 002.34-4.95l-.48-1.22 1.2-.5a3.86 3.86 0 002.31-4.9 3.94 3.94 0 00-4.95-2.34l-1.2.5-.48-1.22a3.86 3.86 0 00-4.9-2.31 3.94 3.94 0 00-2.34 4.95l.48 1.22z" />
                  <polygon points="10 8.5 15.5 12 10 15.5 10 8.5" fill="#FFFFFF" />
                </svg>
              </div>

              <h2 className="text-lg sm:text-2xl md:text-[26px] font-black text-[#171B2D] dark:text-white tracking-tight">
                {getLocalized(language, { en: 'Shorts', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स' })}
              </h2>
            </div>

            {/* Vertical Divider Line */}
            <span className="hidden lg:inline-block h-6 sm:h-7 w-[1.5px] bg-slate-300 dark:bg-slate-700 shrink-0" aria-hidden="true" />

            {/* 3. Subtitle (Matching Reference Image) */}
            <p className="hidden lg:block text-xs sm:text-[13px] font-semibold text-[#64748B] dark:text-slate-400">
              {getLocalized(language, {
                en: 'Short videos of important events in Gujarat, India & World',
                gu: 'ગુજરાત, દેશ અને વિદેશની મહત્વની ઘટનાઓના ટૂંકા વીડિયો',
                hi: 'गुजरात, देश और विदेश की महत्वपूर्ण घटनाओं के छोटे वीडियो',
              })}
            </p>
          </div>

          {/* Right Button: બધા શોર્ટ્સ જુઓ → (Right-aligned in both mobile and desktop) */}
          <Link
            href="/shorts"
            className="shrink-0 ml-auto bg-[#C8101E] hover:bg-[#A80F19] text-white text-[11px] sm:text-xs md:text-sm font-black px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-1 whitespace-nowrap"
            title={getLocalized(language, { en: 'View All Shorts', gu: 'બધા શોર્ટ્સ જુઓ', hi: 'सभी शॉर्ट्स देखें' })}
          >
            <span>{getLocalized(language, { en: 'View All Shorts →', gu: 'બધા શોર્ટ્સ જુઓ →', hi: 'सभी शॉर्ट્સ देखें →' })}</span>
          </Link>
        </div>

        {/* ─── CAROUSEL SECTION WITH FLUID NATIVE SCROLL-SNAP (Zero Jank / Stutter) ─── */}
        <div className="relative">
          {/* Scroll Track: Native CSS scroll-snap with 18px gap, 5 cards on desktop */}
          <div
            ref={scrollContainerRef}
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
            onTouchStart={() => { isPausedRef.current = true; }}
            onTouchEnd={() => { isPausedRef.current = false; }}
            className="scrollbar-hide flex gap-4 sm:gap-[18px] overflow-x-auto py-1 scroll-smooth snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[175px] sm:w-[200px] md:w-[calc((100%-36px)/3)] lg:w-[calc((100%-72px)/5)] aspect-[9/16] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300 dark:border-slate-700 snap-start"
                />
              ))
            ) : (
              shorts.map((short, index) => {
                const shortYtId = safeYouTubeId(short.youtubeId || short.id);
                const progressPercent = Math.min(90, 35 + ((index * 17) % 50));

                return (
                  <Link
                    key={`${short.id}-${index}`}
                    href={shortYtId ? `/shorts?v=${shortYtId}` : '/shorts'}
                    className="group relative shrink-0 w-[175px] sm:w-[200px] md:w-[calc((100%-36px)/3)] lg:w-[calc((100%-72px)/5)] cursor-pointer select-none block snap-start"
                  >
                    {/* Card Body: 9:16 Portrait, Clean Thumbnail (NO top red headline banner) */}
                    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-800/80 dark:border-white/10 bg-black shadow-md transition-all duration-300 group-hover:shadow-[0_8px_24px_rgba(200,16,30,0.22)] group-hover:scale-[1.02]">
                      {/* Full Original Video Thumbnail (hqdefault.jpg centered - eliminates baked top banner) */}
                      <img
                        src={short.thumbnail}
                        alt={short.title}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('hqdefault.jpg')) {
                            target.src = `https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`;
                          }
                        }}
                        loading="lazy"
                      />

                      {/* Top Overlay Badges */}
                      <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-none">
                        {/* Top-Left: Small White Pill with Red Shorts Icon */}
                        <span className="bg-white/95 text-[#C8101E] text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#C8101E]">
                            <path d="M17.77 10.32l-1.2-.5a3.86 3.86 0 00-4.9-2.31 3.94 3.94 0 00-2.34 4.95l.48 1.22-1.2.5a3.86 3.86 0 00-2.31 4.9 3.94 3.94 0 004.95 2.34l1.2-.5.48 1.22a3.86 3.86 0 004.9 2.31 3.94 3.94 0 002.34-4.95l-.48-1.22 1.2-.5a3.86 3.86 0 002.31-4.9 3.94 3.94 0 00-4.95-2.34l-1.2.5-.48-1.22a3.86 3.86 0 00-4.9-2.31 3.94 3.94 0 00-2.34 4.95l.48 1.22z" />
                            <polygon points="10 8.5 15.5 12 10 15.5 10 8.5" fill="#FFFFFF" />
                          </svg>
                          <span>Shorts</span>
                        </span>

                        {/* Top-Right: Dark Badge with Duration */}
                        <span className="bg-black/60 backdrop-blur-sm text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-white/15">
                          <Clock className="w-2.5 h-2.5 text-white/90" />
                          <span>{short.duration || '0:58'}</span>
                        </span>
                      </div>

                      {/* Center: Circular Red Play Button with White Triangle */}
                      <div className="absolute inset-0 flex items-center justify-center z-15 pointer-events-none">
                        <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#C8101E] text-white flex items-center justify-center shadow-xl border-2 border-white/95 transition-transform duration-300 group-hover:scale-115">
                          <Play className="h-5 w-5 fill-white ml-0.5" />
                        </span>
                      </div>

                      {/* Natural Dark Gradient Overlay at Bottom (For Text Readability) */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none z-10" />

                      {/* Bottom Overlay: Gujarati Headline + View Count + Red Progress Indicator */}
                      <div className="absolute bottom-0 inset-x-0 p-3 sm:p-3.5 z-20 flex flex-col justify-end space-y-1.5">
                        <h3 className="text-white text-[13.5px] sm:text-[14px] font-black leading-snug line-clamp-2 drop-shadow-md group-hover:text-red-200 transition-colors">
                          <AutoTranslateString text={short.titleGu || short.title} language={language} />
                        </h3>

                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90 drop-shadow-xs">
                          <Eye className="h-3 w-3 text-white/80" />
                          <span>{short.viewsGu || '1.4K'} વ્યુ</span>
                        </div>

                        {/* Red Progress Indicator Bar Along Bottom Edge (Matching Reference Image 2) */}
                        <div className="h-1 w-full bg-white/25 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-[#C8101E] rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* ── Circular Previous Button (Left) ── */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 text-[#C8101E] flex items-center justify-center shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
            </button>
          )}

          {/* ── Circular Next Button (Right) ── */}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 text-[#C8101E] flex items-center justify-center shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
            </button>
          )}
        </div>

        {/* ── Centered Pagination Dots (Matching Reference Image 2) ── */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-1 select-none" aria-hidden="true">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={`transition-all duration-300 rounded-full ${
                activeDot === dot
                  ? 'w-2.5 h-2.5 bg-[#C8101E]'
                  : 'w-2 h-2 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Modal Player (Preserved for compatibility) ── */}
      {selectedVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedVideoId(null)} />
          <div className="relative w-full max-w-md aspect-[9/16] max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 z-10 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedVideoId(null)}
              className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            <ConsentGate
              type="youtube"
              category="marketing"
              title="YouTube Shorts player"
              aspectRatioClass="aspect-[9/16]"
              className="h-full w-full"
            >
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${selectedVideoId}?enablejsapi=1&autoplay=1&mute=0&controls=1&rel=0&playsinline=1&modestbranding=1`}
                title="YouTube Shorts player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </ConsentGate>
          </div>
        </div>
      )}
    </section>
  );
}
