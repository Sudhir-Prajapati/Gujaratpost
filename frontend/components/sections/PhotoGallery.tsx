'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLocalized, PHOTOS } from '@/data';
import { getPublicGallery } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── Category chips ─────────────────────────────────────────────────────── */
const CATS = ['TRAVEL', 'SPORTS', 'FESTIVAL', 'CITY', 'CULTURE', 'POLITICS', 'NATURE', 'LIFESTYLE', 'TECH'];

/* ─── Loading Skeleton ────────────────────────────────────────────────────── */
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

function GallerySkeleton() {
  return (
    <section className="py-6 bg-background select-none">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="mb-6 h-10 w-44 rounded-lg bg-muted/60 animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[270px] aspect-[3/4] rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

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

function SafeGalleryImage({ src: initialSrc, alt, index }: { src: any; alt: string; index: number }) {
  const fallback = FALLBACK_NEWS_IMAGES[index % FALLBACK_NEWS_IMAGES.length];
  const initial = resolvePhotoUrl(initialSrc, fallback);
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    setSrc(resolvePhotoUrl(initialSrc, fallback));
  }, [initialSrc, fallback]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 280px"
      quality={90}
      className="object-cover transition-transform duration-700 group-hover:scale-105"
      onError={() => setSrc(fallback)}
    />
  );
}

/* ─── PhotoGallery ───────────────────────────────────────────────────────── */
export default function PhotoGallery() {
  const { language } = useApp();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const isManualScrolling = useRef<boolean>(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    getPublicGallery().then((res) => {
      const items = res && res.length > 0 ? res : PHOTOS;
      setPhotos(items.slice(0, 5));
      setLoading(false);
    });
  }, []);

  // Continuous 60fps auto-scroll loop with float ref accumulation to eliminate integer rounding freezes
  useEffect(() => {
    if (loading || photos.length === 0) return;

    let animId: number;
    const scrollStep = () => {
      const el = scrollContainerRef.current;
      if (el) {
        if (!isManualScrolling.current) {
          scrollPosRef.current += 1.2;
          const halfWidth = el.scrollWidth / 2;
          if (halfWidth > 0 && scrollPosRef.current >= halfWidth) {
            scrollPosRef.current = 0;
          }
          el.scrollLeft = scrollPosRef.current;
        }

        setShowLeftArrow(el.scrollLeft > 10);
        setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [loading, photos]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isManualScrolling.current = true;
    const scrollAmount = direction === 'left' ? -350 : 350;
    scrollPosRef.current = Math.max(0, scrollPosRef.current + scrollAmount);
    el.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(() => {
      if (el) scrollPosRef.current = el.scrollLeft;
      isManualScrolling.current = false;
    }, 400);
  };

  const handleNativeScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (isManualScrolling.current) return;
    // Sync float ref if user manually touches/drags
    scrollPosRef.current = el.scrollLeft;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const hqSrc = (src: string) =>
    src.replace(/w=\d+/, 'w=800').replace(/q=\d+/, 'q=90');

  if (loading) return <GallerySkeleton />;

  const gallery = (photos && photos.length > 0 ? photos : PHOTOS).slice(0, 5);

  return (
    <section className="py-6 bg-background select-none">
      <div className="mx-auto max-w-screen-xl px-4">
        {/* Top Header Matching User Mockup */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-900 dark:border-neutral-700 mb-6">
          <Link
            href="/photos"
            prefetch={true}
            className="section-heading-badge bg-[#B3121B] text-white font-black text-[19px] sm:text-[21px] md:text-[23px] px-6 py-2.5 sm:py-3 rounded-xl shadow-md tracking-tight cursor-pointer hover:bg-red-700 transition-colors"
          >
            {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
          </Link>
          <Link
            href="/photos"
            prefetch={true}
            className="text-[#B3121B] hover:text-red-700 font-black text-[17px] sm:text-[18px] md:text-[20px] hover:underline flex items-center gap-1.5 transition-colors cursor-pointer relative z-20 py-1"
          >
            {language === 'gu' ? 'વધુ જુઓ →' : language === 'hi' ? 'और फोटो गैलरी →' : 'More Photo Gallery →'}
          </Link>
        </div>

        <div className="relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-[-14px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shadow-xl border border-neutral-400 dark:border-neutral-800 hover:scale-105 transition-transform cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 stroke-[3]" />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shadow-xl border border-neutral-400 dark:border-neutral-800 hover:scale-105 transition-transform cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 stroke-[3]" />
            </button>
          )}

          {/* Scrollable Auto-Scroll List */}
          <div
            ref={scrollContainerRef}
            onScroll={handleNativeScroll}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
          >
            {[...gallery, ...gallery].map((photo, index) => {
              const photoTitle = getLocalized(language, {
                en: photo.caption || photo.alt || '',
                gu: photo.captionGu || photo.caption || photo.alt || '',
                hi: photo.captionHi || photo.caption || photo.alt || '',
              });

              return (
                <div
                  key={`${photo.id}-${index}`}
                  className="group relative flex-shrink-0 w-[82vw] sm:w-[45vw] md:w-[320px] lg:w-[350px]"
                >
                  <Link
                    href={`/photos/${photo.id}`}
                    className="group relative flex flex-col h-full w-full overflow-hidden rounded-2xl shadow-md hover:shadow-xl border border-border/80 dark:border-white/[0.08] hover:border-[#B3121B]/40 transition-all duration-300 bg-card dark:bg-[#161822]"
                    onMouseEnter={() => setHoveredId(`${photo.id}-${index}`)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Top Section: Photo */}
                    <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                      <SafeGalleryImage src={hqSrc(photo.src)} alt={photo.alt} index={index} />
                      {Array.isArray(photo.images) && photo.images.length > 1 && (
                        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                          <span className="text-white text-[10.5px] font-black px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm border border-white/20 shadow-md flex items-center gap-1.5">
                            <span className="text-red-400">📷</span>
                            <span>{photo.images.length}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Heading & Link below photo */}
                    <div className="p-3.5 sm:p-3 flex flex-col justify-between flex-1 min-w-0 bg-card dark:bg-[#161822]">
                      <p className="text-foreground group-hover:text-[#B3121B] font-extrabold leading-snug line-clamp-2 text-[14.5px] md:text-[15.5px] transition-colors">
                        {photoTitle}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2.5 text-[#B3121B] font-bold text-[12.5px] sm:text-[13px] tracking-wide">
                        <div className="h-[2px] w-5 rounded-full bg-[#B3121B]" />
                        <span>{language === 'gu' ? 'ફોટો જુઓ' : language === 'hi' ? 'फोटो देखें' : 'View Photos'}</span>
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}