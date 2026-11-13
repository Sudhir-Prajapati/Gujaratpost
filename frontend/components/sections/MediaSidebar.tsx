'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Bell, ChevronRight, Camera } from 'lucide-react';
import { safeYouTubeId } from '@/lib/youtube';
import { toGu } from '@/lib/utils';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

const FALLBACK_PHOTO_IMAGES = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
];

const DEFAULT_SIDEBAR_PHOTOS = [
  {
    id: '531dd7eb-98de-4600-a085-f6f68ae822f8',
    titleGu: 'રકુલ પ્રીતનો સ્ટાઇલિશ આઉટફીટમાં ગ્લેમરસ લુક',
    captionGu: 'રકુલ પ્રીતનો સ્ટાઇલિશ આઉટફીટમાં ગ્લેમરસ લુક',
    src: 'https://gujaratpost.in/gallery/rakul-preet3.jpg',
  },
  {
    id: '1083ef20-9d49-4b44-aafb-cf897e39d880',
    titleGu: 'અવનીત કૌરના ગ્લેમરસ ફોટો વાયરલ',
    captionGu: 'અવનીત કૌરના ગ્લેમરસ ફોટો વાયરલ',
    src: 'https://gujaratpost.in/gallery/screenshot-2026-08-05-at-4.27.52 pm.png',
  },
  {
    id: '3ef8ca1e-4eb6-4c7e-a792-b8678ce4d232',
    titleGu: 'સની લિયોની ગાઉનમાં લાગી રહી છે હોટ',
    captionGu: 'સની લિયોની ગાઉનમાં લાગી રહી છે હોટ',
    src: 'https://gujaratpost.in/gallery/screenshot-2026-08-05-at-3.51.47 pm.png',
  },
  {
    id: '62ec4542-e073-40d4-8495-3eefd41d341b',
    titleGu: 'વ્હાઈટ બ્રાઇડલ લહેંગામાં અનન્યા પાંડેનો હોટ લુક',
    captionGu: 'વ્હાઈટ બ્રાઇડલ લહેંગામાં અનન્યા પાંડેનો હોટ લુક',
    src: 'https://gujaratpost.in/gallery/annya-pandey1.jpg',
  },
  {
    id: 'f911c07f-edf6-4a5c-9d23-6f5e77466df7',
    titleGu: 'વ્હાઈટ ઓફ શોલ્ડર આઉટફીટમાં નરગીસ ફખરી ગોર્જિયસ',
    captionGu: 'વ્હાઈટ ઓફ શોલ્ડર આઉટફીટમાં નરગીસ ફખરી ગોર્જિયસ',
    src: 'https://gujaratpost.in/gallery/nargis-fakhari.jpg',
  },
  {
    id: '73f130a3-a810-401e-af5e-be777b7d455e',
    titleGu: 'ઓફ શોલ્ડર બોડીકોન ગાઉનમાં હુમા કુરેશીનો અલગ અંદાજ',
    captionGu: 'ઓફ શોલ્ડર બોડીકોન ગાઉનમાં હુમા કુરેશીનો અલગ અંદાજ',
    src: 'https://gujaratpost.in/gallery/હુમા-કુરેશી.jpg',
  },
];

