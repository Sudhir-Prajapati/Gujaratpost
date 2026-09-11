'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Volume2, VolumeX, Share2, ThumbsUp, Play, ChevronRight
} from 'lucide-react';
import { Video, getLocalized, formatViews } from '@/data';
import { useApp } from '@/components/AppProvider';
import { safeYouTubeId } from '@/lib/youtube';

interface ApkVideoPlayerProps {
  videoId: string;
  initialVideo?: Video | null;
  allVideos: Video[];
  onClose: () => void;
  onSelectVideo: (youtubeId: string, video?: Video) => void;
}

const parseValidViews = (v: any): number | null => {
  if (v === undefined || v === null || v === '' || v === 0 || v === '0') return null;
  const num = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return null;
  return num;
};

export default function ApkVideoPlayer({
  videoId,
  initialVideo,
  allVideos,
  onClose,
  onSelectVideo,
}: ApkVideoPlayerProps) {
  const { language } = useApp();
  const [muted, setMuted] = useState(false);
  const [realViews, setRealViews] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Find active video metadata
  const currentVideo =
    initialVideo ||
    allVideos.find((v) => safeYouTubeId(v.youtubeId) === videoId) ||
    null;

  // Filter out the currently playing video from related list
  const relatedVideos = allVideos.filter(
    (v) => safeYouTubeId(v.youtubeId) !== videoId
  );

  // Fetch real YouTube view count if current video has no valid views
  useEffect(() => {
    setRealViews(null);
    if (!videoId) return;

    const currentV = parseValidViews(currentVideo?.views);
    if (currentV) {
      setRealViews(currentV);
      return;
    }

    // Try finding real views from /api/youtube-videos cache
    fetch('/api/youtube-videos')
      .then((res) => res.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : json?.data || json?.videos || [];
        const found = list.find((item: any) => safeYouTubeId(item.youtubeId || item.id) === videoId);
        const v = parseValidViews(found?.views);
        if (v) setRealViews(v);
      })
      .catch(() => {});
  }, [videoId, currentVideo]);

  const sendCmd = (func: string, args: any[] = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch {}
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      sendCmd(next ? 'mute' : 'unMute');
      if (!next) sendCmd('setVolume', [100]);
      return next;
    });
  };

  const backLabel = language === 'hi' ? 'वापस' : language === 'en' ? 'Back' : 'પાછા';
  const soundOnLabel = language === 'hi' ? 'आवाज़ चालू' : language === 'en' ? 'Sound On' : 'અવાજ ચાલુ';
  const mutedLabel = language === 'hi' ? 'आवाज़ बंद' : language === 'en' ? 'Muted' : 'અવાજ બંધ';
  const moreVideosLabel = language === 'hi' ? 'और वीडियो' : language === 'en' ? 'MORE VIDEOS' : 'વધુ વીડિયો';
  const likeLabel = language === 'hi' ? 'पसंद' : language === 'en' ? 'Like' : 'લાઈક';
  const shareLabel = language === 'hi' ? 'शेयर' : language === 'en' ? 'Share' : 'શેર';

  const finalViews = realViews ?? parseValidViews(currentVideo?.views);

  return (
    <div className="fixed inset-0 z-[200] bg-[#F8F9FA] flex flex-col overflow-hidden select-none">
      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-gray-700 active:scale-95 transition cursor-pointer"
          aria-label={backLabel}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold">{backLabel}</span>
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border active:scale-95 transition cursor-pointer ${
            muted
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
          title={muted ? soundOnLabel : mutedLabel}
        >
          {muted ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>{mutedLabel}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundOnLabel}</span>
            </>
          )}
        </button>
      </div>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* ── VIDEO PLAYER ─────────────────────────────────────── */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=${muted ? 1 : 0}&controls=1&rel=0&playsinline=1&modestbranding=1`}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        {/* ── VIDEO META ─────────────────────────────────────────── */}
        {currentVideo && (
          <div className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
            <h2 className="text-[15px] font-black text-gray-900 leading-snug line-clamp-3">
              {getLocalized(language, {
                en: currentVideo.title || '',
                gu: currentVideo.titleGu || currentVideo.title || '',
                hi: currentVideo.titleHi || currentVideo.title || '',
              })}
            </h2>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#B3121B] flex items-center justify-center text-white text-[9px] font-black">
                  GP
                </span>
                <span className="font-bold text-gray-700">Gujarat Post</span>
              </div>
              {/* Only show view count if real view > 0 exists, otherwise do not show */}
              {finalViews !== null && (
                <span>{formatViews(finalViews)} views</span>
              )}
              {currentVideo.duration && (
                <span>· {currentVideo.duration}</span>
              )}
            </div>

            {/* Action Row */}
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-700 active:scale-95 transition cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{likeLabel}</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-gray-700 active:scale-95 transition cursor-pointer"
                onClick={async () => {
                  try {
                    await navigator.share?.({
                      title: currentVideo.titleGu || currentVideo.title || 'Gujarat Post',
                      url: `https://www.youtube.com/watch?v=${currentVideo.youtubeId}`,
                    });
                  } catch {}
                }}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{shareLabel}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── RELATED VIDEOS ────────────────────────────────────── */}
        <div className="px-3 py-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
            {moreVideosLabel}
          </p>

          <div className="flex flex-col gap-0.5">
            {relatedVideos.map((vid) => {
              const thumbSrc =
                vid.thumbnail &&
                vid.thumbnail.startsWith('http') &&
                !vid.thumbnail.includes('frame0.jpg')
                  ? vid.thumbnail
                  : `https://i.ytimg.com/vi/${safeYouTubeId(vid.youtubeId)}/hqdefault.jpg`;
              const title = getLocalized(language, {
                en: vid.title || '',
                gu: vid.titleGu || vid.title || '',
                hi: vid.titleHi || vid.title || '',
              });
              const relatedViews = parseValidViews(vid.views);

              return (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => onSelectVideo(safeYouTubeId(vid.youtubeId), vid)}
                  className="flex items-start gap-3 w-full text-left py-2.5 px-1 rounded-xl active:bg-gray-100 transition group cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative w-[120px] shrink-0 aspect-video rounded-lg overflow-hidden bg-black shadow-sm">
                    <img
                      src={thumbSrc}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover group-active:opacity-80 transition"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src.includes('maxresdefault')) {
                          img.src = `https://i.ytimg.com/vi/${safeYouTubeId(vid.youtubeId)}/hqdefault.jpg`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 bg-black/30 transition">
                      <Play className="w-7 h-7 text-white fill-current" />
                    </div>
                    {vid.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                        {vid.duration}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2">
                      {title}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500 font-semibold">
                      Gujarat Post
                      {relatedViews !== null && ` · ${formatViews(relatedViews)} views`}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 self-center" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
