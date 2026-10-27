'use client';

import React, { useState, useEffect } from 'react';
import type { Language } from '@/types';
import { 
  getFacebookShareHref, 
  getTwitterShareHref, 
  getWhatsAppShareHref, 
  getPublicShareUrl 
} from '@/lib/facebookShare';
import { playArticleAudio, stopArticleAudio } from '@/lib/articleTtsPlayer';

export interface ArticleShareAudioBarProps {
  title: string;
  articleUrl: string;
  body?: string;
  language?: Language;
  copied?: boolean;
  copyUrl?: () => void;
  saved?: boolean;
  handleToggleSave?: () => void;
  speaking?: boolean;
  toggleAudio?: () => void;
  isApk?: boolean;
  uiLabel?: (language: Language, values: { en: string; gu: string; hi: string }) => string;
  className?: string;
  audioText?: string;
}

export default function ArticleShareAudioBar({
  title,
  articleUrl,
  body,
  language = 'gu',
  copied,
  copyUrl,
  saved,
  handleToggleSave,
  speaking,
  toggleAudio,
  isApk = false,
  uiLabel,
  className = '',
  audioText,
}: ArticleShareAudioBarProps) {
  const [internalCopied, setInternalCopied] = useState(false);
  const [internalSaved, setInternalSaved] = useState(false);
  const [internalSpeaking, setInternalSpeaking] = useState(false);

  useEffect(() => {
    if (saved === undefined && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('gp-saved-articles');
        const parsed = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed) && parsed.includes(articleUrl)) {
          setInternalSaved(true);
        }
      } catch {}
    }
  }, [articleUrl, saved]);

  // If language changes while internal audio is speaking, seamlessly re-speak in new language
  useEffect(() => {
    if (toggleAudio === undefined && internalSpeaking) {
      stopArticleAudio();
      playArticleAudio({
        title,
        body: body || audioText,
        language,
        onStart: () => setInternalSpeaking(true),
        onEnd: () => setInternalSpeaking(false),
        onError: () => setInternalSpeaking(false),
      });
    }
  }, [language, internalSpeaking, title, body, audioText, toggleAudio]);

  const ui = (values: { en: string; gu: string; hi: string }) => {
    if (uiLabel) return uiLabel(language, values);
    return values[language] || values.gu || values.en;
  };

  const isCopied = copied !== undefined ? copied : internalCopied;
  const isSaved = saved !== undefined ? saved : internalSaved;
  const isSpeaking = speaking !== undefined ? speaking : internalSpeaking;

  const handleCopy = async () => {
    if (copyUrl) {
      copyUrl();
      return;
    }
    const publicUrl = getPublicShareUrl(articleUrl);
    try {
      await navigator.clipboard.writeText(publicUrl);
      setInternalCopied(true);
      setTimeout(() => setInternalCopied(false), 2000);
    } catch {
      window.prompt('Copy link:', publicUrl);
    }
  };

  const onToggleSave = () => {
    if (handleToggleSave) {
      handleToggleSave();
      return;
    }
    const next = !isSaved;
    setInternalSaved(next);
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      let parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) parsed = [];
      if (next) {
        if (!parsed.includes(articleUrl)) parsed.push(articleUrl);
      } else {
        parsed = parsed.filter((u: string) => u !== articleUrl);
      }
      localStorage.setItem('gp-saved-articles', JSON.stringify(parsed));
      window.dispatchEvent(new Event('gp-saved-changed'));
    } catch {}
  };

  const onToggleAudio = () => {
    if (toggleAudio) {
      toggleAudio();
      return;
    }
    if (isSpeaking) {
      stopArticleAudio();
      setInternalSpeaking(false);
      return;
    }
    playArticleAudio({
      title,
      body: body || audioText,
      language,
      onStart: () => setInternalSpeaking(true),
      onEnd: () => setInternalSpeaking(false),
      onError: () => setInternalSpeaking(false),
    });
  };

  const onPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      suppressHydrationWarning
      className={`share-row-custom select-none flex flex-wrap items-center gap-2.5 sm:gap-3 py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm ${className}`}
    >
      {/* Label with pastel pink/red dot */}
      <div className="flex items-center gap-1.5 select-none shrink-0 mr-0.5 sm:mr-1">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FCE8E8] dark:bg-red-950/60 border border-[#F5C2C7] dark:border-red-800/40 shrink-0 inline-block" />
        <span className="lbl font-black text-neutral-900 dark:text-neutral-100 text-[13px] sm:text-[14px] tracking-wide select-none">
          {ui({ en: 'Share:', gu: 'શેર કરો:', hi: 'શેર કરેં:' })}
        </span>
      </div>

      {/* WhatsApp */}
      <a
        href={getWhatsAppShareHref(articleUrl, title)}
        target="_blank"
        rel="noreferrer"
        title={ui({ en: 'WhatsApp', gu: 'વોટ્સએપ', hi: 'व्हाट्सएप' })}
        aria-label="Share on WhatsApp"
        className="group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#25D366] hover:shadow-[0_4px_12px_rgba(37,211,102,0.3)]"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110">
          <path fill="#25D366" d="M12.01 0a12 12 0 0 0-10.4 18l-1.6 5.8 6-1.6a12 12 0 1 0 6-22.2z" />
          <path fill="#FFF" d="M16.9 14.1c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5 0-.2-.1-.4-.2-.6-.2-.4-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5H8c-.2 0-.6.1-.9.4C6.8 7.3 6 8.1 6 9.8c0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.5-.3z" />
        </svg>
      </a>

      {/* Facebook */}
      <a
        href={getFacebookShareHref(articleUrl)}
        target="_blank"
        rel="noreferrer"
        title="Facebook"
        aria-label="Share on Facebook"
        className="group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#1877F2] hover:shadow-[0_4px_12px_rgba(24,119,242,0.3)]"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-[#1877F2] transition-transform duration-200 group-hover:scale-110" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      {/* X */}
      <a
        href={getTwitterShareHref(articleUrl, title)}
        target="_blank"
        rel="noreferrer"
        title="Share on X"
        aria-label="Share on X"
        className="group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-black dark:hover:border-white"
      >
        <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] text-black dark:text-white transition-transform duration-200 group-hover:scale-110" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* Dailyhunt (4-color pinwheel) */}
      <a
        href="https://m.dailyhunt.in/news/india/gujarati/gujarat-post-epaper-gujpost"
        target="_blank"
        rel="noreferrer"
        title={ui({ en: 'Dailyhunt', gu: 'ડેઈલીહન્ટ', hi: 'डेलीहंट' })}
        aria-label="Dailyhunt"
        className="group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#FBBC05]"
      >
        <svg viewBox="0 0 48 48" className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110">
          <path fill="#093492" d="M20.99 12.49 C21.62 14.48 21.86 21.86 21.86 21.86 C21.86 21.86 14.15 21.83 12.51 21.18 C8.59 19.61 5.5 17.07 5.5 13.08 C5.5 9.13 8.64 5.64 12.94 5.64 C17.17 5.64 19.77 8.69 20.99 12.49 Z" />
          <path fill="#FBBC05" d="M35.51 20.99 C33.52 21.62 26.14 21.86 26.14 21.86 C26.14 21.86 26.17 14.15 26.82 12.51 C28.39 8.59 30.93 5.5 34.92 5.5 C38.87 5.5 42.36 8.64 42.36 12.94 C42.36 17.17 39.31 19.77 35.51 20.99 Z" />
          <path fill="#ED1C24" d="M27.01 35.51 C26.38 33.52 26.14 26.14 26.14 26.14 C26.14 26.14 33.85 26.17 35.49 26.82 C39.41 28.39 42.5 30.93 42.5 34.92 C42.5 38.87 39.36 42.36 35.06 42.36 C30.83 42.36 28.23 39.31 27.01 35.51 Z" />
          <path fill="#47B609" d="M12.49 27.01 C14.48 26.38 21.86 26.14 21.86 26.14 C21.86 26.14 21.83 33.85 21.18 35.49 C19.61 39.41 17.07 42.5 13.08 42.5 C9.13 42.5 5.64 39.36 5.64 35.06 C5.64 30.83 8.69 28.23 12.49 27.01 Z" />
        </svg>
      </a>

      {/* Print */}
      <button
        type="button"
        onClick={onPrint}
        title={ui({ en: 'Print', gu: 'પ્રિન્ટ', hi: 'प्रिंट' })}
        aria-label="Print"
        className="group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-neutral-400 dark:hover:border-neutral-500"
      >
        <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-none stroke-current stroke-2 text-neutral-800 dark:text-neutral-200 shrink-0 transition-transform duration-200 group-hover:scale-110" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      </button>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopy}
        title={isCopied ? ui({ en: 'Copied', gu: 'કૉપિ થઈ ગઈ', hi: 'कॉपी हो गई' }) : ui({ en: 'Copy Link', gu: 'લિંક કૉપિ કરો', hi: 'लिंक कॉपी करें' })}
        aria-label="Copy Link"
        className={`group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
          isCopied
            ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 shadow-[0_4px_12px_rgba(16,185,129,0.35)]'
            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B]'
        }`}
      >
        {isCopied ? (
          <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-none stroke-current stroke-[2.5] text-emerald-600 shrink-0 animate-bounce" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-none stroke-current stroke-2 text-neutral-800 dark:text-neutral-200 shrink-0 transition-transform duration-200 group-hover:scale-110" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>

      {/* Save / Bookmark */}
      <button
        type="button"
        onClick={onToggleSave}
        title={isSaved ? ui({ en: 'Saved', gu: 'સાચવેલું', hi: 'सहेजा गया' }) : ui({ en: 'Save', gu: 'સાચવો', hi: 'सहेजें' })}
        aria-label="Save"
        className={`group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
          isSaved
            ? 'border-[#B3121B] bg-red-50 text-[#B3121B] dark:bg-red-950/40'
            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B]'
        }`}
      >
        <svg viewBox="0 0 24 24" className={`w-[17px] h-[17px] shrink-0 ${isSaved ? 'fill-[#B3121B] text-[#B3121B]' : 'fill-none text-neutral-800 dark:text-neutral-200'} stroke-current stroke-2 transition-transform duration-200 group-hover:scale-110`} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Audio / Speaker */}
      <button
        type="button"
        onClick={onToggleAudio}
        title={isSpeaking ? ui({ en: 'Stop', gu: 'બંધ કરો', hi: 'रोकें' }) : ui({ en: 'Audio', gu: 'ઑડિયો', hi: 'ऑडियो' })}
        aria-label="Listen to Content"
        className={`group relative flex items-center justify-center w-[34px] h-[34px] xs:w-[36px] xs:h-[36px] sm:w-[38px] sm:h-[38px] md:w-10 md:h-10 shrink-0 rounded-full border transition-all duration-200 hover:scale-[1.12] hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
          isSpeaking
            ? 'border-[#B3121B] bg-red-50 text-[#B3121B] dark:bg-red-950/40 animate-pulse'
            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B]'
        }`}
      >
        <svg viewBox="0 0 24 24" className={`w-[17px] h-[17px] fill-none stroke-current stroke-2 shrink-0 transition-transform duration-200 ${isSpeaking ? 'text-[#B3121B] animate-bounce' : 'text-neutral-800 dark:text-neutral-200 group-hover:scale-110'}`} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      </button>
    </div>
  );
}