export function resolvePhotoUrl(val: any, fallback: string = ''): string {
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

function SidebarPhotoCardImage({
  src: initialSrc,
  alt,
  index,
}: {
  src: string;
  alt: string;
  index: number;
}) {
  const fallback = FALLBACK_PHOTO_IMAGES[index % FALLBACK_PHOTO_IMAGES.length];
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
      unoptimized
      sizes="(max-width: 768px) 100vw, 360px"
      className="object-cover transition-transform duration-500 ease-out"
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
}

export function SidebarPhotoCard({ photo, index, language }: { photo: any; index: number; language: string }) {
  const title = photo.captionGu || photo.alt || photo.caption || photo.titleGu || photo.title || (language === 'gu' ? 'ગુજરાત પોસ્ટ ફોટો ગેલેરી' : language === 'hi' ? 'गुजरात पोस्ट फोटो गैलरी' : 'Photo Gallery');
  const imgSrc = photo.src || photo.image || photo.imageUrl;

  return (
    <Link
      href={`/photos/${photo.id || index}`}
      className="group relative flex flex-col w-full rounded-2xl overflow-hidden bg-card dark:bg-[#161822] border border-border/80 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-[#B3121B]/40 cursor-pointer block select-none transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* 1. Top Section: Full Photo */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <SidebarPhotoCardImage
          src={imgSrc}
          alt={title}
          index={index}
        />

        {/* Top-Left Red Pill Badge: "ફોટો ગેલેરી" */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="bg-[#B3121B] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-xs select-none">
            {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
          </span>
        </div>
      </div>

      {/* 2. Bottom Section: Heading & Action below photo */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 min-w-0 bg-card dark:bg-[#161822]">
        <p className="text-foreground group-hover:text-[#B3121B] text-[13px] sm:text-[14px] font-extrabold leading-snug line-clamp-2 transition-colors">
          <AutoTranslateString text={title} language={language as any} />
        </p>

        <div className="flex items-center gap-1.5 mt-2 text-[#B3121B] font-bold text-[12px]">
          <span>{language === 'gu' ? 'ફોટો જુઓ' : language === 'hi' ? 'फोटो देखें' : 'View Photos'}</span>
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}

export function SidebarPhotoMiniCard({ photo, index, language }: { photo: any; index: number; language: string }) {
  const title = photo.captionGu || photo.alt || photo.caption || photo.titleGu || photo.title || (language === 'gu' ? 'ગુજરાત પોસ્ટ ફોટો ગેલેરી' : language === 'hi' ? 'गुजरात पोस्ट फोटो गैलरी' : 'Photo Gallery');
  const imgSrc = photo.src || photo.image || photo.imageUrl;

  return (
    <Link
      href={`/photos/${photo.id || index}`}
      className="group relative flex flex-col w-full rounded-xl overflow-hidden bg-card dark:bg-[#161822] border border-border/80 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-[#B3121B]/40 cursor-pointer block select-none transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <SidebarPhotoCardImage
          src={imgSrc}
          alt={title}
          index={index}
        />
        {/* Mini Top badge */}
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 bg-[#B3121B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shadow-xs pointer-events-none">
          <Camera className="h-2.5 w-2.5" />
          <span>{language === 'gu' ? 'ફોટો' : language === 'hi' ? 'फोटो' : 'Photo'}</span>
        </div>
      </div>

      {/* Bottom title */}
      <div className="p-2 flex flex-col justify-between flex-1 min-w-0 bg-card dark:bg-[#161822]">
        <p className="text-foreground group-hover:text-[#B3121B] text-[11.5px] font-bold leading-tight line-clamp-2 transition-colors">
          <AutoTranslateString text={title} language={language as any} />
        </p>
      </div>
    </Link>
  );
}

interface MediaSidebarProps {
  type: 'shorts' | 'instagram';
  language: string;
  trendingVideos?: any[];
  trendingArticles?: any[];
  photos?: any[];
  photoCount?: number;
  onVideoClick?: (video: any) => void;
}

export default function MediaSidebar({
  type,
  language,
  trendingVideos = [],
  trendingArticles = [],
  photos = [],
  photoCount,
  onVideoClick,
}: MediaSidebarProps) {
  // Combine real photos with fallbacks so there are always at least 5-6 photos
  const rawPhotos = photos.length > 0 ? photos : DEFAULT_SIDEBAR_PHOTOS;
  const displayPhotos = rawPhotos.length < 6
    ? [...rawPhotos, ...DEFAULT_SIDEBAR_PHOTOS.filter((df) => !rawPhotos.some((p) => p.id === df.id))]
    : rawPhotos;

  const targetPhotoCount = photoCount !== undefined
    ? photoCount
    : (type === 'instagram' ? 3 : 2);

  return (
    <div className="flex flex-col gap-6 select-none w-full">
      {/* ── 0. SOCIAL CHANNEL PROMO BANNER ── */}
      {type === 'shorts' ? (
        <div className="group rounded-2xl border border-red-200 dark:border-red-950/40 bg-gradient-to-br from-red-50/60 to-red-100/30 dark:from-red-950/20 dark:to-red-950/10 p-4 sm:p-5 text-center shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-center gap-2 text-[#E62117] font-black text-[13px] uppercase tracking-wide mb-2">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#FF0000] drop-shadow-sm transition-transform duration-300 group-hover:scale-105" fill="currentColor">
              <path d="M22.5 7.1a2.8 2.8 0 0 0-2-2C18.7 4.6 12 4.6 12 4.6s-6.7 0-8.5.5a2.8 2.8 0 0 0-2 2A29.5 29.5 0 0 0 1 12a29.5 29.5 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.8 2.8 0 0 0 2-2A29.5 29.5 0 0 0 23 12a29.5 29.5 0 0 0-.5-4.9Z" />
              <path fill="white" d="m9.8 15.2 5.6-3.2-5.6-3.2v6.4Z" />
            </svg>
            <span>{language === 'gu' ? 'ગુજરાત પોસ્ટ યુટ્યુબ' : language === 'hi' ? 'गुजरात पोस्ट यूट्यूब' : 'Gujarat Post YouTube'}</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground font-semibold px-1 mb-3.5">
            {language === 'gu'
              ? 'તમામ શોર્ટ્સ, બુલેટિન અને એક્સક્લુઝિવ વીડિયો — એક જ જગ્યાએ.'
              : language === 'hi'
              ? 'सभी शॉर्ट्स, बुलेटिन और एक्सक्लूसिव वीडियो — एक ही जगह पर।'
              : 'All shorts, bulletins and exclusive videos — in one place.'}
          </p>
          <a
            href="https://www.youtube.com/@Gujaratpostnews?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#E62117] hover:bg-[#CC181E] text-white font-black text-xs sm:text-sm py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-sm cursor-pointer select-none active:scale-[0.98]"
          >
            <Bell className="h-4 w-4 fill-current shrink-0" />
            <span>{language === 'gu' ? 'સબસ્ક્રાઇબ કરો' : language === 'hi' ? 'सब्सक्राइब करें' : 'Subscribe'}</span>
          </a>
        </div>
      ) : (
        <div className="group rounded-2xl border border-pink-200 dark:border-pink-950/40 bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-amber-50/30 dark:from-pink-950/20 dark:to-purple-950/10 p-4 sm:p-5 text-center shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-center gap-2 font-black text-[13px] uppercase tracking-wide mb-2 text-[#C13584]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C13584]" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>{language === 'gu' ? 'ગુજરાત પોસ્ટ ઇન્સ્ટાગ્રામ' : language === 'hi' ? 'गुजरात पोस्ट इंस्टाग्राम' : 'Gujarat Post Instagram'}</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground font-semibold px-1 mb-3.5">
            {language === 'gu'
              ? 'રોજેરોજના વાયરલ રીલ્સ અને તાજા અપડેટ્સ મેળવો.'
              : language === 'hi'
              ? 'रोजाना वायरल रील्स और ताज़ा अपडेट्स पाएं।'
              : 'Daily viral reels and breaking updates on Instagram.'}
          </p>
          <a
            href="https://www.instagram.com/gujaratpost.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-black text-xs sm:text-sm py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-sm cursor-pointer select-none active:scale-[0.98]"
          >
            <span>{language === 'gu' ? 'ઇન્સ્ટાગ્રામ પર ફોલો કરો' : language === 'hi' ? 'इंस्टाग्राम पर फॉलो करें' : 'Follow on Instagram'}</span>
          </a>
        </div>
      )}

      {/* ── 1. TRENDING NEWS / MOST VIEWED (ટ્રેન્ડિંગ સમાચાર) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-border">
          <span className="w-2.5 h-4.5 bg-[#B3121B] rounded-xs inline-block shrink-0" />
          <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
            {language === 'gu' ? 'લેટેસ્ટ વીડિયો' : language === 'hi' ? 'लेटेस्ट वीडियो' : 'Latest Videos'}
          </h3>
        </div>

        {/* Video / Article list with stylish rank numbers */}
        <div className="flex flex-col divide-y divide-border/60">
          {trendingVideos.length > 0 ? (
            trendingVideos.slice(0, 5).map((item, idx) => (
              <div
                key={item.id || idx}
                className="group flex items-start gap-2.5 sm:gap-3 py-3 first:pt-0.5 last:pb-1 cursor-pointer"
                onClick={() => {
                  if (onVideoClick) {
                    onVideoClick(item);
                  } else if (item.youtubeId) {
                    window.open(`https://www.youtube.com/watch?v=${safeYouTubeId(item.youtubeId)}`, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                {/* Large stylish rank number matching screenshot */}
                <span
                  className="text-[20px] sm:text-[22px] font-extrabold leading-none select-none w-6 shrink-0 text-center mt-1 text-slate-400 dark:text-slate-600 group-hover:text-[#B3121B] transition-colors"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {toGu(idx + 1)}
                </span>

                {/* Thumbnail with centered play button & duration */}
                <div className="relative w-22 h-14 sm:w-24 sm:h-15 aspect-video shrink-0 rounded-md overflow-hidden bg-black shadow-2xs group/thumb">
                  <Image
                    src={item.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(item.youtubeId)}/hqdefault.jpg`}
                    alt={item.titleGu || item.title || 'Video'}
                    fill
                    sizes="(max-width: 768px) 100px, 120px"
                    className="object-cover transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/thumb:bg-black/10 transition-all">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs transition-transform group-hover/thumb:scale-110">
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                    </span>
                  </div>
                  {item.duration && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.2 text-[8px] font-bold text-white leading-tight">
                      {item.duration}
                    </span>
                  )}
                </div>

                {/* Title + Views count */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h4 className="text-[12.5px] font-bold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                    <AutoTranslateString text={item.titleGu || item.title || ''} language={language as any} />
                  </h4>
                  <span className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="text-[#B3121B]">▶</span>
                    <span>{language === 'gu' ? toGu(item.views || '350 views') : (item.views || '350 views')}</span>
                  </span>
                </div>
              </div>
            ))
          ) : trendingArticles.length > 0 ? (
            trendingArticles.slice(0, 5).map((art, idx) => (
              <Link
                key={art.id || idx}
                href={`/news/${art.slug}`}
                className="group flex items-start gap-2.5 sm:gap-3 py-3 first:pt-0.5 last:pb-1"
              >
                <span className="text-[20px] font-extrabold leading-none select-none w-6 shrink-0 text-center mt-1 text-slate-400 dark:text-slate-600 group-hover:text-[#B3121B] transition-colors">
                  {toGu(idx + 1)}
                </span>
                <div className="relative w-22 h-14 sm:w-24 sm:h-15 aspect-video shrink-0 rounded-md overflow-hidden bg-muted border border-border/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(art as any).featuredImage || art.image || (art as any).thumbnail || '/assets/demo/1.jpg'}
                    alt={art.title || ''}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <h4 className="text-[12.5px] font-bold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                    <AutoArticleTitle article={art} language={language as any} />
                  </h4>
                  <span className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="text-[#B3121B]">▶</span>
                    <span>{art.views || 500} views</span>
                  </span>
                </div>
              </Link>
            ))
          ) : null}
        </div>
      </div>

      {/* ── 2. PHOTO GALLERY (ફોટો ગેલેરી) ── */}
      <div className="mt-1 pt-2 border-t-2 border-border">
        {/* Header: Red Badge on left + "વધુ ફોટો ગેલેરી →" on right */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b-[2.5px] border-slate-900 dark:border-white/20">
          <span className="bg-[#B3121B] text-white px-4.5 py-2 text-sm sm:text-base font-black rounded-lg tracking-tight shadow-xs select-none leading-none">
            {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
          </span>
          <Link
            href="/photos"
            className="text-sm sm:text-base font-black text-[#B3121B] hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
          >
            <span>{language === 'gu' ? 'વધુ ફોટો ગેલેરી' : language === 'hi' ? 'और फोटो गैलरी' : 'More Photo Gallery'}</span>
            <span>→</span>
          </Link>
        </div>

        {/* Photo Cards: Single full-width cards stacked till the left section ends */}
        <div className="flex flex-col gap-3.5">
          {displayPhotos.slice(0, targetPhotoCount).map((photo, idx) => (
            <SidebarPhotoCard
              key={photo.id || idx}
              photo={photo}
              index={idx}
              language={language}
            />
          ))}

          {/* Link to view all photos */}
          <div className="pt-2">
            <Link
              href="/photos"
              className="group w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full border-2 border-[#B3121B] bg-card text-[#B3121B] transition-all duration-200 shadow-sm hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#B3121B] hover:text-white hover:shadow-md text-center cursor-pointer active:scale-95"
            >
              <span className="text-base sm:text-lg font-black tracking-wide leading-none">
                {language === 'gu' ? 'બધા ફોટો જુઓ' : language === 'hi' ? 'सभी फोटो देखें' : 'View All Photos'}
              </span>
              <ChevronRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
