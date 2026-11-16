'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, X, ExternalLink, ChevronDown, ChevronRight, Camera } from 'lucide-react';
import { getPublicReels, getPublicGallery } from '@/lib/api';
import { getReelThumbnail } from '@/components/sections/InstagramStories';
import { formatViews } from '@/data';
import { toGu } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import AePanVachoSection from '@/components/sections/AePanVachoSection';

const FALLBACK_PHOTO_IMAGES = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
];

const DEFAULT_GALLERY_PHOTOS = [
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
  {
    id: '8a91c07f-edf6-4a5c-9d23-6f5e77466df8',
    titleGu: 'પ્રજ્ઞા જાયસવાલનો ફેસ્ટિવ લુકમાં જોરદાર અંદાજ',
    captionGu: 'પ્રજ્ઞા જાયસવાલનો ફેસ્ટિવ લુકમાં જોરદાર અંદાજ',
    src: 'https://gujaratpost.in/gallery/rakul-preet3.jpg',
  },
  {
    id: '9b02c07f-edf6-4a5c-9d23-6f5e77466df9',
    titleGu: 'દીપિકા પાદુકોણનો ગ્લેમરસ રેડ કાર્પેટ લુક',
    captionGu: 'દીપિકા પાદુકોણનો ગ્લેમરસ રેડ કાર્પેટ લુક',
    src: 'https://gujaratpost.in/gallery/annya-pandey1.jpg',
  },
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
  if (typeof val === 'object' && Array.isArray(val?.images) && val.images.length > 0) {
    const first = val.images[0];
    const firstSrc = typeof first === 'string' ? first : (first?.src || first?.url || fallback);
    return resolvePhotoUrl(firstSrc, fallback);
  }
  return fallback;
}

function GalleryCardImage({ src: rawSrc, alt, index }: { src?: any; alt: string; index: number }) {
  const fallback = FALLBACK_PHOTO_IMAGES[index % FALLBACK_PHOTO_IMAGES.length];
  const initial = resolvePhotoUrl(rawSrc, fallback);
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    setSrc(resolvePhotoUrl(rawSrc, fallback));
  }, [rawSrc, fallback]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
      style={{ objectPosition: 'top center' }}
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
}

function ReelsBadgeIcon({ className = 'h-4 w-4 text-white' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H9l2 4H8L6 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zM8 17V9.5l7 3.75L8 17z" />
    </svg>
  );
}

