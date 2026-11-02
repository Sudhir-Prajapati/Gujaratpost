'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Play, X, ExternalLink, ChevronDown } from 'lucide-react';
import { getPublicReels, getPublicVideos, getPublicGallery, getPublicArticles } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import { getReelThumbnail } from '@/components/sections/InstagramStories';
import { formatViews } from '@/data';
import { toGu } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import MediaSidebar from '@/components/sections/MediaSidebar';
import AePanVachoSection from '@/components/sections/AePanVachoSection';

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
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [articlesList, setArticlesList] = useState<any[]>([]);
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Fetch Instagram Reels
    getPublicReels().then((res) => {
      setReelsList(res || []);
    });

    // Fetch trending videos for sidebar
    getPublicVideos('video').then((res) => {
      setAllVideos(res || []);
    });

    // Fetch photos for sidebar
    getPublicGallery({ limit: 20 }).then((res) => {
      if (res && res.length > 0) {
        setGalleryList(res);
      }
    });

    // Fetch articles as fallback
    getPublicArticles({ limit: 20, sort: 'views' }).then((res) => {
      if (res?.articles?.length > 0) {
        setArticlesList(res.articles);
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

  // Sidebar trending items
  const sidebarTrending = useMemo(() => {
    if (allVideos.length > 0) {
      return allVideos.slice(0, 6).map((v) => ({
        id: v.id,
        youtubeId: safeYouTubeId(v.youtubeId),
        title: v.titleGu || v.title,
        titleGu: v.titleGu || v.title,
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(v.youtubeId)}/hqdefault.jpg`,
        duration: v.duration || '3:30',
        views: `${formatViews(v.views || 450)} views`,
      }));
    }
    return [];
  }, [allVideos]);

  return (
    <div className="min-h-screen bg-background pb-14 pt-4 sm:pt-6">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        {/* ── MAIN 2-COLUMN PORTAL LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* ════ LEFT COLUMN: INSTAGRAM REELS GRID (3 CARDS PER ROW MATCHING SCREENSHOT) ════ */}
          <div className="min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5 pb-2.5 border-b-2 border-border">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-95 transition shadow-xs"
              >
                <span>{language === 'gu' ? 'ફોલો કરો' : 'Follow'}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* 3-Column Reels Grid matching screenshot */}
            {cleanReels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
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
                      <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black shadow-xs border border-border/20 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={reel.thumb}
                          alt={reel.displayTitle}
                          className="absolute inset-0 h-full w-full object-contain transition-transform duration-500"
                          loading="lazy"
                        />

                        {/* Top-Left Reels Badge */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#B3121B] text-white shadow-xs">
                          <ReelsBadgeIcon className="h-3.5 w-3.5 text-white" />
                        </div>

                        {/* Centered Circular Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#B3121B] shadow-md transition-transform group-hover:scale-110">
                            <Play className="h-5 w-5 fill-current ml-0.5" />
                          </span>
                        </div>

                        {/* Bottom gradient on image */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                        {/* Views pill */}
                        {reel.views && (
                          <span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white tracking-wider flex items-center gap-1">
                            <span>▶</span>
                            <span>{toGu(formatViews(reel.views))}</span>
                          </span>
                        )}
                      </div>

                      {/* Video Title */}
                      <div className="mt-2.5 min-w-0">
                        <h3 className="text-[13px] sm:text-[13.5px] font-bold leading-snug tracking-tight text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                          {reel.displayTitle}
                        </h3>

                        {/* Meta: Instagram · Gujarat Post */}
                        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground">
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
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 6)}
                  className="group inline-flex items-center gap-2.5 rounded-full border-2 border-[#B3121B] px-9 py-3 text-[#B3121B] hover:bg-[#B3121B] hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <span className="text-lg md:text-xl font-black tracking-wide leading-none">
                    {language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'View More'}
                  </span>
                  <ChevronDown className="w-5 h-5 transition-transform duration-200 group-hover:translate-y-0.5 stroke-[3]" />
                </button>
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN: SIDEBAR (TRENDING NEWS + PHOTO GALLERY) ════ */}
          <div className="w-full lg:sticky lg:top-20 lg:self-start">
            <MediaSidebar
              type="instagram"
              language={language}
              trendingVideos={sidebarTrending}
              trendingArticles={articlesList}
              photos={galleryList}
              onVideoClick={(v) => {
                if (v.youtubeId) {
                  window.open(`https://www.youtube.com/watch?v=${v.youtubeId}`, '_blank', 'noopener,noreferrer');
                }
              }}
            />
          </div>

        </div>

        {/* ── AE PAN VACHO (ALSO READ: CRIME & FACT CHECK NEWS) ── */}
        <AePanVachoSection language={language} spacingClassName="mt-5" />
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
                className="w-full h-full object-contain"
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
