'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, Megaphone } from 'lucide-react';
import { getPublicAdBySection } from '@/lib/api';

export interface AdSectionBannerProps {
  section: string;
  initialAd?: any;
  className?: string;
  /** When true, shows a default "Advertise with Us" banner if admin has not configured an ad. Default: false */
  showFallback?: boolean;
}

export interface AdItemData {
  image: string;
  link: string;
}

export default function AdSectionBanner({ section, initialAd, className = '', showFallback = false }: AdSectionBannerProps) {
  const [adData, setAdData] = useState<any>(initialAd || null);
  const [loading, setLoading] = useState<boolean>(!initialAd);

  useEffect(() => {
    if (!initialAd && section) {
      let isMounted = true;
      getPublicAdBySection(section).then((data) => {
        if (isMounted) {
          setAdData(data);
          setLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [section, initialAd]);

  // Still loading — render nothing (silent)
  if (loading) {
    return null;
  }

  // Extract non-empty image items (up to 3)
  const items: AdItemData[] = [];
  if (adData && adData.isActive) {
    if (adData.image1 && adData.image1.trim() !== '') {
      items.push({ image: adData.image1, link: adData.link1 || '#' });
    }
    if (adData.image2 && adData.image2.trim() !== '') {
      items.push({ image: adData.image2, link: adData.link2 || '#' });
    }
    if (adData.image3 && adData.image3.trim() !== '') {
      items.push({ image: adData.image3, link: adData.link3 || '#' });
    }
  }

  // No active admin ad — show fallback or nothing
  if (items.length === 0) {
    if (!showFallback) return null;

    // Branded default "Advertise with Us" banner
    return (
      <aside
        aria-label={`Advertisement section ${section}`}
        className={`my-6 w-full ${className}`}
      >
        <div className="container mx-auto px-2 sm:px-4">
          <div className="group relative flex items-center justify-between gap-4 px-6 py-4 rounded-2xl border border-dashed border-red-300/60 dark:border-red-800/50 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 dark:from-red-950/30 dark:via-rose-950/20 dark:to-pink-950/20 shadow-sm hover:border-red-400/70 hover:shadow-md transition-all duration-300 overflow-hidden min-h-[80px]">
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <Megaphone className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-red-700 dark:text-red-400 text-sm sm:text-base leading-tight">
                  Advertise with Gujarat Post
                </p>
                <p className="text-red-600/70 dark:text-red-500/70 font-medium text-xs sm:text-sm mt-0.5 truncate">
                  તમારી જાહેરાત અહીં મૂકો — લાખો વાચકો સુધી પહોંચો
                </p>
              </div>
            </div>

            {/* Right: CTA */}
            <a
              href="mailto:ads@gujaratpost.in"
              className="flex-shrink-0 rounded-full bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2 text-xs sm:text-sm shadow transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Contact Us ↗
            </a>

            {/* AD Badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-red-600/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <span>AD</span>
            </div>

            {/* Decorative background element */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-100/50 dark:from-red-900/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </aside>
    );
  }

  const count = items.length;

  // Grid system setting proper width based on image count:
  // 1 image  -> 100% full width (grid-cols-1)
  // 2 images -> 50%/50% width (grid-cols-1 md:grid-cols-2)
  // 3 images -> 33.3%/33.3%/33.3% width (grid-cols-1 sm:grid-cols-2 md:grid-cols-3)
  let gridColsClass = 'grid-cols-1';
  let aspectRatioClass = 'aspect-[21/6] sm:aspect-[24/5]'; // Wide banner for 1 item

  if (count === 2) {
    gridColsClass = 'grid-cols-1 md:grid-cols-2';
    aspectRatioClass = 'aspect-[16/7] sm:aspect-[16/6]'; // 50% split width aspect ratio
  } else if (count === 3) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    aspectRatioClass = 'aspect-[16/8] sm:aspect-[16/7]'; // 33.3% split width aspect ratio
  }

  return (
    <aside
      aria-label={`Advertisement section ${section}`}
      className={`my-6 w-full ${className}`}
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className={`grid ${gridColsClass} gap-4 items-stretch`}>
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.link && item.link !== '#' ? item.link : undefined}
              target={item.link && item.link !== '#' ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="group relative flex w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-red-500/30"
            >
              <div className={`relative w-full ${aspectRatioClass} min-h-[100px] overflow-hidden`}>
                <Image
                  src={item.image}
                  alt={`Advertisement ${idx + 1}`}
                  fill
                  unoptimized={item.image.startsWith('http')}
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                {/* Badge top-right */}
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white/90 shadow-sm">
                  <span>AD</span>
                  {item.link && item.link !== '#' && (
                    <ExternalLink className="h-2.5 w-2.5 opacity-70 group-hover:opacity-100" />
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
