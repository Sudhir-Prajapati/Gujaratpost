'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
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

function resolvePhotoUrl(val: any, fallback: string = ''): string {
  if (!val) return fallback;
  let raw = typeof val === 'string' ? val : (val.src || val.coverImage || val.image || val.thumbnail);
  if (typeof raw === 'string') {
    let trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          raw = typeof first === 'string' ? first : (first?.src || first?.url || fallback);
          trimmed = String(raw).trim();
        }
      } catch {}
    }
    const qIdx = trimmed.indexOf('"');
    if (qIdx !== -1) {
      trimmed = trimmed.substring(0, qIdx).trim();
    }
    trimmed = trimmed.replace(/[,\}\]]+$/, '').trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
  }
  if (typeof val === 'object' && Array.isArray(val.images) && val.images.length > 0) {
    const first = val.images[0];
    const firstSrc = typeof first === 'string' ? first : (first?.src || first?.url || fallback);
    return resolvePhotoUrl(firstSrc, fallback);
  }
  return fallback;
}

/* --- Robust Image with onError fallback ----------------------------------- */
function GalleryStripImage({ src: initialSrc, alt, index }: { src?: any; alt: string; index: number }) {
  const fallback = FALLBACK_NEWS_IMAGES[index % FALLBACK_NEWS_IMAGES.length];
  const initial = resolvePhotoUrl(initialSrc, fallback);
  const [src, setSrc] = useState(initial);
  useEffect(() => { setSrc(resolvePhotoUrl(initialSrc, fallback)); }, [initialSrc, fallback]);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 85vw, 350px"
      draggable={false}
      className="object-cover pointer-events-none transition-transform duration-700 ease-out"
      onError={() => setSrc(fallback)}
    />
  );
}

/* --- Scrolling Strip with seamless wrap and interaction handling ------------ */
interface StripProps {
  galleryList: any[];
  language: Language;
  accentColor?: string;
  onActivePhotoChange?: (photo: any) => void;
}

