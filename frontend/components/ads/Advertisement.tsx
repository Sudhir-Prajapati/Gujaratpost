'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, BarChart3, Megaphone, Users, ExternalLink } from 'lucide-react';
import { getPublicAdBySection } from '@/lib/api';

interface AdProps {
  position?: 'header' | 'sidebar' | 'in-article' | 'footer' | 'banner' | string;
  section?: string;
  className?: string;
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

export default function Advertisement({ position, section, className = '' }: AdProps) {
  const targetSection = section || (position === 'header' ? 'HEADER' : position === 'sidebar' ? 'SIDEBAR_HERO_TOP' : 'AFTER_HERO');
  const effectivePos = position || sectionToPosMap[targetSection] || 'sidebar';
  const sizeConfig = adSizes[effectivePos] || adSizes['sidebar'];
  const { h, label } = sizeConfig;
  const vertical = effectivePos === 'sidebar' || effectivePos === 'in-article';

  const [adData, setAdData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    getPublicAdBySection(targetSection).then((data) => {
      if (isMounted) {
        setAdData(data);
      }
    }).catch(() => {});
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

  // Fallback default styled banner card
  return (
    <aside
      aria-label="Advertisement"
      className={`group relative isolate overflow-hidden rounded-xl border border-slate-200 bg-[#0c1729] text-white shadow-sm ${className}`}
      style={{ minHeight: h }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(225,29,46,0.35),transparent_38%),linear-gradient(120deg,transparent,rgba(255,255,255,0.06))]" />
      <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[22px] border-white/[0.045]" />
      <div className="absolute bottom-1 right-2 text-[8px] font-bold uppercase tracking-widest text-white/28">Ad · {label}</div>

      <div className={`relative flex min-h-full w-full ${vertical ? 'flex-col items-start justify-center p-6' : 'items-center justify-between gap-4 px-5 py-3 sm:px-7'}`} style={{ minHeight: h }}>
        <div className={`flex min-w-0 ${vertical ? 'flex-col items-start' : 'items-center gap-4'}`}>
          <span className={`grid shrink-0 place-items-center rounded-xl bg-accent shadow-lg shadow-red-950/40 ${vertical ? 'mb-5 h-12 w-12' : 'h-10 w-10'}`}>
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-300">Grow with Gujarat Post</p>
            <h2 className={`${vertical ? 'mt-2 text-2xl' : 'mt-0.5 text-base sm:text-xl'} font-black leading-tight tracking-tight`}>
              Put your brand in front of Gujarat.
            </h2>
            {vertical && (
              <p className="mt-3 max-w-xs text-sm leading-5 text-white/55">Reach engaged readers across news, video, social and e-paper.</p>
            )}
          </div>
        </div>

        {vertical && (
          <div className="mt-5 flex items-center gap-5 border-y border-white/10 py-3 text-xs font-bold text-white/70">
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-red-400" /> 2M+ readers</span>
            <span className="inline-flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-red-400" /> High impact</span>
          </div>
        )}

        <Link
          href="/advertise"
          className={`${vertical ? 'mt-5' : ''} inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg`}
        >
          Advertise now <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
