'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Check,
  Music2,
  Zap,
} from 'lucide-react';
import { formatViews } from '@/data';
import { safeYouTubeId } from '@/lib/youtube';
import { getPublicVideos } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import Footer from '@/components/layout/Footer';
import { useIsApk } from '@/lib/useIsApk';
import { AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

export default function ShortsPageClient() {
  const { language } = useApp();
  const { isApk } = useIsApk();
  const [videosList, setVideosList] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = useState<Record<string, boolean>>({});
  const [subscribed, setSubscribed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRefs = useRef<Map<number, HTMLIFrameElement>>(new Map());
  const articlesRef = useRef<Map<number, HTMLElement>>(new Map());

  // Fetch shorts
  useEffect(() => {
    getPublicVideos('short').then((res) => {
      setVideosList(res || []);
    });
  }, []);

  const shorts = useMemo(() => {
    if (!videosList.length) return [];
    return videosList.map((item, index) => ({
      ...item,
      key: `${item.id}-short-${index}`,
      likes: item.likes || (1400 + (index * 320) % 5000),
      comments: item.comments || (45 + (index * 17) % 300),
    }));
  }, [videosList]);

  // Send postMessage to active YouTube iframe
  const sendIframeCommand = useCallback((func: string, args: any = '') => {
    const iframe = iframeRefs.current.get(activeIndex);
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch {}
  }, [activeIndex]);

  // Auto-play active short and pause others smoothly
  useEffect(() => {
    iframeRefs.current.forEach((iframe, idx) => {
      if (!iframe || !iframe.contentWindow) return;
      try {
        if (idx === activeIndex) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
            '*'
          );
          if (!isMuted) {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'unMute', args: '' }),
              '*'
            );
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
              '*'
            );
          } else {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'mute', args: '' }),
              '*'
            );
          }
        } else {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
            '*'
          );
        }
      } catch {}
    });
  }, [activeIndex, isMuted]);

  // Toggle Mute / Unmute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      sendIframeCommand(next ? 'mute' : 'unMute');
      if (!next) sendIframeCommand('setVolume', [100]);
      return next;
    });
  };

  // Toggle Play / Pause on click
  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      sendIframeCommand(next ? 'playVideo' : 'pauseVideo');
      return next;
    });
  };

  // Share handler
  const handleShare = async (item: any) => {
    const ytId = item.youtubeId ? safeYouTubeId(item.youtubeId) : '';
    const shareUrl = ytId
      ? `https://www.youtube.com/shorts/${ytId}`
      : typeof window !== 'undefined' ? window.location.href : '';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: item.title || 'Gujarat Post Short',
          text: item.title || 'Check out this Short on Gujarat Post',
          url: shareUrl,
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedKey(item.key);
        setTimeout(() => setCopiedKey(null), 2500);
      } catch {}
    }
  };

  // Instant scroll snap listener for fast zero-delay switching
  const handleContainerScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const itemHeight = container.clientHeight;
    if (!itemHeight) return;

    const newIdx = Math.round(container.scrollTop / itemHeight);
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < shorts.length) {
      setActiveIndex(newIdx);
      setPlayingIndex(newIdx);
      setIsPlaying(true);
    }
  }, [activeIndex, shorts.length]);

  // IntersectionObserver backup for edge cases
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shorts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const indexStr = entry.target.getAttribute('data-index');
            if (indexStr !== null) {
              const idx = parseInt(indexStr, 10);
              if (idx !== activeIndex) {
                setActiveIndex(idx);
                setPlayingIndex(idx);
                setIsPlaying(true);
              }
            }
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    articlesRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [shorts.length, activeIndex]);

  // Height calculations:
  // In APK: 56px top header + 58px bottom nav = 114px chrome
  // In Web: 92px top header
  const containerHeightClass = isApk
    ? 'h-[calc(100svh-114px)] max-h-[calc(100svh-114px)]'
    : 'h-[calc(100svh-92px)] min-h-[620px]';

  const likeLabel = language === 'hi' ? 'लाइक' : language === 'en' ? 'Like' : 'લાઈક';
  const dislikeLabel = language === 'hi' ? 'नापसंद' : language === 'en' ? 'Dislike' : 'નાપસંદ';
  const shareLabel = language === 'hi' ? 'शेयर' : language === 'en' ? 'Share' : 'શેર';
  const soundOnLabel = language === 'hi' ? 'आवाज़ चालू' : language === 'en' ? 'Sound' : 'અવાજ ચાલુ';
  const mutedLabel = language === 'hi' ? 'म्यूट' : language === 'en' ? 'Muted' : 'અવાજ બંધ';
  const subscribeLabel = language === 'hi' ? 'सब्सक्राइब' : language === 'en' ? 'Subscribe' : 'સબસ્ક્રાઇબ';
  const subscribedLabel = language === 'hi' ? 'सब्सक्राइब किया' : language === 'en' ? 'Subscribed' : 'સબસ્ક્રાઇબ કરેલ';

  return (
    <main className="bg-black text-white select-none">
      <section className="mx-auto grid max-w-screen-xl grid-cols-1 gap-0 lg:gap-5 px-0 lg:px-4 py-0 lg:py-5 lg:grid-cols-[240px_1fr_240px]">
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-44 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase text-[#B3121B]">Gujarat Post</p>
            <h1 className="mt-1 text-3xl font-black leading-tight">Shorts</h1>
            <p className="mt-3 text-sm font-semibold text-white/60">
              {language === 'hi'
                ? 'स्वाइप-शैली के त्वरित समाचार वीडियो.'
                : language === 'en'
                ? 'Swipe-style news updates built for fast watching.'
                : 'એક ક્લિકમાં ઝડપી સમાચાર વિડિયો.'}
            </p>
            <Link
              href="/watch"
              className="mt-4 inline-flex rounded-full bg-[#B3121B] px-4 py-2 text-sm font-black text-white"
            >
              Watch
            </Link>
          </div>
        </aside>

        {/* Center Shorts Feed Container */}
        <div
          ref={containerRef}
          onScroll={handleContainerScroll}
          className={`mx-auto ${containerHeightClass} w-full max-w-[430px] snap-y snap-mandatory overflow-y-auto overscroll-contain bg-black scrollbar-hide sm:rounded-[2rem] sm:border sm:border-white/10 sm:shadow-2xl`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'y mandatory',
          }}
        >
          {shorts.map((item, index) => {
            const isLiked = Boolean(liked[item.key]);
            const isDisliked = Boolean(disliked[item.key]);
            const ytId = item.youtubeId || '';
            const isActive = activeIndex === index;
            // Preload sliding window: active, next (+1) and previous (-1)
            const shouldMountIframe = Boolean(ytId && Math.abs(index - activeIndex) <= 1);

            const thumbSrc =
              item.thumbnail &&
              item.thumbnail.startsWith('http') &&
              !item.thumbnail.includes('frame0.jpg')
                ? item.thumbnail
                : ytId
                ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
                : '';

            return (
              <article
                key={item.key}
                data-index={index}
                ref={(el) => {
                  if (el) articlesRef.current.set(index, el);
                  else articlesRef.current.delete(index);
                }}
                className={`relative ${containerHeightClass} snap-start overflow-hidden bg-black flex items-center justify-center`}
                style={{
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                }}
              >
                {/* ── VIDEO PLAYER / POSTER BACKGROUND ──────────────── */}
                <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
                  {/* Poster Image (Only shown when not active, so it never bleeds above or behind the video) */}
                  {!isActive && thumbSrc && (
                    <img
                      src={thumbSrc}
                      alt={item.title || 'Short Video'}
                      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.src.includes('maxresdefault')) {
                          img.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
                        }
                      }}
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />
                  )}

                  {/* YouTube Embed Iframe (Preloaded for current + next + prev, top cropped in APK to remove duplicate upper title) */}
                  {shouldMountIframe && (
                    <iframe
                      ref={(el) => {
                        if (el) iframeRefs.current.set(index, el);
                        else iframeRefs.current.delete(index);
                      }}
                      src={`https://www.youtube.com/embed/${safeYouTubeId(
                        ytId
                      )}?enablejsapi=1&autoplay=${isActive ? 1 : 0}&mute=${
                        isMuted ? 1 : (isActive ? 0 : 1)
                      }&controls=0&rel=0&playsinline=1&modestbranding=1&showinfo=0&iv_load_policy=3&fs=0&loop=1&playlist=${safeYouTubeId(
                        ytId
                      )}`}
                      className={`absolute left-0 w-full border-0 pointer-events-auto bg-black ${
                        isApk
                          ? '-top-[65px] h-[calc(100%+65px)]'
                          : 'inset-0 w-full h-full'
                      }`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      loading={index <= activeIndex + 1 ? 'eager' : 'lazy'}
                    />
                  )}

                  {/* Top gradient mask to cleanly hide any YouTube upper chrome in APK mode */}
                  {isApk && (
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none z-20" />
                  )}

                  {/* Transparent Click-to-Play/Pause Overlay */}
                  <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={togglePlay}
                  />

                  {/* Pause Overlay indicator only if user explicitly paused */}
                  {isActive && !isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none animate-in fade-in zoom-in-75 duration-150">
                      <span className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
                        <Play className="w-8 h-8 fill-white ml-1" />
                      </span>
                    </div>
                  )}
                </div>

                {/* ── TOP BAR OVERLAY: Badge + Single Sound Button ──── */}
                <div className="absolute left-3 right-3 top-3 z-30 flex items-center justify-between pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-black uppercase backdrop-blur-md border border-white/15 shadow-md">
                    <Zap className="w-3.5 h-3.5 text-[#B3121B] fill-[#B3121B]" />
                    <span>Shorts</span>
                  </span>

                  {/* Single Sound Button (Top Right) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/60 hover:bg-black/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition cursor-pointer"
                    title={isMuted ? soundOnLabel : mutedLabel}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[11px] text-red-200">{mutedLabel}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[11px] text-white">{soundOnLabel}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* ── RIGHT ACTION BUTTONS (Real YouTube Shorts Style) ── */}
                <div className="absolute bottom-4 right-2.5 z-30 flex flex-col items-center gap-4 select-none">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLiked((v) => ({ ...v, [item.key]: !isLiked }));
                      if (!isLiked && isDisliked) {
                        setDisliked((v) => ({ ...v, [item.key]: false }));
                      }
                    }}
                    className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition group"
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md border shadow-lg transition ${
                        isLiked
                          ? 'bg-[#B3121B] border-[#B3121B] text-white'
                          : 'bg-black/50 border-white/20 text-white group-hover:bg-black/70'
                      }`}
                    >
                      <ThumbsUp
                        className={`h-5 w-5 ${isLiked ? 'fill-white' : ''}`}
                      />
                    </span>
                    <span className="text-[11px] font-bold text-white drop-shadow-sm">
                      {formatViews(item.likes + (isLiked ? 1 : 0))}
                    </span>
                  </button>

                  {/* Dislike Button (Hidden in APK mode) */}
                  {!isApk && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDisliked((v) => ({ ...v, [item.key]: !isDisliked }));
                        if (!isDisliked && isLiked) {
                          setLiked((v) => ({ ...v, [item.key]: false }));
                        }
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition group"
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md border shadow-lg transition ${
                          isDisliked
                            ? 'bg-black/80 border-red-500 text-red-400'
                            : 'bg-black/50 border-white/20 text-white group-hover:bg-black/70'
                        }`}
                      >
                        <ThumbsDown
                          className={`h-5 w-5 ${isDisliked ? 'fill-red-400' : ''}`}
                        />
                      </span>
                      <span className="text-[11px] font-bold text-white drop-shadow-sm">
                        {dislikeLabel}
                      </span>
                    </button>
                  )}

                  {/* Comments Button (Hidden in APK mode) */}
                  {!isApk && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition group"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg group-hover:bg-black/70">
                        <MessageSquare className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-bold text-white drop-shadow-sm">
                        {item.comments}
                      </span>
                    </button>
                  )}

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(item);
                    }}
                    className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition group"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg group-hover:bg-black/70">
                      {copiedKey === item.key ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Share2 className="h-5 w-5" />
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-white drop-shadow-sm">
                      {copiedKey === item.key ? 'Copied' : shareLabel}
                    </span>
                  </button>

                  {/* Spinning Music Disc */}
                  <div className="pt-1">
                    <div className="w-10 h-10 rounded-full border-2 border-white/40 overflow-hidden shadow-2xl animate-spin [animation-duration:4.5s] bg-slate-900 flex items-center justify-center">
                      <span className="w-4 h-4 rounded-full bg-[#B3121B] flex items-center justify-center text-[8px] font-black text-white">
                        GP
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── BOTTOM INFO OVERLAY (Real YouTube Shorts Style) ── */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pt-20 pb-3 px-3.5 pr-16 z-20 pointer-events-none">
                  {/* Channel Header + Subscribe Pill */}
                  <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                    <div className="relative w-8 h-8 rounded-full bg-[#B3121B] flex items-center justify-center text-white font-black text-[10px] shadow-md border border-white/30 shrink-0">
                      GP
                    </div>
                    <span className="font-extrabold text-[13.5px] text-white drop-shadow-md">
                      @GujaratPost
                    </span>

                    {/* Real YouTube Shorts Subscribe Button */}
                    <button
                      type="button"
                      onClick={() => setSubscribed(!subscribed)}
                      className={`ml-1 text-[11px] font-black px-3 py-1 rounded-full active:scale-95 transition shadow-md cursor-pointer ${
                        subscribed
                          ? 'bg-white/25 text-white border border-white/30 backdrop-blur-xs'
                          : 'bg-white hover:bg-gray-100 text-black'
                      }`}
                    >
                      {subscribed ? subscribedLabel : subscribeLabel}
                    </button>
                  </div>

                  {/* Title & Hashtags */}
                  <div className="pointer-events-auto">
                    <h2 className="line-clamp-2 text-[13.5px] sm:text-[15px] font-bold leading-snug text-white drop-shadow-md">
                      <AutoTranslateString
                        text={item.titleGu || item.title || ''}
                        language={language}
                      />
                    </h2>
                  </div>

                  {/* Audio Track marquee row */}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-white/85 pointer-events-auto">
                    <Music2 className="w-3.5 h-3.5 text-white/90 animate-pulse shrink-0" />
                    <span className="truncate max-w-[220px]">
                      Original Sound - Gujarat Post News
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Last Slide: Footer (Only on Web, hidden in APK) */}
          {!isApk && (
            <div className="relative h-[calc(100svh-92px)] min-h-[620px] snap-start overflow-y-auto bg-primary">
              <div className="p-4 sm:p-8">
                <Footer />
              </div>
            </div>
          )}
        </div>

        {/* Right Desktop Spacer */}
        <aside className="hidden lg:block" />
      </section>
    </main>
  );
}