function GalleryScrollStrip({
  galleryList,
  language,
  accentColor = '#B3121B',
  onActivePhotoChange,
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

  // Left arrow visibility state
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const canScrollLeftRef = useRef<boolean>(false);

  const updateCanScrollLeft = useCallback((hasLeft: boolean) => {
    if (canScrollLeftRef.current !== hasLeft) {
      canScrollLeftRef.current = hasLeft;
      setCanScrollLeft(hasLeft);
    }
  }, []);

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

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const cardWidth = isMobile ? window.innerWidth * 0.82 + 16 : 370;
    const singleSetWidth = el.scrollWidth / copies;

    if (dir === 'left') {
      const target = Math.max(0, el.scrollLeft - cardWidth);
      el.scrollTo({ left: target, behavior: 'smooth' });
      scrollPosRef.current = target;
      updateCanScrollLeft(target > 20);
    } else {
      const target = el.scrollLeft + cardWidth;
      if (singleSetWidth > 0 && target >= singleSetWidth * (copies - 1)) {
        // Silently shift back by one set width so the user can continue scrolling right smoothly
        el.scrollLeft -= singleSetWidth;
        scrollPosRef.current = el.scrollLeft;
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: scrollRef.current.scrollLeft + cardWidth, behavior: 'smooth' });
            scrollPosRef.current = scrollRef.current.scrollLeft + cardWidth;
          }
        });
      } else {
        el.scrollTo({ left: target, behavior: 'smooth' });
        scrollPosRef.current = target;
      }
      updateCanScrollLeft(true);
    }

    resumeAutoScrollAfterDelay(4000);
  };

  // Continuous animation loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || galleryList.length === 0) return;

    el.style.scrollBehavior = 'auto';
    lastTimeRef.current = performance.now();
    scrollPosRef.current = el.scrollLeft;
    updateCanScrollLeft(el.scrollLeft > 20);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const SPEED = isMobile ? 46 : 32; // Minor speed increase for mobile auto-scroll; desktop strictly 32 px/sec

    let lastReportedIdx = -1;
    const checkActivePhoto = () => {
      if (!onActivePhotoChange || galleryList.length === 0 || !el) return;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const cardWidth = isMobile ? window.innerWidth * 0.82 + 16 : 336;
      const idx = Math.max(0, Math.floor((el.scrollLeft + cardWidth * 0.35) / cardWidth)) % galleryList.length;
      if (idx !== lastReportedIdx && galleryList[idx]) {
        lastReportedIdx = idx;
        onActivePhotoChange(galleryList[idx]);
      }
    };
    checkActivePhoto();

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
        }
      }

      checkActivePhoto();
      updateCanScrollLeft(el.scrollLeft > 20);
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, [galleryList, copies, onActivePhotoChange, updateCanScrollLeft]);

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
      {/* Floating Left Arrow: only visible when there are photos to the left */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScrollManual('left')}
          aria-label="Previous photos"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-xl backdrop-blur-md opacity-0 group-hover/strip:opacity-100 hover:bg-[#B3121B] hover:scale-110 transition-all cursor-pointer hidden sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

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
        onScroll={() => {
          if (scrollRef.current) {
            updateCanScrollLeft(scrollRef.current.scrollLeft > 20);
          }
        }}
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

              {/* Photo count badge */}
              {Array.isArray(item.images) && item.images.length > 1 && (
                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                  <span className="text-white text-[10.5px] font-black px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm border border-white/20 shadow-md flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-red-400" />
                    <span>{item.images.length}</span>
                  </span>
                </div>
              )}

              {/* Caption & View link */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-4 translate-y-0 group-hover:-translate-y-1 transition-transform duration-300 pointer-events-none">
                <p className="text-white font-bold leading-snug line-clamp-2 drop-shadow-lg text-[14.5px] md:text-[16.5px]">
                  <AutoTranslateString text={title} language={language} />
                </p>

                <div className="flex items-center gap-2 mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-[2.5px] w-7 rounded-full" style={{ backgroundColor: accentColor }} />
                  <span className="text-white text-[13.5px] md:text-[14.5px] font-extrabold tracking-wide">
                    {language === 'gu' ? 'ફોટો જુઓ' : language === 'hi' ? 'फोटो देखें' : 'View Photos'}
                  </span>
                  <svg className="h-4 w-4" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
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
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [activePhoto, setActivePhoto] = useState<any>(null);

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
      if (items.length > 0 && !activePhoto) {
        setActivePhoto(items[0]);
      }
    }).catch(() => {
      setPhotos(PHOTOS);
    });
  }, []);

  const allPhotos = photos.length >= 2 ? photos : PHOTOS;

  const handleOpenPhotos = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      router.push('/photos');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/photos';
      }
    }
  };

  return (
    <section className="py-2 bg-background select-none">
      <div className="mx-auto max-w-screen-xl px-4">

        {/* ── Header: ફોટો ગેલેરી ── */}
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 md:pb-2.5 mb-2.5 md:mb-4">
          <Link
            href="/photos"
            prefetch={true}
            className="section-heading-badge bg-[#B3121B] text-white px-6 py-2.5 sm:py-3 text-[19px] sm:text-[21px] md:text-[23px] font-black rounded-xl select-none leading-none tracking-tight shadow-md cursor-pointer hover:bg-red-700 transition-colors"
          >
            {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
          </Link>
          <Link
            href="/photos"
            prefetch={true}
            className="text-[#B3121B] hover:text-red-700 font-black text-[17px] sm:text-[18px] md:text-[20px] hover:underline flex items-center gap-1.5 transition-colors cursor-pointer relative z-20 py-1"
          >
            <span>{language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'More'}</span>
            <span>→</span>
          </Link>
        </div>

        {/* Strip with all photos, seamless loop, and drag/arrow controls */}
        <GalleryScrollStrip
          galleryList={allPhotos}
          language={language}
          accentColor="#B3121B"
          onActivePhotoChange={setActivePhoto}
        />

      </div>
    </section>
  );
}

export { PhotoGallerySection };
