'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, Play, VolumeX } from 'lucide-react';
import { getPublicAdBySection } from '@/lib/api';
import type { Language } from '@/types';

export interface SidebarAdBannerProps {
  slot: 'SIDEBAR_HERO_TOP' | 'SIDEBAR_GUJARAT' | 'SIDEBAR_WORLD' | 'SIDEBAR_POPULAR';
  language?: Language;
  fallbackTitleGu: string;
  fallbackTitleEn: string;
  fallbackTagGu: string;
  fallbackTagEn: string;
  fallbackCtaGu: string;
  fallbackCtaEn: string;
  fallbackGradient?: string;
  minHeight?: number;
  className?: string;
}

export default function SidebarAdBanner({
  slot,
  language = 'gu',
  fallbackTitleGu,
  fallbackTitleEn,
  fallbackTagGu,
  fallbackTagEn,
  fallbackCtaGu,
  fallbackCtaEn,
  fallbackGradient = 'linear-gradient(135deg,#FF6B35,#C81D25)',
  minHeight = 180,
  className = '',
}: SidebarAdBannerProps) {
  const [adData, setAdData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getPublicAdBySection(slot).then((data) => {
      if (isMounted) {
        setAdData(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slot]);

  const hasCustomMedia =
    adData &&
    adData.isActive &&
    adData.image1 &&
    adData.image1.trim() !== '';

  const mediaUrl = hasCustomMedia ? adData.image1.trim() : '';
  const redirectLink = hasCustomMedia && adData.link1 ? adData.link1.trim() : '#';
  const mediaType = hasCustomMedia
    ? (adData.mediaType || 'IMAGE').toUpperCase()
    : 'IMAGE';

  const isVideo =
    mediaType === 'VIDEO' ||
    /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaUrl) ||
    mediaUrl.includes('youtube.com') ||
    mediaUrl.includes('youtu.be');

  // Custom Uploaded Media Render
  if (hasCustomMedia) {
    return (
      <div className={`ad-slot w-full ${className}`}>
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 text-center select-none">
          {language === 'gu' ? 'જાહેરાત' : 'Advertisement'}
        </p>
        <a
          href={redirectLink && redirectLink !== '#' ? redirectLink : undefined}
          target={redirectLink && redirectLink !== '#' ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="group relative flex flex-col w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-red-500/30"
          style={{ minHeight }}
        >
          {isVideo ? (
            <div className="relative w-full h-full min-h-[inherit] bg-black overflow-hidden flex items-center justify-center" style={{ minHeight }}>
              {mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? (
                <iframe
                  src={`${mediaUrl.replace('watch?v=', 'embed/')}?autoplay=1&mute=1&loop=1&playlist=${mediaUrl.split('v=')[1] || ''}`}
                  title="Advertisement Video"
                  className="w-full h-full pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {/* Overlay controls badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow">
                <VolumeX className="h-3 w-3 text-red-400" />
                <span>Video Ad</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full min-h-[inherit] overflow-hidden" style={{ minHeight }}>
              <Image
                src={mediaUrl}
                alt="Advertisement"
                fill
                unoptimized={mediaUrl.startsWith('http')}
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 320px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          )}

          {/* Top-Right AD Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm z-10">
            <span>AD</span>
            {redirectLink && redirectLink !== '#' && (
              <ExternalLink className="h-2.5 w-2.5 opacity-80" />
            )}
          </div>
        </a>
      </div>
    );
  }

  // Fallback Styled Card Render
  const title = language === 'gu' ? fallbackTitleGu : fallbackTitleEn;
  const tag = language === 'gu' ? fallbackTagGu : fallbackTagEn;
  const cta = language === 'gu' ? fallbackCtaGu : fallbackCtaEn;

  return (
    <div className={`ad-slot w-full ${className}`}>
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 text-center select-none">
        {language === 'gu' ? 'જાહેરાત' : 'Advertisement'}
      </p>
      <div className="ad-inner">
        <div
          className="ad-creative rounded-xl p-5 text-white flex flex-col justify-between shadow-sm relative overflow-hidden"
          style={{
            background: fallbackGradient.includes('linear-gradient')
              ? fallbackGradient
              : undefined,
            minHeight,
          }}
        >
          <div>
            <div className="ad-brand font-black text-xl uppercase tracking-wide select-none">
              {title}
            </div>
            <div className="ad-tag text-[13px] font-bold mt-2 leading-snug text-white/95">
              {tag}
            </div>
          </div>
          <button
            type="button"
            className="ad-cta bg-white text-slate-900 rounded-full px-5 py-2 text-[12px] font-black transition duration-200 hover:-translate-y-0.5 hover:shadow-lg w-max mt-4 shadow-sm"
          >
            {cta} ↗
          </button>
        </div>
      </div>
    </div>
  );
}