export default function InstagramPageClient() {
  const { language } = useApp();
  const [reelsList, setReelsList] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Fetch Instagram Reels
    getPublicReels().then((res) => {
      setReelsList(res || []);
    });

    // Fetch Photo Gallery
    getPublicGallery({ limit: 24 }).then((res) => {
      if (res && res.length > 0) {
        setGalleryList(res);
      }
    });
  }, []);

  // Deduplicated reels
  const cleanReels = useMemo(() => {
    if (!reelsList.length) return [];
    const seen = new Set<string>();
    const list: any[] = [];
    for (const item of reelsList) {
      const key = item.id || item.videoUrl || item.instaUrl;
      if (key && !seen.has(key)) {
        seen.add(key);
        const title = (language === 'gu' ? item.headingGu : language === 'hi' ? item.headingHi : item.heading) || item.headingGu || item.heading || 'Gujarat Post Reel';
        list.push({
          ...item,
          displayTitle: title,
          thumb: getReelThumbnail(item) || item.thumbnail || '/assets/demo/1.jpg',
          views: item.views || 4800,
        });
      }
    }
    return list;
  }, [reelsList, language]);

  // Gallery items with fallbacks ensuring at least 8 cards
  const displayPhotos = useMemo(() => {
    const raw = galleryList.length > 0 ? galleryList : DEFAULT_GALLERY_PHOTOS;
    if (raw.length < 8) {
      return [...raw, ...DEFAULT_GALLERY_PHOTOS.filter((df) => !raw.some((p) => p.id === df.id))];
    }
    return raw;
  }, [galleryList]);

  return (
    <div className="min-h-screen bg-background pb-14 pt-4 sm:pt-6">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── 1. INSTAGRAM REELS SECTION (FULL CONTAINER WIDTH) ──       */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-2.5 border-b-2 border-border">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-gradient-to-b from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-xs inline-block shrink-0" />
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {language === 'gu' ? 'ઇન્સ્ટાગ્રામ રીલ્સ' : language === 'hi' ? 'इंस्टाग्राम रील्स' : 'Instagram Reels'}
              </h1>
            </div>

            <a
              href="https://www.instagram.com/gujaratpost.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-95 transition shadow-xs"
            >
              <span>{language === 'gu' ? 'ફોલો કરો' : language === 'hi' ? 'फॉलो करें' : 'Follow'}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Full-width responsive 4-column grid with increased gap */}
          {cleanReels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
              {cleanReels.slice(0, visibleCount).map((reel, idx) => {
                return (
                  <div
                    key={reel.id || idx}
                    className="group flex flex-col cursor-pointer select-none"
                    onClick={() => {
                      const targetUrl = reel.videoUrl || reel.instaUrl;
                      if (targetUrl) {
                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        setSelectedReel(reel);
                      }
                    }}
                  >
                    {/* Thumbnail Container — Vertical 9:16 aspect ratio with play button */}
                    <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black shadow-xs hover:shadow-lg border border-border/20 group transition-all duration-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={reel.thumb}
                        alt={reel.displayTitle}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Top-Left Reels Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#B3121B] text-white shadow-xs">
                        <ReelsBadgeIcon className="h-3.5 w-3.5 text-white" />
                      </div>

                      {/* Centered Circular Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#B3121B] shadow-md transition-transform group-hover:scale-110">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </span>
                      </div>

                      {/* Bottom gradient on image */}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                      {/* Views pill */}
                      {reel.views && (
                        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] font-bold text-white tracking-wider flex items-center gap-1">
                          <span>▶</span>
                          <span>{toGu(formatViews(reel.views))}</span>
                        </span>
                      )}
                    </div>

                    {/* Video Title */}
                    <div className="mt-2.5 min-w-0">
                      <h3 className="text-[13.5px] sm:text-[14px] font-bold leading-snug tracking-tight text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                        {reel.displayTitle}
                      </h3>

                      {/* Meta: Instagram · Gujarat Post */}
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <span className="text-[#C13584]">●</span>
                        <span>Instagram Reel</span>
                        <span>·</span>
                        <span>Gujarat Post</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground rounded-2xl border border-dashed border-border">
              <Play className="h-10 w-10 mb-2 text-muted-foreground/50" />
              <p className="font-bold text-sm">
                {language === 'gu' ? 'ઇન્સ્ટાગ્રામ રીલ્સ લોડ થઈ રહ્યા છે...' : 'Loading Instagram reels...'}
              </p>
            </div>
          )}

          {/* Load More Button */}
          {visibleCount < cleanReels.length && (
            <div className="mt-8 sm:mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 8)}
                className="group inline-flex items-center gap-2.5 rounded-full border-2 border-[#B3121B] px-9 py-3 text-[#B3121B] hover:bg-[#B3121B] hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <span className="text-lg md:text-xl font-black tracking-wide leading-none">
                  {language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'View More'}
                </span>
                <ChevronDown className="w-5 h-5 transition-transform duration-200 group-hover:translate-y-0.5 stroke-[3]" />
              </button>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── 2. PHOTO GALLERY SECTION (IN THE PREVIOUS BLANK SPACE) ──  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <section className="mt-12 sm:mt-14 pt-8 border-t-2 border-border/80">
          {/* Header matching Gujarat Post brand style */}
          <div className="flex items-center justify-between pb-3.5 border-b-2 border-border mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-[#B3121B] text-white font-black text-lg sm:text-xl md:text-2xl px-5 py-2 sm:py-2.5 rounded-xl shadow-md tracking-tight leading-none select-none">
                {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
              </span>
            </div>

            <Link
              href="/photos"
              className="text-base sm:text-lg font-black text-[#B3121B] hover:text-red-700 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer select-none"
            >
              <span>{language === 'gu' ? 'વધુ ફોટો ગેલેરી' : language === 'hi' ? 'और फोटो गैलरी' : 'More Photo Gallery'}</span>
              <span>→</span>
            </Link>
          </div>

          {/* Photo Cards Grid: Full Width 4-Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
            {displayPhotos.slice(0, 8).map((photo, index) => {
              const captionSource = photo.captionGu || photo.caption || photo.titleGu || photo.title || photo.alt || (language === 'gu' ? 'ગુજરાત પોસ્ટ ફોટો ગેલેરી' : 'Gujarat Post Photo Gallery');

              return (
                <Link
                  key={`${photo.id || index}-${index}`}
                  href={`/photos/${photo.id || index}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl shadow-sm hover:shadow-xl border border-border/80 dark:border-white/[0.08] bg-card dark:bg-[#161822] select-none transition-all duration-300 hover:-translate-y-1 hover:border-[#B3121B]/40"
                >
                  {/* Top Section: Photo (4:5 Aspect Ratio) */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                    <GalleryCardImage
                      src={photo.src || photo.image || photo.imageUrl}
                      alt={captionSource}
                      index={index}
                    />

                    {/* Top-Left Red Badge: "ફોટો ગેલેરી" */}
                    <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                      <span className="bg-[#B3121B] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-xs select-none">
                        {language === 'gu' ? 'ફોટો ગેલેરી' : language === 'hi' ? 'फोटो गैलरी' : 'Photo Gallery'}
                      </span>
                    </div>

                    {/* Camera badge if multiple images */}
                    {Array.isArray(photo.images) && photo.images.length > 1 && (
                      <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-black text-white shadow-md border border-white/20">
                          <Camera className="w-3 h-3 text-red-400" />
                          <span>{photo.images.length}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Section: Caption / Title */}
                  <div className="p-3.5 sm:p-4 flex flex-col justify-center flex-1 min-w-0 bg-card dark:bg-[#161822]">
                    <h3 className="text-foreground group-hover:text-[#B3121B] text-[14px] sm:text-[15px] font-extrabold leading-snug line-clamp-2 transition-colors cursor-pointer">
                      <AutoTranslateString text={captionSource} language={language as any} />
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All Photos Button */}
          <div className="mt-8 sm:mt-10 flex justify-center">
            <Link
              href="/photos"
              className="group inline-flex items-center gap-2.5 rounded-full border-2 border-[#B3121B] px-9 py-3 text-[#B3121B] hover:bg-[#B3121B] hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <span className="text-base sm:text-lg font-black tracking-wide leading-none">
                {language === 'gu' ? 'બધા ફોટો જુઓ' : language === 'hi' ? 'सभी फोटो देखें' : 'View All Photos'}
              </span>
              <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]" />
            </Link>
          </div>
        </section>

        {/* ── 3. AE PAN VACHO (ALSO READ: CRIME & FACT CHECK NEWS) ── */}
        <AePanVachoSection language={language} spacingClassName="mt-12 sm:mt-14" />
      </div>

      {/* ── MODAL REEL PREVIEW IF NEEDED ── */}
      {selectedReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 sm:p-6"
          onClick={() => setSelectedReel(null)}
        >
          <div
            className="relative w-full max-w-md bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl p-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-white mb-4">
              <h3 className="text-sm font-bold truncate pr-4">
                {selectedReel.displayTitle}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReel(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden mb-4 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedReel.thumb}
                alt={selectedReel.displayTitle}
                className="w-full h-full object-cover"
              />
            </div>

            <a
              href={selectedReel.videoUrl || selectedReel.instaUrl || 'https://www.instagram.com/gujaratpost.in/'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold py-2.5 rounded-xl shadow transition hover:opacity-90"
            >
              <span>{language === 'gu' ? 'ઇન્સ્ટાગ્રામ પર જુઓ' : 'Watch on Instagram'}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
