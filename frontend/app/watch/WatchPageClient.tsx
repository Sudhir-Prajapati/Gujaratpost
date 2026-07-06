'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bookmark,
  Check,
  ChevronDown,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Square,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { VIDEOS, formatViews, getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';
import Footer from '@/components/layout/Footer';

interface YoutubePlayerProps {
  youtubeId: string;
  title: string;
  initialMuted: boolean;
  iframeRef: React.RefCallback<HTMLIFrameElement>;
}

function YoutubePlayer({ youtubeId, title, initialMuted, iframeRef }: YoutubePlayerProps) {
  return (
    <iframe
      ref={iframeRef}
      id="active-iframe"
      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&controls=0&mute=${initialMuted ? 1 : 0}&loop=1&playlist=${youtubeId}&rel=0`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

const INITIAL_ITEMS = 10;
const LOAD_MORE_ITEMS = 8;
const MAX_FEED_ITEMS = 16;

const makeFeed = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const video = VIDEOS[index % VIDEOS.length];
    const round = Math.floor(index / VIDEOS.length);

    return {
      ...video,
      feedKey: `${video.id}-${index}`,
      views: video.views + round * 12841,
      likes: Math.round((video.views + round * 12841) * 0.083),
      comments: 126 + ((index * 173) % 2100),
    };
  });

export default function WatchPageClient() {
  const { language } = useApp();
  const [itemCount, setItemCount] = useState(INITIAL_ITEMS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [sharedKey, setSharedKey] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<Map<number, HTMLElement>>(new Map());
  const feed = useMemo(() => makeFeed(itemCount), [itemCount]);

  const activeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showMuteHud, setShowMuteHud] = useState(false);
  const isFirstMute = useRef(true);

  // Programmatic play/pause control via postMessage
  useEffect(() => {
    const iframe = activeIframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    try {
      const command = isPlaying ? 'playVideo' : 'pauseVideo';
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: '' }),
        '*'
      );
    } catch (e) {
      console.error('Error pausing/playing video:', e);
    }
  }, [isPlaying]);

  // Programmatic mute/unmute control via postMessage
  useEffect(() => {
    const iframe = activeIframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    try {
      const command = isMuted ? 'mute' : 'unMute';
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: '' }),
        '*'
      );
    } catch (e) {
      console.error('Error muting/unmuting video:', e);
    }
  }, [isMuted]);

  // Toggle mute HUD indicator on mute change
  useEffect(() => {
    if (isFirstMute.current) {
      isFirstMute.current = false;
      return;
    }
    setShowMuteHud(true);
    const timer = setTimeout(() => setShowMuteHud(false), 800);
    return () => clearTimeout(timer);
  }, [isMuted]);

  // Toggle Play/Stop on video click
  const handleVideoClick = () => {
    setIsPlaying((prev) => !prev);
  };

  // Toggle Like and show heart animation on video double click
  const handleVideoDoubleClick = (e: React.MouseEvent, feedKey: string) => {
    e.preventDefault();
    if (!liked.has(feedKey)) {
      toggleSet(setLiked, feedKey);
    }
    setShowHeartAnim(true);
  };

  // Clear heart animation timer
  useEffect(() => {
    if (showHeartAnim) {
      const timer = setTimeout(() => setShowHeartAnim(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showHeartAnim]);

  const scrollTo = useCallback((index: number) => {
    const maxIndex = feed.length + (itemCount >= MAX_FEED_ITEMS ? 0 : -1);
    const next = Math.max(0, Math.min(index, maxIndex));
    cardsRef.current.get(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [feed.length, itemCount]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root) return;

    const FOOTER_INDEX = -1; // sentinel value for the footer slide

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const rawIndex = (visible.target as HTMLElement).dataset.index;
        const idx = rawIndex !== undefined ? Number(rawIndex) : FOOTER_INDEX;
        if (idx === FOOTER_INDEX) {
          // Footer slide is most visible — pause any playing video
          setIsPlaying(false);
        } else {
          setActiveIndex(idx);
          setIsPlaying(true);
        }
      },
      { root, threshold: [0.55, 0.75, 0.9] },
    );

    cardsRef.current.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [feed.length, itemCount]);

  useEffect(() => {
    const root = feedRef.current;
    const marker = loadMoreRef.current;
    if (!root || !marker) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setItemCount((count) => {
            if (count >= MAX_FEED_ITEMS) return count;
            return Math.min(count + LOAD_MORE_ITEMS, MAX_FEED_ITEMS);
          });
        }
      },
      { root, rootMargin: '150% 0px' },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        scrollTo(activeIndex + 1);
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        scrollTo(activeIndex - 1);
      }
      if (event.key === ' ' || event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsPlaying((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, scrollTo]);

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const share = async (key: string, title: string) => {
    const url = `${window.location.origin}/watch#${key}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
      setSharedKey(key);
      window.setTimeout(() => setSharedKey(null), 1800);
    } catch {
      // A dismissed native share sheet needs no error UI.
    }
  };

  return (
    <section className="watch-shell" aria-label="Endless video feed">
      <div className="watch-topbar">
        <div>
          <span className="watch-live-dot" />
          <span>Watch</span>
        </div>
        <strong>{getLocalized(language, { en: 'For you', gu: 'તમારા માટે', hi: 'आपके लिए' })}</strong>
        <button type="button" aria-label="More options"><MoreHorizontal /></button>
      </div>

      <div ref={feedRef} className="watch-feed scrollbar-hide" tabIndex={0}>
        {feed.map((item, index) => {
          const active = activeIndex === index;
          const title = getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi });
          const isLiked = liked.has(item.feedKey);
          const isSaved = saved.has(item.feedKey);

          return (
            <article
              key={item.feedKey}
              id={item.feedKey}
              data-index={index}
              ref={(node) => {
                if (node) cardsRef.current.set(index, node);
                else cardsRef.current.delete(index);
              }}
              className="watch-reel"
              aria-label={`${index + 1}. ${title}`}
            >
              {active ? (
                <div className="absolute inset-0 z-0 bg-black">
                  <YoutubePlayer
                    youtubeId={item.youtubeId}
                    title={title}
                    initialMuted={isMuted}
                    iframeRef={(node) => {
                      if (node) activeIframeRef.current = node;
                    }}
                  />
                  {/* Transparent overlay for single click Play/Stop and double click Like */}
                  <div
                    className="absolute inset-0 z-[2] cursor-pointer"
                    onClick={handleVideoClick}
                    onDoubleClick={(e) => handleVideoDoubleClick(e, item.feedKey)}
                  />
                  
                  {/* Floating heart burst animation on double click */}
                  {showHeartAnim && (
                    <div className="absolute top-1/2 left-1/2 z-[10] pointer-events-none animate-heart-burst">
                      <Heart className="h-20 w-20 fill-red-500 text-red-500 drop-shadow-lg" />
                    </div>
                  )}

                  {/* Volume HUD indicator when muted state toggles */}
                  {showMuteHud && (
                    <div className="absolute top-1/2 left-1/2 z-[10] pointer-events-none bg-black/65 backdrop-blur-md p-5 rounded-full text-white animate-hud-fade shadow-2xl">
                      {isMuted ? <VolumeX className="h-10 w-10 text-white" /> : <Volume2 className="h-10 w-10 text-white animate-pulse" />}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute inset-0 z-[1] cursor-pointer"
                    onClick={() => scrollTo(index)}
                    aria-label="View video"
                  />
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    priority={index < 2}
                    sizes="(max-width: 640px) 100vw, 520px"
                    className="watch-reel-image"
                  />
                </>
              )}
              <div className="watch-reel-shade" />

              {active && !isPlaying && (
                <button
                  type="button"
                  onClick={handleVideoClick}
                  className="watch-play-indicator animate-pulse hover:scale-105 transition duration-150 active:scale-95 z-[10]"
                  aria-label="Play video"
                >
                  <Play className="fill-current text-white h-8 w-8" />
                </button>
              )}

              <div className="watch-story-copy">
                <div className="mb-3 flex items-center gap-2">
                  <span className="watch-avatar">GP</span>
                  <strong>gujaratpost</strong>
                  <span className="text-white/55">•</span>
                  <button type="button" className="watch-follow">Follow</button>
                </div>
                <h1>{title}</h1>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-white/78">
                  {getLocalized(language, {
                    en: 'The latest story from Gujarat, explained quickly. Swipe up for the next update.',
                    gu: 'ગુજરાતની તાજી ખબર, ટૂંકમાં અને સરળ રીતે. આગળની ખબર માટે ઉપર સ્વાઇપ કરો.',
                    hi: 'गुजरात की ताज़ा खबर, कम समय में आसान तरीके से। अगली खबर के लिए ऊपर स्वाइप करें।',
                  })}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-white/70">
                  <span className="rounded bg-white/15 px-2 py-1 uppercase backdrop-blur">{item.type}</span>
                  <span>{formatViews(item.views)} views</span>
                  <span>•</span>
                  <span>{item.duration}</span>
                </div>
              </div>

              <aside className="watch-actions" aria-label="Video actions">
                {/* Play / Stop button */}
                <button type="button" onClick={handleVideoClick} aria-label={isPlaying ? 'Stop video' : 'Play video'}>
                  <span>
                    {isPlaying ? <Square className="text-white" /> : <Play className="fill-current text-white" />}
                  </span>
                  <small>
                    {getLocalized(language, {
                      en: isPlaying ? 'Stop' : 'Play',
                      gu: isPlaying ? 'થોભાવો' : 'પ્લે',
                      hi: isPlaying ? 'रोकें' : 'प्ले',
                    })}
                  </small>
                </button>

                <button type="button" onClick={() => toggleSet(setLiked, item.feedKey)} aria-label={isLiked ? 'Unlike' : 'Like'}>
                  <span className={isLiked ? 'is-liked' : ''}><Heart className={isLiked ? 'fill-current' : ''} /></span>
                  <small>{formatViews(item.likes + (isLiked ? 1 : 0))}</small>
                </button>
                <button type="button" aria-label="Comments"><MessageCircle /><small>{formatViews(item.comments)}</small></button>
                <button type="button" onClick={() => share(item.feedKey, title)} aria-label="Share">
                  {sharedKey === item.feedKey ? <Check /> : <Share2 />}<small>{sharedKey === item.feedKey ? 'Copied' : 'Share'}</small>
                </button>
                <button type="button" onClick={() => toggleSet(setSaved, item.feedKey)} aria-label={isSaved ? 'Remove bookmark' : 'Bookmark'}>
                  <Bookmark className={isSaved ? 'fill-current' : ''} /><small>{isSaved ? 'Saved' : 'Save'}</small>
                </button>
                <button type="button" onClick={() => setIsMuted((value) => !value)} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX /> : <Volume2 />}<small>{isMuted ? 'Muted' : 'Sound'}</small>
                </button>
              </aside>

              {active && (
                <div className="watch-progress" key={item.feedKey}>
                  <span style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                </div>
              )}
              {index === 0 && (
                <button type="button" className="watch-swipe-hint" onClick={() => scrollTo(1)}>
                  <ChevronDown /> Swipe up
                </button>
              )}
            </article>
          );
        })}
        {itemCount >= MAX_FEED_ITEMS && (
          <div
            // No data-index so the observer treats this as the footer sentinel
            ref={(node) => {
              if (node) cardsRef.current.set(feed.length, node);
              else cardsRef.current.delete(feed.length);
            }}
            className="watch-reel overflow-y-auto scrollbar-hide flex flex-col justify-between"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
          >
            <div className="pt-14 pb-4 px-4 text-center shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white/50 animate-pulse">
                You&apos;ve caught up!
              </span>
            </div>
            <div className="flex-1">
              <Footer isInline />
            </div>
          </div>
        )}
        {itemCount < MAX_FEED_ITEMS && (
          <div ref={loadMoreRef} className="watch-loader" aria-label="Loading more videos">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="watch-desktop-nav" aria-hidden="true">
        <button type="button" onClick={() => scrollTo(activeIndex - 1)} disabled={activeIndex === 0}><ChevronDown className="rotate-180" /></button>
        <button
          type="button"
          onClick={() => scrollTo(activeIndex + 1)}
          disabled={activeIndex === feed.length + (itemCount >= MAX_FEED_ITEMS ? 0 : -1)}
        >
          <ChevronDown />
        </button>
      </div>
    </section>
  );
}
