'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Play, X, ExternalLink } from 'lucide-react';
import { getPublicVideos, getPublicGallery, getPublicArticles } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import { formatViews } from '@/data';
import { toGu } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import MediaSidebar from '@/components/sections/MediaSidebar';
import AePanVachoSection from '@/components/sections/AePanVachoSection';

export default function ShortsPageClient() {
  const { language } = useApp();
  const searchParams = useSearchParams();
  const vParam = searchParams ? searchParams.get('v') : null;
  const [shortsList, setShortsList] = useState<any[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [articlesList, setArticlesList] = useState<any[]>([]);
  const [selectedShort, setSelectedShort] = useState<any | null>(null);
  const [visibleCount, setVisibleCount] = useState(18);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Fetch shorts
    getPublicVideos('short').then((res) => {
      setShortsList(res || []);
    });

    // Fetch popular/trending videos for sidebar
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

  // Deduplicated shorts
  const cleanShorts = useMemo(() => {
    if (!shortsList.length) return [];
    const seen = new Set<string>();
    const list: any[] = [];
    for (const item of shortsList) {
      const key = item.youtubeId?.trim() || item.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({
          id: item.id,
          youtubeId: safeYouTubeId(item.youtubeId || item.id),
          title: item.titleGu || item.title,
          titleGu: item.titleGu || item.title,
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(item.youtubeId || item.id)}/hqdefault.jpg`,
          duration: item.duration || '0:50',
          views: item.views || 1200,
        });
      }
    }
    return list;
  }, [shortsList]);

  useEffect(() => {
    if (vParam) {
      if (cleanShorts.length > 0) {
        const found = cleanShorts.find((s) => s.youtubeId === vParam || s.id === vParam);
        if (found) {
          setSelectedShort(found);
        } else {
          setSelectedShort({
            id: vParam,
            youtubeId: safeYouTubeId(vParam),
            title: 'Shorts Video',
          });
        }
      } else {
        setSelectedShort({
          id: vParam,
          youtubeId: safeYouTubeId(vParam),
          title: 'Shorts Video',
        });
      }
    }
  }, [vParam, cleanShorts]);

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

          {/* ════ LEFT COLUMN: SHORTS GRID (3 CARDS PER ROW MATCHING SCREENSHOT) ════ */}
          <div className="min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5 pb-2.5 border-b-2 border-border">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-[#B3121B] rounded-xs inline-block shrink-0" />
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {language === 'gu' ? 'શોર્ટ્સ વીડિયો' : language === 'hi' ? 'शॉर्ट्स वीडियो' : 'Shorts Videos'}
                </h1>
              </div>
            </div>

            {/* 3-Column Video Cards Grid matching screenshot */}
            {cleanShorts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                {cleanShorts.slice(0, visibleCount).map((item) => {
                  const ytId = item.youtubeId;
                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col cursor-pointer"
                      onClick={() => setSelectedShort(item)}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black shadow-xs border border-border/20 group">
                        <Image
                          src={item.thumbnail}
                          alt={item.titleGu}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain transition-transform duration-300"
                        />

                        {/* Centered Circular Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#B3121B] shadow-md transition-transform group-hover:scale-110">
                            <Play className="h-5 w-5 fill-current ml-0.5" />
                          </span>
                        </div>

                        {/* Duration Pill at bottom right */}
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-white tracking-wider">
                          {item.duration}
                        </span>
                      </div>

                      {/* Video Title */}
                      <div className="mt-2.5 min-w-0">
                        <h3 className="text-[13px] sm:text-[13.5px] font-bold leading-snug tracking-tight text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                          {item.titleGu}
                        </h3>

                        {/* Meta: ▶ Gujarat Post · views */}
                        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground">
                          <span className="text-[#B3121B]">▶</span>
                          <span>Gujarat Post</span>
                          <span>·</span>
                          <span>{toGu(formatViews(item.views))} views</span>
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
                  {language === 'gu' ? 'શોર્ટ્સ લોડ થઈ રહ્યા છે...' : 'Loading shorts...'}
                </p>
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < cleanShorts.length && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 15)}
                  className="group inline-flex items-center gap-2.5 rounded-full border-2 border-[#B3121B] px-9 py-3 text-[#B3121B] hover:bg-[#B3121B] hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <span className="text-lg md:text-xl font-black tracking-wide leading-none">
                    {language === 'gu' ? 'વધુ જુઓ ↓' : language === 'hi' ? 'और देखें ↓' : 'View More ↓'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN: SIDEBAR (TRENDING NEWS + PHOTO GALLERY) ════ */}
          <div className="w-full lg:sticky lg:top-[96px] lg:self-start">
            <MediaSidebar
              type="shorts"
              language={language}
              trendingVideos={sidebarTrending}
              trendingArticles={articlesList}
              photos={galleryList}
              onVideoClick={(v) => {
                if (v.youtubeId) {
                  setSelectedShort(v);
                }
              }}
            />
          </div>

        </div>

        {/* ── AE PAN VACHO (ALSO READ: CRIME & FACT CHECK NEWS) ── */}
        <AePanVachoSection language={language} spacingClassName="mt-5" />
      </div>

      {/* ── MODAL VIDEO PLAYER ── */}
      {selectedShort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 sm:p-6"
          onClick={() => setSelectedShort(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-900 border-b border-white/10 text-white">
              <h3 className="text-sm font-bold truncate pr-4">
                {selectedShort.titleGu || selectedShort.title}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.youtube.com/shorts/${selectedShort.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition"
                  title="Open in YouTube Shorts"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedShort(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedShort.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedShort.titleGu || selectedShort.title}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
