'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language } from '@/types';
import { getLocalized, PHOTOS } from '@/data';
import { getPublicGallery } from '@/lib/api';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

/* --- Fallback Images ------------------------------------------------------ */
const FALLBACK_NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90',
];

/* --- Robust Image with onError fallback ----------------------------------- */
function GalleryStripImage({ src: initialSrc, alt, index }: { src: string; alt: string; index: number }) {
  const fallback = FALLBACK_NEWS_IMAGES[index % FALLBACK_NEWS_IMAGES.length];
  const [src, setSrc] = useState(initialSrc || fallback);
  useEffect(() => { setSrc(initialSrc || fallback); }, [initialSrc, fallback]);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 85vw, 350px"
      draggable={false}
      className="object-cover pointer-events-none transition-transform duration-700 ease-out group-hover:scale-[1.07]"
      onError={() => setSrc(fallback)}
    />
  );
}

/* --- Scrolling Strip with seamless wrap and interaction handling ------------ */
interface StripProps {
  galleryList: any[];
  language: Language;
  accentColor?: string;
}

function GalleryScrollStrip({
  galleryList,
  language,
  accentColor = '#B3121B',
}: StripProps) {
  const CATS_GU = ['સમાચાર', 'મનોરંજન', 'ગ્લેમરસ', 'ગુજરાત', 'સંસ્કૃતિ', 'પ્રવાસ', 'ઉત્સવ', 'લાઈફસ્ટાઈલ'];
  const CATS_EN = ['News', 'Entertainment', 'Glamour', 'Gujarat', 'Culture', 'Travel', 'Festival', 'Lifestyle'];

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isInteractingRef = useRef<boolean>(false);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mouse drag variables
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  // Duplicate list for infinite wrap (2 sets if >=15 items, 3 sets if fewer)
  const copies = galleryList.length < 15 ? 3 : 2;
  const repeatedGallery = Array.from({ length: copies }, () => galleryList).flat();

  const pauseAutoScroll = useCallback(() => {
    isInteractingRef.current = true;
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    }
  }, []);

  const resumeAutoScrollAfterDelay = useCallback((delay = 4000) => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      lastTimeRef.current = performance.now();
      if (scrollRef.current) {
        scrollPosRef.current = scrollRef.current.scrollLeft;
      }
    }, delay);
  }, []);

  // Smooth manual scroll arrow trigger
  const handleScrollManual = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    pauseAutoScroll();
    const distance = dir === 'right' ? 380 : -380;
    el.scrollBy({ left: distance, behavior: 'smooth' });
    resumeAutoScrollAfterDelay(4000);
  };

  // Continuous animation loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || galleryList.length === 0) return;

    el.style.scrollBehavior = 'auto';
    lastTimeRef.current = performance.now();
    scrollPosRef.current = el.scrollLeft;

    const SPEED = 32; // Comfortable, smooth scrolling speed in px/sec

    const loop = (now: number) => {
      const dt = Math.min(now - lastTimeRef.current, 50);
      lastTimeRef.current = now;

      const singleSetWidth = el.scrollWidth / copies;

      if (!isInteractingRef.current && !isDraggingRef.current && singleSetWidth > 0) {
        scrollPosRef.current += (SPEED * dt) / 1000;

        // SEAMLESS WRAP: Instead of resetting to 0, subtract one exact set width!
        // This ensures ZERO visual jump because item (x) and item (x - singleSetWidth) are identical.
        if (scrollPosRef.current >= singleSetWidth) {
          scrollPosRef.current -= singleSetWidth;
          el.scrollLeft = scrollPosRef.current;
        } else {
          el.scrollLeft = scrollPosRef.current;
        }
      } else if (el) {
        // While user is manually scrolling, track position and wrap seamlessly if needed
        scrollPosRef.current = el.scrollLeft;
        if (scrollPosRef.current >= singleSetWidth * (copies - 1)) {
          scrollPosRef.current -= singleSetWidth;
          el.scrollLeft = scrollPosRef.current;
        } else if (scrollPosRef.current <= 5) {
          scrollPosRef.current += singleSetWidth;
          el.scrollLeft = scrollPosRef.current;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, [galleryList.length, copies]);

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
    pauseAutoScroll();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    scrollPosRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      resumeAutoScrollAfterDelay(4000);
    }
  };

  return (
    <div className="relative group/strip">
      {/* Floating Left Arrow */}
      <button
        type="button"
        onClick={() => handleScrollManual('left')}
        aria-label="Previous photos"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-xl backdrop-blur-md opacity-0 group-hover/strip:opacity-100 hover:bg-[#B3121B] hover:scale-110 transition-all cursor-pointer hidden sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Floating Right Arrow */}
      <button
        type="button"
        onClick={() => handleScrollManual('right')}
        aria-label="Next photos"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-xl backdrop-blur-md opacity-0 group-hover/strip:opacity-100 hover:bg-[#B3121B] hover:scale-110 transition-all cursor-pointer hidden sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Scrolling Strip Container */}
      <div
        ref={scrollRef}
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={() => {
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
          }
          resumeAutoScrollAfterDelay(2500);
        }}
        onTouchStart={pauseAutoScroll}
        onTouchEnd={() => resumeAutoScrollAfterDelay(3500)}
        onWheel={() => {
          pauseAutoScroll();
          resumeAutoScrollAfterDelay(3500);
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-2 cursor-grab active:cursor-grabbing select-none"
      >
        {repeatedGallery.map((item, index) => {
          const absIdx = index;
          const cat = item.category ||
            (language === 'gu' ? CATS_GU[absIdx % CATS_GU.length] : CATS_EN[absIdx % CATS_EN.length]);
          const title = getLocalized(language, {
            en: item.caption || item.alt || item.title || '',
            gu: item.captionGu || item.caption || item.alt || '',
            hi: item.captionHi || item.caption || item.alt || '',
          });

          return (
            <Link
              key={`${item.id || 'photo'}-${index}`}
              href={`/photos/${item.id}`}
              draggable={false}
              onClickCapture={(e) => {
                if (hasDraggedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className="group relative flex flex-shrink-0 w-[82vw] sm:w-[45vw] md:w-[320px] lg:w-[350px] h-[280px] md:h-[350px] overflow-hidden rounded-2xl shadow-lg border border-border/10 bg-card select-none transition-transform duration-300 hover:-translate-y-1"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <GalleryStripImage src={item.src} alt={title} index={absIdx} />

              {/* Top ambient gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Bottom read gradient */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                style={{ opacity: 0.88 }}
              />

              {/* Category chip */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className="text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md"
                  style={{ backgroundColor: accentColor }}
                >
                  {cat}
                </span>
              </div>

              {/* Caption & View link */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 translate-y-0 group-hover:-translate-y-1 transition-transform duration-300 pointer-events-none">
                <p className="text-white font-bold leading-snug line-clamp-2 drop-shadow-lg text-[13.5px] md:text-[15.5px]">
                  <AutoTranslateString text={title} language={language} />
                </p>

                <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-[2px] w-7 rounded-full" style={{ backgroundColor: accentColor }} />
                  <span className="text-white/80 text-[11px] font-bold tracking-wider uppercase">
                    {language === 'gu' ? 'ફોટો જુઓ' : 'View Photos'}
                  </span>
                  <svg className="h-3 w-3" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Border glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `inset 0 0 0 2px ${accentColor}` }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* --- Main Component -------------------------------------------------------- */
export default function PhotoGallerySection({ language }: { language: Language }) {
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    // Fetch up to 50 photos to give users a full, rich gallery stream
    getPublicGallery({ limit: 50 }).then((res) => {
      let items = res && res.length > 0 ? [...res] : [...PHOTOS];
      // Filter out invalid items
      items = items.filter((p: any) => p && (p.src || p.id));
      if (items.length < 15) {
        const existingIds = new Set(items.map((p: any) => p.id || p.src));
        for (const defPhoto of PHOTOS) {
          if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
            items.push(defPhoto);
          }
        }
      }
      setPhotos(items);
    }).catch(() => {
      setPhotos(PHOTOS);
    });
  }, []);

  const allPhotos = photos.length >= 2 ? photos : PHOTOS;

  return (
    <section className="py-6 bg-background select-none">
      <div className="mx-auto max-w-screen-xl px-4">

        {/* ── Header: ફોટો ગેલેરી ── */}
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-5">
          <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight shadow-xs">
            {language === 'gu' ? 'ફોટો   ગેલેરી' : language === 'hi' ? 'फोटो   गैलरी' : 'Photo   Gallery'}
          </span>
          <Link
            href="/photos"
            className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>{language === 'gu' ? 'વધુ ફોટો ગેલેરી' : 'More Photo Gallery'}</span>
            <span>→</span>
          </Link>
        </div>

        {/* Strip with all photos, seamless loop, and drag/arrow controls */}
        <GalleryScrollStrip
          galleryList={allPhotos}
          language={language}
          accentColor="#B3121B"
        />

      </div>
    </section>
  );
}

export { PhotoGallerySection };
