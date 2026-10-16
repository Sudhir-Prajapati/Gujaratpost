'use client';

import React, { useState, useEffect } from 'react';
import type { Language } from '@/types';

interface ArticleShareBarProps {
  title: string;
  articleUrl: string;
  language: Language;
  uiLabel: (language: Language, values: { en: string; gu: string; hi: string }) => string;
  className?: string;
  compact?: boolean;
}

export default function ArticleShareBar({
  title,
  articleUrl,
  language,
  uiLabel,
  className = '',
  compact = false,
}: ArticleShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      setCanShare(true);
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: articleUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div
      suppressHydrationWarning
      className={`article-share-bar select-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 py-2.5 sm:py-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-neutral-50/90 via-white to-neutral-50/90 dark:from-neutral-900/90 dark:via-neutral-900 dark:to-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ${className}`}
    >
      {/* Label with animated badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B3121B] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B3121B]" />
        </span>
        <span className="text-[12.5px] sm:text-[13px] font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
          {uiLabel(language, { en: 'Share this Article:', gu: 'આ સમાચાર શેર કરો:', hi: 'यह खबर शेयर करें:' })}
        </span>
      </div>

      {/* Share actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          title={uiLabel(language, { en: 'Share on WhatsApp', gu: 'વોટ્સએપ પર શેર કરો', hi: 'व्हाट्सएप પર શેર करें' })}
          className="group inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] hover:shadow-[0_4px_12px_rgba(37,211,102,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 font-bold text-xs transition-all duration-200 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-current shrink-0 transition-transform duration-200 group-hover:scale-115">
            <path d="M12.01 0a12 12 0 0 0-10.4 18l-1.6 5.8 6-1.6a12 12 0 1 0 6-22.2z" />
            <path fill="#FFF" d="M16.9 14.1c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5 0-.2-.1-.4-.2-.6-.2-.4-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5H8c-.2 0-.6.1-.9.4C6.8 7.3 6 8.1 6 9.8c0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.5-.3z" />
          </svg>
          <span className="hidden sm:inline">{uiLabel(language, { en: 'WhatsApp', gu: 'વોટ્સએપ', hi: 'व्हाट्सएप' })}</span>
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          title={uiLabel(language, { en: 'Share on Facebook', gu: 'ફેસબુક પર શેર કરો', hi: 'ફેસબુક પર શેર करें' })}
          className="group inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/30 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] hover:shadow-[0_4px_12px_rgba(24,119,242,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 font-bold text-xs transition-all duration-200 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-current shrink-0 transition-transform duration-200 group-hover:scale-115">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="hidden sm:inline">Facebook</span>
        </a>

        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          title={uiLabel(language, { en: 'Share on X', gu: 'X પર શેર કરો', hi: 'X પર શેર करें' })}
          className="group inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 font-bold text-xs transition-all duration-200 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-current shrink-0 transition-transform duration-200 group-hover:scale-115">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="hidden sm:inline">X</span>
        </a>

        {/* Native Web Share */}
        {canShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            title={uiLabel(language, { en: 'Share', gu: 'શેર કરો', hi: 'શેર करें' })}
            className="group inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg bg-[#B3121B]/10 text-[#B3121B] border border-[#B3121B]/30 hover:bg-[#B3121B] hover:text-white hover:border-[#B3121B] hover:shadow-[0_4px_12px_rgba(179,18,27,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 font-bold text-xs transition-all duration-200 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-none stroke-current stroke-2 shrink-0 transition-transform duration-200 group-hover:scale-115 group-hover:rotate-6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="hidden sm:inline">{uiLabel(language, { en: 'Share', gu: 'શેર કરો', hi: 'શેર' })}</span>
          </button>
        )}

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? uiLabel(language, { en: 'Copied', gu: 'કૉપિ થઈ ગઈ', hi: 'કોપી હો ગઈ' }) : uiLabel(language, { en: 'Copy Link', gu: 'લિંક કૉપિ કરો', hi: 'લિન્ક કોપી કરેં' })}
          className={`group inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-2.5 sm:px-3 rounded-lg font-bold text-xs transition-all duration-200 shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer border ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.35)]'
              : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
          }`}
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-none stroke-current stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="hidden sm:inline">{uiLabel(language, { en: 'Copied!', gu: 'કૉપિ થઈ ગઈ!', hi: 'કોપી હુઆ!' })}</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-none stroke-current stroke-2 shrink-0 transition-transform duration-200 group-hover:scale-115" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="hidden sm:inline">{uiLabel(language, { en: 'Copy Link', gu: 'લિંક કૉપિ', hi: 'લિન્ક કોપી' })}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
