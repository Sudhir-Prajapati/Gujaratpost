'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Play, X, ChevronLeft, ChevronRight, Eye, Clock, MoreVertical } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';
import { getPublicVideos } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';

interface ShortItem {
  id: string;
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

const CATEGORIES_GU = ['લાઈફસ્ટાઈલ', 'ફિટનેસ', 'ટેકનોલોજી', 'સમાચાર', 'રાજકારણ', 'સ્પોર્ટ્સ', 'મનોરંજન', 'ધર્મ', 'બિઝનેસ'];
const CATEGORIES_EN = ['Lifestyle', 'Fitness', 'Technology', 'News', 'Politics', 'Sports', 'Entertainment', 'Religion', 'Business'];

// Demo Shorts matching the user's exact design & screenshot
const DUMMY_SHORTS: ShortItem[] = [
  {
    id: 's1',
    categoryGu: 'હવામાન',
    categoryEn: 'Weather',
    title: '60 સેકન્ડમાં વરસાદ એલર્ટ',
    titleGu: '60 સેકન્ડમાં વરસાદ એલર્ટ',
    viewsGu: '12K',
    duration: '0:60',
    isBannerCard: true,
    thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=sA6BrUmBXiA',
  },
  {
    id: 's2',
    categoryGu: 'ગુજરાત',
    categoryEn: 'Gujarat',
    title: 'ગુજરાત ટાઇટન્સની ટ્રેનિંગ મોમેન્ટ',
    titleGu: 'ગુજરાત ટાઇટન્સની ટ્રેનિંગ મોમેન્ટ',
    viewsGu: '8.4K',
    duration: '0:45',
    thumbnail: '/assets/demo/3.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=rQHoqCTiQvI',
  },
  {
    id: 's3',
    categoryGu: 'બિઝનેસ',
    categoryEn: 'Business',
    title: 'શેર બજારમાં ઐતિહાસિક ઉછાળો',
    titleGu: 'શેર બજારમાં ઐતિહાસિક ઉછાળો',
    viewsGu: '6.7K',
    duration: '0:40',
    thumbnail: '/assets/demo/5.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=WF2Kuec5HV0',
  },
  {
    id: 's4',
    categoryGu: 'લાઈફસ્ટાઈલ',
    categoryEn: 'Lifestyle',
    title: 'ચોમાસામાં આરોગ્ય ટિપ્સ',
    titleGu: 'ચોમાસામાં આરોગ્ય ટિપ્સ',
    viewsGu: '14.2K',
    duration: '0:40',
    thumbnail: '/assets/demo/6.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=LDDtOMwdJ_0',
  },
  {
    id: 's5',
    categoryGu: 'ફિટનેસ',
    categoryEn: 'Fitness',
    title: 'યોગા અને માનસિક શાંતિ',
    titleGu: 'યોગા અને માનસિક શાંતિ',
    viewsGu: '9.3K',
    duration: '0:35',
    thumbnail: '/assets/demo/7.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=-iXZuFoHqiw',
  },
  {
    id: 's6',
    categoryGu: 'ટેકનોલોજી',
    categoryEn: 'Technology',
    title: 'નવા AI ટૂલ્સની શક્તિશાળી સુવિધાઓ',
    titleGu: 'નવા AI ટૂલ્સની શક્તિશાળી સુવિધાઓ',
    viewsGu: '7.1K',
    duration: '0:30',
    thumbnail: '/assets/demo/8.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=uJalvs-jgFc',
  },
  {
    id: 's7',
    categoryGu: 'સમાચાર',
    categoryEn: 'News',
    title: 'નવરાત્રી સેટની એક્લુદ ક્લિપ',
    titleGu: 'નવરાત્રી સેટની એક્લુદ ક્લિપ',
    viewsGu: '11K',
    duration: '0:59',
    thumbnail: '/assets/demo/1.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=A_5vL-ngK4M',
  },
  {
    id: 's8',
    categoryGu: 'રાજકારણ',
    categoryEn: 'Politics',
    title: 'વિધાનસભા ચોમાસુ સત્રના તાજા દ્રશ્યો',
    titleGu: 'વિધાનસભા ચોમાસુ સત્રના તાજા દ્રશ્યો',
    viewsGu: '15.8K',
    duration: '0:50',
    thumbnail: '/assets/demo/4.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=sA6BrUmBXiA',
  },
  {
    id: 's9',
    categoryGu: 'સ્પોર્ટ્સ',
    categoryEn: 'Sports',
    title: 'ક્રિકેટ મેચની રોમાંચક પળો',
    titleGu: 'ક્રિકેટ મેચની રોમાંચક પળો',
    viewsGu: '18.4K',
    duration: '0:42',
    thumbnail: '/assets/demo/2.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=rQHoqCTiQvI',
  },
];

export default function YouTubeShorts() {
  const { language } = useApp();
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const loadShortsData = useCallback(async () => {
    setLoading(true);
    try {
      const liveRes = await getPublicVideos('short');
      if (liveRes && liveRes.length > 0) {
        const seen = new Set<string>();
        const mapped: ShortItem[] = [];
        // Prioritize featured shorts first, then slice up to top 40
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

            mapped.push({
              id: key,
              title: v.titleGu || v.title,
              titleGu: v.titleGu || v.title,
              thumbnail: `https://i.ytimg.com/vi/${key}/oar2.jpg`,
              videoUrl: `https://www.youtube.com/shorts/${key}`,
              categoryGu: CATEGORIES_GU[i % CATEGORIES_GU.length],
              categoryEn: CATEGORIES_EN[i % CATEGORIES_EN.length],
              viewsGu: viewsStr,
              duration: v.duration || '0:58',
            });
            i++;
            if (mapped.length >= 40) break;
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

  const updateArrows = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || loading || shorts.length === 0) return;

    updateArrows();

    let animId: number;
    let lastTime = performance.now();
    const SPEED = 50; 

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!isPausedRef.current && !selectedVideoId) {
        scrollPosRef.current += SPEED * dt;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          if (scrollPosRef.current >= maxScroll) {
            scrollPosRef.current = 0;
          }
          el.scrollLeft = scrollPosRef.current;
          updateArrows();
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    const handleNativeScroll = () => {
      scrollPosRef.current = el.scrollLeft;
      updateArrows();
    };

    el.addEventListener('scroll', handleNativeScroll, { passive: true });
    window.addEventListener('resize', updateArrows);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('scroll', handleNativeScroll);
      window.removeEventListener('resize', updateArrows);
    };
  }, [loading, shorts, selectedVideoId, updateArrows]);

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
    setTimeout(() => {
      scrollPosRef.current = el.scrollLeft;
      isPausedRef.current = false;
    }, 700);
  };

