'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { isMediaVideo } from '@/lib/media';

interface ArticleMediaProps {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  showPlayBadge?: boolean;
  autoPlay?: boolean;
  autoPlayOnHover?: boolean;
  videoControls?: boolean;
  sizes?: string;
}

export default function ArticleMedia({
  src,
  alt = '',
  className = '',
  style,
  fill = false,
  priority = false,
  unoptimized = true,
  showPlayBadge = true,
  autoPlay = true,
  autoPlayOnHover = false,
  videoControls = false,
  sizes,
}: ArticleMediaProps) {
  const isVideo = isMediaVideo(src);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset error status if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  useEffect(() => {
    if (isVideo && autoPlay && videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, autoPlay, src]);

  // Clean / sanitize Cloudinary or raw URLs
  const cleanSrc = src && typeof src === 'string'
    ? src.replace('/raw/upload/', '/image/upload/').trim()
    : null;

  const isAbsolute = className.includes('absolute');
  const posClass = isAbsolute ? 'absolute inset-0' : 'relative';

  // Fallback: If image/video missing or fails to load, render Gujarat Post logo card
  if (!cleanSrc || hasError) {
    return (
      <div className={`${posClass} flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-slate-900 to-black p-3 overflow-hidden shadow-inner select-none ${className}`}>
        {/* Ambient subtle backdrop pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-10 pointer-events-none" />
        {/* Gujarat Post Logo */}
        <div className="relative z-10 w-[70%] h-[48%] max-w-[210px] max-h-[64px] flex items-center justify-center">
          <Image
            src="/assets/gujarat-post-logo.png"
            alt={alt || "Gujarat Post"}
            fill
            sizes="(max-width: 768px) 150px, 210px"
            className="object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        </div>
      </div>
    );
  }

  // Handle Video Media
  if (isVideo) {
    if (videoControls) {
      return (
        <div className={`${posClass} overflow-hidden bg-black ${fill ? 'w-full h-full' : ''}`}>
          <video
            ref={videoRef}
            src={cleanSrc}
            controls
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            autoPlay={autoPlay}
            muted
            loop
            playsInline
            preload="auto"
            className={`w-full h-full object-cover ${className}`}
            onError={() => setHasError(true)}
          />
        </div>
      );
    }

    return (
      <div className={`${posClass} w-full h-full overflow-hidden bg-zinc-900 group/media`}>
        <video
          ref={videoRef}
          src={cleanSrc}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          autoPlay={autoPlay}
          muted
          loop
          playsInline
          preload="auto"
          className={`w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105 ${className}`}
          onMouseEnter={(e) => {
            if (autoPlayOnHover && !autoPlay) {
              e.currentTarget.play().catch(() => {});
            }
          }}
          onMouseLeave={(e) => {
            if (autoPlayOnHover && !autoPlay) {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }
          }}
          onError={() => setHasError(true)}
        />
        {showPlayBadge && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-black/75 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm border border-white/20 pointer-events-none">
            <Play className="h-2.5 w-2.5 fill-red-500 text-red-500" />
            <span className="text-[9px] uppercase tracking-wider font-bold">Video</span>
          </div>
        )}
      </div>
    );
  }

  // Handle Standard Image Media
  return (
    <img
      src={cleanSrc}
      alt={alt}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      style={isAbsolute ? { width: '100%', height: '100%', objectFit: 'cover', ...style } : style}
      onError={() => setHasError(true)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
    />
  );
}
