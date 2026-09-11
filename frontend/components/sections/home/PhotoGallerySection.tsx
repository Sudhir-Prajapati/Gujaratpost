'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language } from '@/types';
import { getLocalized, PHOTOS } from '@/data';
import { getPublicGallery } from '@/lib/api';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';


/* --- Photo Gallery Section ------------------------------------------------- */
const GALLERY_DATA = [
  {
    id: 'gal1',
    src: '/assets/demo/6.jpg',
    titleGu: 'નવરાત્રિની રંગીન તૈયારીઓ! તસવીરોમાં જુઓ ધમાલ',
    title: 'Navratri colourful preparations! See the fun in photos',
    count: 12,
  },
  {
    id: 'gal2',
    src: '/assets/demo/3.jpg',
    titleGu: 'ગિરનાર લીલી પરિક્રમા: ભક્તિનો મહાસાગર ઉમટ્યો',
    title: 'Girnar Lili Parikrama: A sea of devotion gathered',
    count: 68,
  },
  {
    id: 'gal3',
    src: '/assets/demo/2.jpg',
    titleGu: 'અમદાવાદ ક્લાવર શો 2025ની અદ્ભૂત ઝલક',
    title: 'A wonderful glimpse of Ahmedabad Clover Show 2025',
    count: 34,
  },
];

export default function PhotoGallerySection({ language }: { language: Language }) {
  const CATS_GU = ['ગુજરાત', 'સંસ્કૃતિ', 'ધર્મ', 'પ્રવાસ', 'ખેલ', 'ઉત્સવ', 'શહેર', 'પ્રકૃતિ', 'ઐતિહાસ'];
  const CATS_EN = ['Gujarat', 'Culture', 'Religion', 'Travel', 'Sports', 'Festival', 'City', 'Nature', 'Heritage'];

  const [photos, setPhotos] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  useEffect(() => {
    getPublicGallery().then((res) => {
      let items = res && res.length > 0 ? [...res] : [...PHOTOS];
      if (items.length < 5) {
        const existingIds = new Set(items.map((p: any) => p.id || p.src));
        for (const defPhoto of PHOTOS) {
          if (items.length >= 5) break;
          if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
            items.push(defPhoto);
          }
        }
      }
      setPhotos(items.slice(0, 5));
    });
  }, []);

  const galleryList = photos.length > 0 ? photos.slice(0, 5) : PHOTOS.slice(0, 5);

  // Duplicate galleryList 3 times to create a seamless infinite scroll strip
  const repeatedGallery = [
    ...galleryList,
    ...galleryList,
    ...galleryList,
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.style.scrollBehavior = 'auto';
    const SPEED = 72; // px per second (~1.2px/frame)
    lastTimeRef.current = performance.now();

    let animId: number;
    const scrollStep = (now: number) => {
      const dt = Math.min(now - lastTimeRef.current, 50);
      lastTimeRef.current = now;

      const singleSetWidth = el.scrollWidth / 3;

      if (!isPausedRef.current && singleSetWidth > 0) {
        scrollPosRef.current += (SPEED * dt) / 1000;
        if (scrollPosRef.current >= singleSetWidth) {
          scrollPosRef.current = scrollPosRef.current % singleSetWidth;
        }
        el.scrollLeft = scrollPosRef.current;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);

    const handleNativeScroll = () => {
      if (el) scrollPosRef.current = el.scrollLeft;
    };

    el.addEventListener('scroll', handleNativeScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('scroll', handleNativeScroll);
    };
  }, [photos]);

  return (
    <>
      <section className="py-6 bg-background select-none">
        <div className="mx-auto max-w-screen-xl px-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
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

          {/* Scrollable Magazine Flex Strip */}
          <div
            ref={scrollRef}
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; lastTimeRef.current = performance.now(); }}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-2"
          >
            {repeatedGallery.map((item, index) => {
              const cat = item.category || (language === 'gu' ? CATS_GU[index % CATS_GU.length] : CATS_EN[index % CATS_EN.length]);
              const title = getLocalized(language, { en: item.caption || item.alt, gu: item.captionGu || item.caption || item.alt, hi: item.captionHi || item.caption || item.alt });

              return (
                <Link
                  key={item.id + '-' + index}
                  href={`/photos/${item.id}`}
                  className="group relative flex flex-shrink-0 w-[85vw] sm:w-[48vw] md:w-[350px] h-[280px] md:h-[350px] overflow-hidden rounded-2xl shadow-lg"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Image */}
                  <Image
                    src={item.src}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 330px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                  />

                  {/* Top gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                  {/* Bottom strong gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-100" style={{ opacity: 0.85 }} />

                  {/* Category chip */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-[#B3121B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg">
                      {cat}
                    </span>
                  </div>

                  {/* Caption */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4 translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-white font-bold leading-snug line-clamp-2 drop-shadow-lg text-[14px] md:text-[16px]">
                      <AutoTranslateString text={title} language={language} />
                    </p>

                    {/* View Photos — on hover */}
                    <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-[1.5px] w-7 bg-[#B3121B] rounded-full" />
                      <span className="text-white/75 text-[11px] font-semibold tracking-wider uppercase">
                        {language === 'gu' ? 'ફોટો જુઓ' : 'View Photos'}
                      </span>
                      <svg className="h-3 w-3 text-[#B3121B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Red border glow on hover */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: 'inset 0 0 0 2px #B3121B' }} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* End Photo Gallery Section */}
    </>
  );
}

export { PhotoGallerySection };