  const displayList = shorts.length > 0 ? [...shorts, ...shorts] : [];

  return (
    <section className="relative mx-auto max-w-screen-xl px-4 py-6 select-none">
      <div className="w-full bg-[#B3121B] text-white rounded-2xl p-5 sm:p-6 md:p-7 border border-white/10 relative shadow-xl">
        
        {/* Header Row */}
        <div className="flex items-center justify-between mb-5 select-none">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-black text-xs sm:text-sm px-3.5 py-1.5 rounded-md tracking-wide border border-white/25 shadow-sm uppercase flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              {getLocalized(language, { en: 'Short Videos', gu: 'શોર્ટ વીડિયો', hi: 'शॉर्ट वीडियो' })}
            </span>
          </div>

          <Link
            href="/shorts"
            className="text-white/95 hover:text-white font-extrabold text-xs sm:text-sm hover:underline flex items-center gap-1 transition"
          >
            {getLocalized(language, { en: 'More Shorts →', gu: 'બધા શોર્ટ્સ જુઓ →', hi: 'सभी शॉर्ट्स देखें →' })}
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
            className="scrollbar-hide flex gap-4 overflow-x-auto py-1"
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[185px] sm:w-[205px] aspect-[9/16] rounded-2xl bg-white/10 animate-pulse border border-white/20" />
              ))
            ) : (
              displayList.map((short, index) => (
                <article
                  key={`${short.id}-${index}`}
                  onClick={() => setSelectedVideoId(short.id)}
                  className="group relative flex-shrink-0 w-[185px] sm:w-[205px] cursor-pointer select-none"
                >
                  <div
                    className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/20 bg-black shadow-md transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{
                      backgroundImage: `url(https://i.ytimg.com/vi/${short.id}/hqdefault.jpg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${short.id}/oar2.jpg`}
                      alt={short.title}
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        // Hide broken oar2.jpg — card div background (hqdefault) shows as fallback
                        (e.target as HTMLImageElement).style.opacity = '0';
                      }}
                      loading="lazy"
                    />
                    {/* Subtle gradient only at the very bottom for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <span className="w-11 h-11 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 border border-white/20">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 flex flex-col justify-end space-y-1.5">
                      <h3 className="text-white text-[12.5px] font-black leading-snug line-clamp-2 drop-shadow-md group-hover:text-red-200 transition-colors">
                        {language === 'gu' ? (short.titleGu || short.title) : short.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-white/90 drop-shadow">
                        <Eye className="h-3 w-3 text-white/80" />
                        <span>{short.viewsGu || '75'} વ્યુ</span>
                        <span>|</span>
                        <Clock className="h-3 w-3 text-white/80" />
                        <span>{short.duration || '0:58'}</span>
                      </div>
                      <div className="h-1 w-4 bg-[#B3121B] rounded-full mt-1" />
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {!loading && shorts.length > 0 && (
        <>
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white text-[#B3121B] flex items-center justify-center shadow-2xl border border-slate-200 hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 stroke-[3]" />
            </button>
          )}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white text-[#B3121B] flex items-center justify-center shadow-2xl border border-slate-200 hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 stroke-[3]" />
            </button>
          )}
        </>
      )}

      {selectedVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedVideoId(null)} />
          <div className="relative w-full max-w-md aspect-[9/16] max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 z-10 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedVideoId(null)}
              className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Embed Player */}
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${selectedVideoId}?enablejsapi=1&autoplay=1&mute=0&controls=1&rel=0&playsinline=1&modestbranding=1`}
              title="YouTube Shorts player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
