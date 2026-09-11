'use client';

import React from 'react';
import type { Language } from '@/types';

interface ArticleShareAudioBarProps {
  title: string;
  articleUrl: string;
  language: Language;
  copied: boolean;
  copyUrl: () => void;
  saved: boolean;
  handleToggleSave: () => void;
  speaking: boolean;
  toggleAudio: () => void;
  isApk: boolean;
  uiLabel: (language: Language, values: { en: string; gu: string; hi: string }) => string;
}

export default function ArticleShareAudioBar({
  title,
  articleUrl,
  language,
  copied,
  copyUrl,
  saved,
  handleToggleSave,
  speaking,
  toggleAudio,
  isApk,
  uiLabel,
}: ArticleShareAudioBarProps) {
  return (
    <div className="share-row-custom select-none flex flex-wrap gap-3 items-center mb-6 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm backdrop-blur-sm">
      <span className="lbl font-black text-neutral-900 dark:text-neutral-100 mr-1 text-[14px] tracking-wide uppercase flex items-center gap-1.5 select-none">
        <span className="h-2 w-2 rounded-full bg-[#B3121B] animate-ping" />
        {uiLabel(language, { en: 'Share:', gu: 'શેર કરો:', hi: 'शेयर करें:' })}
      </span>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${articleUrl}`)}`}
        target="_blank"
        rel="noreferrer"
        title={uiLabel(language, { en: 'WhatsApp', gu: 'વોટ્સએપ', hi: 'व्हाट्सएप' })}
        className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(37,211,102,0.35)] hover:border-[#25D366]"
      >
        <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
          <path fill="#25D366" d="M12.01 0a12 12 0 0 0-10.4 18l-1.6 5.8 6-1.6a12 12 0 1 0 6-22.2z" />
          <path fill="#FFF" d="M16.9 14.1c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5 0-.2-.1-.4-.2-.6-.2-.4-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5H8c-.2 0-.6.1-.9.4C6.8 7.3 6 8.1 6 9.8c0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.5-.3z" />
        </svg>
      </a>

      {/* Dailyhunt */}
      <a
        href="https://profile.dailyhunt.in/gujaratpost"
        target="_blank"
        rel="noreferrer"
        title={uiLabel(language, { en: 'Dailyhunt', gu: 'ડેઈલીહન્ટ', hi: 'डेलीहंट' })}
        className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(251,188,5,0.35)] hover:border-[#FBBC05]"
      >
        <svg viewBox="0 0 48 48" className="w-[21px] h-[21px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
          <path fill="#093492" d="M20.99 12.49 C21.62 14.48 21.86 21.86 21.86 21.86 C21.86 21.86 14.15 21.83 12.51 21.18 C8.59 19.61 5.5 17.07 5.5 13.08 C5.5 9.13 8.64 5.64 12.94 5.64 C17.17 5.64 19.77 8.69 20.99 12.49 Z" />
          <path fill="#FBBC05" d="M35.51 20.99 C33.52 21.62 26.14 21.86 26.14 21.86 C26.14 21.86 26.17 14.15 26.82 12.51 C28.39 8.59 30.93 5.5 34.92 5.5 C38.87 5.5 42.36 8.64 42.36 12.94 C42.36 17.17 39.31 19.77 35.51 20.99 Z" />
          <path fill="#ED1C24" d="M27.01 35.51 C26.38 33.52 26.14 26.14 26.14 26.14 C26.14 26.14 33.85 26.17 35.49 26.82 C39.41 28.39 42.5 30.93 42.5 34.92 C42.5 38.87 39.36 42.36 35.06 42.36 C30.83 42.36 28.23 39.31 27.01 35.51 Z" />
          <path fill="#47B609" d="M12.49 27.01 C14.48 26.38 21.86 26.14 21.86 26.14 C21.86 26.14 21.83 33.85 21.18 35.49 C19.61 39.41 17.07 42.5 13.08 42.5 C9.13 42.5 5.64 39.36 5.64 35.06 C5.64 30.83 8.69 28.23 12.49 27.01 Z" />
        </svg>
      </a>

      {/* Google News */}
      <a
        href="https://news.google.com/search?q=Gujarat+Post"
        target="_blank"
        rel="noreferrer"
        title={uiLabel(language, { en: 'Google News', gu: 'ગૂગલ ન્યૂઝ', hi: 'गूगल न्यूज़' })}
        className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(66,133,244,0.35)] hover:border-[#4285F4]"
      >
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
          <rect x="2" y="2" width="8" height="20" rx="1.5" fill="#4285F4" />
          <rect x="12" y="3" width="10" height="3.5" rx="1" fill="#EA4335" />
          <rect x="12" y="9" width="10" height="3.5" rx="1" fill="#FBBC05" />
          <rect x="12" y="15" width="10" height="6" rx="1" fill="#34A853" />
        </svg>
      </a>

      {/* Print */}
      <button
        type="button"
        onClick={() => window.print()}
        title={uiLabel(language, { en: 'Print', gu: 'પ્રિન્ટ', hi: 'प्रिंट' })}
        className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2 shrink-0 transition-transform duration-300 group-hover:rotate-[-12deg]" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      </button>

      {/* Copy Link */}
      <button
        type="button"
        onClick={copyUrl}
        title={copied ? uiLabel(language, { en: 'Copied', gu: 'કૉપિ થઈ', hi: 'कॉपी हुआ' }) : uiLabel(language, { en: 'Copy Link', gu: 'લિંક કૉપિ કરો', hi: 'लिंक कॉपी करें' })}
        className={`group relative flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm ${copied
          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 shadow-[0_8px_20px_rgba(16,185,129,0.35)] scale-110'
          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B] hover:text-[#B3121B] hover:shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
          }`}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-[2.5] shrink-0 animate-bounce">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2 shrink-0 transition-transform duration-300 group-hover:rotate-[15deg]" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>

      {/* Save / Bookmark (Hidden in APK view) */}
      {!isApk && (
        <button
          type="button"
          onClick={handleToggleSave}
          title={saved ? uiLabel(language, { en: 'Saved', gu: 'સાચવેલું', hi: 'सहेजा गया' }) : uiLabel(language, { en: 'Save', gu: 'સાચવો', hi: 'सहेजें' })}
          className={`group relative flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm ${saved
            ? 'border-[#B3121B] bg-red-50 text-[#B3121B] dark:bg-red-950/40 shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B] hover:text-[#B3121B] hover:shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
            }`}
        >
          <svg viewBox="0 0 24 24" className={`w-[18px] h-[18px] shrink-0 ${saved ? 'fill-current' : 'fill-none'} stroke-current stroke-2 transition-transform duration-300 group-hover:scale-110`} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Audio / Speaker */}
      <button
        type="button"
        onClick={toggleAudio}
        title={speaking ? uiLabel(language, { en: 'Stop', gu: 'બંધ કરો', hi: 'रोकें' }) : uiLabel(language, { en: 'Audio', gu: 'ઑડિયો', hi: 'ऑडियो' })}
        className={`group relative flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm ${speaking
          ? 'border-[#B3121B] bg-red-50 text-[#B3121B] dark:bg-red-950/40 shadow-[0_8px_20px_rgba(179,18,27,0.35)] animate-pulse'
          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B] hover:text-[#B3121B] hover:shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
          }`}
      >
        <svg viewBox="0 0 24 24" className={`w-[18px] h-[18px] fill-none stroke-current stroke-2 shrink-0 transition-transform duration-300 ${speaking ? 'animate-bounce' : 'group-hover:rotate-[12deg]'}`} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      </button>
    </div>
  );
}
