'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      sizes="(max-width: 768px) 100vw, 350px"
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
      onError={() => setSrc(fallback)}
    />
  );
}

/* --- Scrolling Strip ------------------------------------------------------- */
interface StripProps {
  galleryList: any[];
  language: Language;
  direction?: 'left' | 'right';
  offsetIndex?: number;
  accentColor?: string;
}

function GalleryScrollStrip({
  galleryList,
  language,
  direction = 'left',
  offsetIndex = 0,
  accentColor = '#B3121B',
}: StripProps) {
  const CATS_GU = ['ગુજરાત', 'સંસ્કૃતિ', 'ધર્મ', 'પ્રવાસ', 'ખેલ', 'ઉત્સવ', 'શહેર', 'પ્રકૃતિ', 'ઐતિહાસ'];
  const CATS_EN = ['Gujarat', 'Culture', 'Religion', 'Travel', 'Sports', 'Festival', 'City', 'Nature', 'Heritage'];

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  const repeatedGallery = [...galleryList, ...galleryList, ...galleryList];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || galleryList.length === 0) return;
    el.style.scrollBehavior = 'auto';

    if (direction === 'right') {
      const singleW = el.scrollWidth / 3;
      scrollPosRef.current = singleW;
      el.scrollLeft = singleW;
    } else {
      scrollPosRef.current = 0;
      el.scrollLeft = 0;
    }

    const SPEED = direction === 'right' ? 58 : 72;
    lastTimeRef.current = performance.now();

    let animId: number;
    const scrollStep = (now: number) => {
      const dt = Math.min(now - lastTimeRef.current, 50);
      lastTimeRef.current = now;
      const singleSetWidth = el.scrollWidth / 3;

      if (!isPausedRef.current && singleSetWidth > 0) {
        if (direction === 'left') {
          scrollPosRef.current += (SPEED * dt) / 1000;
          if (scrollPosRef.current >= singleSetWidth) {
            scrollPosRef.current = scrollPosRef.current % singleSetWidth;
          }
        } else {
          scrollPosRef.current -= (SPEED * dt) / 1000;
          if (scrollPosRef.current <= 0) {
            scrollPosRef.current = singleSetWidth + (scrollPosRef.current % singleSetWidth);
          }
        }
        el.scrollLeft = scrollPosRef.current;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    const handleNativeScroll = () => { if (el) scrollPosRef.current = el.scrollLeft; };
    el.addEventListener('scroll', handleNativeScroll, { passive: true });
    return () => { cancelAnimationFrame(animId); el.removeEventListener('scroll', handleNativeScroll); };
  }, [galleryList, direction]);

  return (
    <div
      ref={scrollRef}
      onMouseEnter={() => { isPausedRef.current = true; }}
      onMouseLeave={() => { isPausedRef.current = false; lastTimeRef.current = performance.now(); }}
      className="flex gap-4 overflow-x-auto scrollbar-hide py-2"
    >
      {repeatedGallery.map((item, index) => {
        const absIdx = offsetIndex + index;
        const cat = item.category ||
          (language === 'gu' ? CATS_GU[absIdx % CATS_GU.length] : CATS_EN[absIdx % CATS_EN.length]);
        const title = getLocalized(language, {
          en: item.caption || item.alt,
          gu: item.captionGu || item.caption || item.alt,
          hi: item.captionHi || item.caption || item.alt,
        });

        return (
          <Link
            key={item.id + '-' + index}
            href={`/photos/${item.id}`}
            className="group relative flex flex-shrink-0 w-[85vw] sm:w-[48vw] md:w-[350px] h-[280px] md:h-[350px] overflow-hidden rounded-2xl shadow-lg"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <GalleryStripImage src={item.src} alt={title} index={absIdx} />

            {/* Top gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
            {/* Bottom gradient */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-100"
              style={{ opacity: 0.85 }}
            />

            {/* Category chip */}
            <div className="absolute top-3 left-3 z-10">
              <span
                className="text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                {cat}
              </span>
            </div>

            {/* Caption */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-4 translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
              <p className="text-white font-bold leading-snug line-clamp-2 drop-shadow-lg text-[14px] md:text-[16px]">
                <AutoTranslateString text={title} language={language} />
              </p>

              <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-[1.5px] w-7 rounded-full" style={{ backgroundColor: accentColor }} />
                <span className="text-white/75 text-[11px] font-semibold tracking-wider uppercase">
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
  );
}

/* --- Main Component -------------------------------------------------------- */
export default function PhotoGallerySection({ language }: { language: Language }) {
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    getPublicGallery({ limit: 20 }).then((res) => {
      let items = res && res.length > 0 ? [...res] : [...PHOTOS];
      if (items.length < 10) {
        const existingIds = new Set(items.map((p: any) => p.id || p.src));
        for (const defPhoto of PHOTOS) {
          if (items.length >= 10) break;
          if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) items.push(defPhoto);
        }
      }
      setPhotos(items.slice(0, 20));
    });
  }, []);

  const allPhotos = photos.length >= 2 ? photos : PHOTOS.slice(0, 20);
  const strip1 = allPhotos.slice(0, 5);
  const strip2 = allPhotos.slice(5, 10).length >= 3
    ? allPhotos.slice(5, 10)
    : allPhotos.slice(0, 5);

  return (
    <>
      <section className="py-6 bg-background select-none">
        <div className="mx-auto max-w-screen-xl px-4">

          {/* ── Row 1 Header: ફોટો ગેલેરી ── */}
          <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-5">
            <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
              {language === 'gu' ? 'ફોટો   ગેલેરી' : language === 'hi' ? 'फोटो   गैलरी' : 'Photo   Gallery'}
            </span>
            <Link
              href="/photos"
              className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
            >
              {language === 'gu' ? 'વધુ ફોટો ગેલેરી →' : 'More Photo Gallery →'}
            </Link>
          </div>

          {/* Strip 1 — scrolls LEFT, red accent */}
          <GalleryScrollStrip
            galleryList={strip1}
            language={language}
            direction="left"
            offsetIndex={0}
            accentColor="#B3121B"
          />

          {/* ── Row 2 Header: તાજી તસવીરો ── */}
          <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mt-8 mb-5">
            <span className="bg-[#1a56db] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
              {language === 'gu' ? 'તાજી   તસવીરો' : language === 'hi' ? 'ताजी   तस्वीरें' : 'Latest   Photos'}
            </span>
            <Link
              href="/photos"
              className="text-[#1a56db] hover:text-blue-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
            >
              {language === 'gu' ? 'બધી તસવીરો →' : 'All Photos →'}
            </Link>
          </div>

          {/* Strip 2 — scrolls RIGHT, blue accent, different photos */}
          <GalleryScrollStrip
            galleryList={strip2}
            language={language}
            direction="right"
            offsetIndex={5}
            accentColor="#1a56db"
          />

        </div>
      </section>
    </>
  );
}

export { PhotoGallerySection };
