'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, Megaphone } from 'lucide-react';
import { getPublicAdBySection } from '@/lib/api';

interface AdProps {
  position?: 'header' | 'sidebar' | 'in-article' | 'footer' | 'banner' | string;
  section?: string;
  className?: string;
  /** When true, shows a branded fallback ad if admin hasn't configured one. Default: false */
  showFallback?: boolean;
}

const adSizes: Record<string, { h: number; label: string }> = {
  header: { h: 90, label: '728 × 90' },
  sidebar: { h: 250, label: '300 × 250' },
  'in-article': { h: 250, label: 'In-article' },
  footer: { h: 90, label: '728 × 90' },
  banner: { h: 70, label: '468 × 60' },
};

const sectionToPosMap: Record<string, string> = {
  HEADER: 'header',
  AFTER_HERO: 'banner',
  SIDEBAR_HERO_TOP: 'sidebar',
  SIDEBAR_GUJARAT: 'sidebar',
  SIDEBAR_WORLD: 'sidebar',
  SIDEBAR_POPULAR: 'sidebar',
  AFTER_TRENDING: 'banner',
  AFTER_WEBSTORIES: 'banner',
};

const isValidMediaUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return true;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
};

export default function Advertisement({ position, section, className = '', showFallback = false }: AdProps) {
  const targetSection = section || (position === 'header' ? 'HEADER' : position === 'sidebar' ? 'SIDEBAR_HERO_TOP' : 'AFTER_HERO');
  const effectivePos = position || sectionToPosMap[targetSection] || 'sidebar';
  const sizeConfig = adSizes[effectivePos] || adSizes['sidebar'];
  const { h } = sizeConfig;
  const vertical = effectivePos === 'sidebar' || effectivePos === 'in-article';

  const [adData, setAdData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getPublicAdBySection(targetSection).then((data) => {
      if (isMounted) {
        setAdData(data);
        setLoaded(true);
      }
    }).catch(() => {
      if (isMounted) setLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, [targetSection]);

  // Check if dynamic custom ad exists for section and has a valid media URL
  const mediaUrl = adData?.image1 ? adData.image1.trim() : '';
  const hasCustomAd =
    adData &&
    adData.isActive !== false &&
    isValidMediaUrl(mediaUrl);

  if (hasCustomAd) {
    const redirectLink = adData.link1 ? adData.link1.trim() : '#';
    const isVideo =
      (adData.mediaType || '').toUpperCase() === 'VIDEO' ||
      /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl);

    return (
      <aside
        aria-label="Advertisement"
        className={`group relative isolate flex flex-col overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-sm transition-all duration-300 hover:border-red-500/40 ${className}`}
        style={{ minHeight: h }}
      >
        <a
          href={redirectLink && redirectLink !== '#' ? redirectLink : undefined}
          target={redirectLink && redirectLink !== '#' ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="relative flex flex-1 w-full min-h-full overflow-hidden"
          style={{ minHeight: h }}
        >
          {isVideo ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Image
              src={mediaUrl}
              alt={adData.title || 'Advertisement'}
              fill
              unoptimized={true}
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              priority={effectivePos === 'header'}
            />
          )}

          {/* Top-Right AD Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm z-10">
            <span>AD</span>
            {redirectLink && redirectLink !== '#' && (
              <ExternalLink className="h-2.5 w-2.5 opacity-80" />
            )}
          </div>
        </a>
      </aside>
    );
  }

  // No active dynamic ad configured — show fallback if requested
  if (!loaded) return null;
  if (!showFallback) return null;

  // Branded default fallback advertisement
  const isWide = !vertical;
  return (
    <aside
      aria-label="Advertisement"
      className={`group relative overflow-hidden rounded-xl border border-dashed border-red-300/60 dark:border-red-800/50 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-950/20 shadow-sm transition-all duration-300 hover:border-red-400/70 hover:shadow-md ${className}`}
      style={{ minHeight: h }}
    >
      <div
        className={`flex ${isWide ? 'flex-row items-center gap-4 px-6' : 'flex-col items-center justify-center gap-3 py-6 px-4'} h-full w-full`}
        style={{ minHeight: h }}
      >
        {/* Icon */}
        <div className={`flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 ${isWide ? 'h-10 w-10 flex-shrink-0' : 'h-14 w-14'}`}>
          <Megaphone className={`text-red-600 dark:text-red-400 ${isWide ? 'h-5 w-5' : 'h-7 w-7'}`} />
        </div>

        {/* Text */}
        <div className={`${isWide ? 'flex-1' : 'text-center'}`}>
          <p className={`font-black text-red-700 dark:text-red-400 leading-tight ${isWide ? 'text-sm' : 'text-base'}`}>
            Advertise with Gujarat Post
          </p>
          <p className={`text-red-600/70 dark:text-red-500/70 font-medium mt-0.5 ${isWide ? 'text-xs' : 'text-[13px]'}`}>
            તમારી જાહેરાત અહીં મૂકો
          </p>
        </div>

        {/* CTA */}
        <a
          href="mailto:ads@gujaratpost.in"
          className={`flex-shrink-0 rounded-full bg-red-600 hover:bg-red-700 text-white font-black shadow transition-all duration-200 hover:scale-105 active:scale-95 ${isWide ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-xs mt-1'}`}
        >
          Contact Us ↗
        </a>
      </div>

      {/* AD Badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-red-600/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
        <span>AD</span>
      </div>
    </aside>
  );
}
