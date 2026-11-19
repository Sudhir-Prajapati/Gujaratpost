'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getHeroSettings } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { useAutoTranslate } from '@/lib/translate';
import type { Language } from '@/types';

export interface BreakingSlide {
  id: string;
  image: string;
  images?: string[];
  link?: string;
  texts: string[];
}

export interface BreakingBannerConfig {
  enabled: boolean;
  badgeText: string;
  liveUpdateText?: string;
  intervalSeconds: number;
  slides: BreakingSlide[];
}

export const DEFAULT_BREAKING_BANNER: BreakingBannerConfig = {
  enabled: true,
  badgeText: 'BREAKING NEWS',
  liveUpdateText: 'લાઇવ અપડેટ્સ',
  intervalSeconds: 4,
  slides: [
    {
      id: 'slide-1',
      image: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=1200&q=80',
      ],
      link: '',
      texts: [
        'ગુજરાતમાં આગામી ૪૮ કલાક ભારે વરસાદની હવામાન વિભાગની આગાહી',
        'દિલ્હીમાં પ્રદૂષણનો સ્તર વધ્યો, GRAP લાગુ',
        'શેર બજારમાં સેન્સેક્સ 700 પોઇન્ટ વધ્યો',
      ],
    },
    {
      id: 'slide-2',
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
      ],
      link: '',
      texts: [
        'દક્ષિણ ગુજરાત અને સૌરાષ્ટ્રના દરિયાકાંઠાના વિસ્તારોમાં યલો એલર્ટ જાહેર કરાયું',
        'માછીમારોને આગામી સૂચના સુધી દરિયો ન ખેડવા હવામાન કેન્દ્રની ચેતવણી',
      ],
    },
  ],
};

interface BreakingNewsShowcaseProps {
  initialConfig?: BreakingBannerConfig | null;
  /** Set true when rendered inside admin panel for live editing & preview */
  previewMode?: boolean;
  previewConfig?: BreakingBannerConfig | null;
}

/**
 * Formats broadcast headlines by highlighting numbers, currencies, percentages,
 * and quoted phrases in brilliant golden yellow (#FFD700) matching professional TV news graphics.
 */
function renderHighlightedHeadline(text: string) {
  if (!text) return null;
  // Match numbers (including decimals, commas, e.g. 2.30, 1,000), currencies (₹, $, રૂ.),
  // units (e.g. કરોડ, લાખ, ટકા, %), or text wrapped in quotes
  const regex = /(₹\s*[\d,.]+|રૂ\.\s*[\d,.]+|\$?\d+(?:[.,]\d+)*(?:\s*(?:%|કરોડ|લાખ|હજાર|ટકા|પોઇન્ટ))?|["'‘“][^"'’”]+["'’”])/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;
    const isHighlight =
      /^[₹$]/.test(part) ||
      /^રૂ\./.test(part) ||
      /\d/.test(part) ||
      /^["'‘“]/.test(part);

    if (isHighlight) {
      return (
        <span
          key={index}
          className="text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.65)] font-black"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Renders the prominent 3D television-news-style header badge:
 * Skewed container, glossy bevel, red pill for BREAKING (with white bold italic text),
 * and white pill for NEWS (with dark bold italic text).
 */
function renderTvBreakingHeader(badgeText: string) {
  const clean = (badgeText || 'BREAKING NEWS').trim();
  const parts = clean.split(/\s+/);
  const firstWord = parts.length >= 2 ? parts[0] : clean;
  const restWord = parts.length >= 2 ? parts.slice(1).join(' ') : '';

  return (
    <div className="relative inline-flex items-center justify-center select-none py-1">
      {/* Background ambient red glow */}
      <div className="absolute inset-0 bg-[#ff2000]/70 blur-xl rounded-2xl scale-125 pointer-events-none" />

      {/* 3D Skewed Television News Badge */}
      <div className="relative flex items-center overflow-hidden rounded-xl sm:rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.9),0_0_25px_rgba(255,40,40,0.6)] border border-white/50 transform -skew-x-12">
        {/* BREAKING (Red) */}
        <div className="relative bg-gradient-to-b from-[#ff3322] via-[#cc1108] to-[#800700] text-white font-black italic tracking-wider text-xl sm:text-2xl md:text-3xl lg:text-[38px] px-6 sm:px-8 md:px-10 py-1.5 sm:py-2.5 flex items-center justify-center">
          {/* Top Gloss Highlight */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
          <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase transform skew-x-12">
            {firstWord}
          </span>
        </div>

        {/* NEWS (White) */}
        {restWord ? (
          <div className="relative bg-gradient-to-b from-white via-zinc-50 to-zinc-200 text-zinc-950 font-black italic tracking-wider text-xl sm:text-2xl md:text-3xl lg:text-[38px] px-6 sm:px-8 md:px-10 py-1.5 sm:py-2.5 flex items-center justify-center border-l-2 border-black/20">
            {/* Top Gloss Highlight */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/95 to-transparent pointer-events-none" />
            <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] uppercase transform skew-x-12">
              {restWord}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Dotted world map overlay in television broadcast ruby/red, rendered in the top-right quadrant.
 */
function DottedWorldMap() {
  return (
    <div className="pointer-events-none absolute -top-2 -right-4 sm:right-2 w-56 sm:w-72 md:w-88 h-32 sm:h-40 md:h-48 opacity-35 select-none overflow-hidden">
      <svg viewBox="0 0 320 160" className="w-full h-full">
        <defs>
          <pattern id="worldDotsPattern" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.3" fill="rgba(255, 75, 75, 0.75)" />
          </pattern>
        </defs>
        <g fill="url(#worldDotsPattern)">
          {/* Eurasia & Europe */}
          <path d="M130,25 Q150,15 180,22 Q220,15 250,22 Q275,32 265,55 Q245,65 230,55 Q210,65 195,50 Q175,65 155,55 Q135,45 130,25 Z" />
          {/* Middle East & India */}
          <path d="M175,45 Q190,40 205,48 Q215,65 200,80 Q190,85 185,75 Q175,65 175,45 Z" />
          {/* East Asia & SE Asia */}
          <path d="M215,45 Q245,35 260,50 Q265,75 245,85 Q225,80 215,65 Z" />
          {/* Africa */}
          <path d="M140,55 Q165,50 175,65 Q175,95 160,115 Q145,115 135,90 Q130,75 140,55 Z" />
          {/* Australia */}
          <path d="M245,95 Q275,90 280,105 Q275,125 255,125 Q240,115 245,95 Z" />
          {/* Americas background */}
          <path d="M30,25 Q60,15 75,35 Q65,60 50,55 Q35,70 30,50 Z" />
          <path d="M55,75 Q75,70 80,90 Q75,120 60,120 Q50,100 55,75 Z" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Diagonal red light streaks across the top-left area.
 */
function DiagonalLightStreaks() {
  return (
    <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 overflow-hidden select-none">
      {/* Broad glow beam */}
      <div className="absolute -top-12 -left-12 w-[600px] h-32 bg-gradient-to-r from-transparent via-[#ff3b30]/35 to-transparent transform -rotate-45 blur-md" />
      {/* Bright sharp streaks */}
      <div className="absolute top-10 -left-10 w-[500px] h-[3px] bg-gradient-to-r from-transparent via-white/80 via-[#ff6b6b] to-transparent transform -rotate-45 blur-[0.5px]" />
      <div className="absolute top-20 -left-10 w-[550px] h-[2px] bg-gradient-to-r from-transparent via-[#ff8888]/70 to-transparent transform -rotate-45 blur-[1px]" />
      <div className="absolute top-36 -left-10 w-[600px] h-[4px] bg-gradient-to-r from-transparent via-[#ff2200]/50 to-transparent transform -rotate-45 blur-xs" />
    </div>
  );
}

function getBadgeForLang(raw: string, lang: Language): string {
  const t = (raw || '').trim();
  const lower = t.toLowerCase();
  if (lower === 'breaking news' || lower === 'breakingnews') {
    if (lang === 'hi') return 'ब्रेकिंग न्यूज़';
    return 'BREAKING NEWS';
  }
  if (t === 'બ્રેકિંગ ન્યૂઝ') {
    if (lang === 'hi') return 'ब्रेकिंग न्यूज़';
    if (lang === 'en') return 'BREAKING NEWS';
    return 'બ્રેકિંગ ન્યૂઝ';
  }
  if (t === 'લાઈવ સમાચાર' || t === 'લાઇવ સમાચાર') {
    if (lang === 'hi') return 'लाइव समाचार';
    if (lang === 'en') return 'LIVE NEWS';
    return 'લાઇવ સમાચાર';
  }
  if (t === 'ખાસ અહેવાલ') {
    if (lang === 'hi') return 'विशेष रिपोर्ट';
    if (lang === 'en') return 'SPECIAL REPORT';
    return 'ખાસ અહેવાલ';
  }
  return '';
}

export default function BreakingNewsShowcase({
  initialConfig,
  previewMode = false,
  previewConfig,
}: BreakingNewsShowcaseProps) {
  const [config, setConfig] = useState<BreakingBannerConfig>(() => {
    if (previewMode && previewConfig) return previewConfig;
    if (initialConfig && typeof initialConfig === 'object') {
      return {
        enabled: Boolean(initialConfig.enabled),
        badgeText: initialConfig.badgeText || 'BREAKING NEWS',
        liveUpdateText: initialConfig.liveUpdateText || DEFAULT_BREAKING_BANNER.liveUpdateText,
        intervalSeconds: Number(initialConfig.intervalSeconds) || 4,
        slides: Array.isArray(initialConfig.slides) && initialConfig.slides.length > 0
          ? initialConfig.slides
          : DEFAULT_BREAKING_BANNER.slides,
      };
    }
    return DEFAULT_BREAKING_BANNER;
  });

  // Sync when previewConfig changes in admin
  useEffect(() => {
    if (previewMode && previewConfig) {
      setConfig({
        enabled: Boolean(previewConfig.enabled),
        badgeText: previewConfig.badgeText || 'BREAKING NEWS',
        liveUpdateText: previewConfig.liveUpdateText || '',
        intervalSeconds: Number(previewConfig.intervalSeconds) || 4,
        slides: Array.isArray(previewConfig.slides) && previewConfig.slides.length > 0
          ? previewConfig.slides
          : DEFAULT_BREAKING_BANNER.slides,
      });
    }
  }, [previewMode, previewConfig]);

  // Sync client-side live updates from public API when not preview
  useEffect(() => {
    if (previewMode) return;

    let mounted = true;
    const fetchLatest = async () => {
      try {
        const heroRes = await getHeroSettings(true);
        if (!mounted || !heroRes) return;

        const isEnabled = (heroRes as any)?.breakingBannerEnabled ?? (heroRes as any)?.setting?.breakingBannerEnabled ?? false;
        const rawJson = (heroRes as any)?.breakingBannerJson || (heroRes as any)?.setting?.breakingBannerJson;
        let parsed: any = {};
        if (typeof rawJson === 'string' && rawJson.trim()) {
          try { parsed = JSON.parse(rawJson); } catch {}
        } else if (typeof rawJson === 'object' && rawJson !== null) {
          parsed = rawJson;
        }

        setConfig({
          enabled: Boolean(isEnabled),
          badgeText: parsed?.badgeText || 'BREAKING NEWS',
          liveUpdateText: parsed?.liveUpdateText || '',
          intervalSeconds: Number(parsed?.intervalSeconds) || 4,
          slides: Array.isArray(parsed?.slides) && parsed.slides.length > 0
            ? parsed.slides
            : DEFAULT_BREAKING_BANNER.slides,
        });
      } catch {}
    };

    const handleFocus = () => fetchLatest();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleFocus);
    window.addEventListener('gp-articles-updated', fetchLatest);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('gp-admin-updates');
        channel.onmessage = (event) => {
          if (event?.data?.type === 'BREAKING_BANNER_UPDATED' && event.data.config) {
            setConfig({
              enabled: Boolean(event.data.enabled),
              badgeText: event.data.config.badgeText || 'BREAKING NEWS',
              liveUpdateText: event.data.config.liveUpdateText || '',
              intervalSeconds: Number(event.data.config.intervalSeconds) || 4,
              slides: Array.isArray(event.data.config.slides) && event.data.config.slides.length > 0
                ? event.data.config.slides
                : DEFAULT_BREAKING_BANNER.slides,
            });
          }
          fetchLatest();
        };
      } catch {}
    }

    return () => {
      mounted = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleFocus);
      window.removeEventListener('gp-articles-updated', fetchLatest);
      if (channel) {
        channel.close();
      }
    };
  }, [previewMode]);

  // Effective config (real-time synchronous updates in admin preview mode without state delay)
  const effectiveConfig = (previewMode && previewConfig) ? previewConfig : config;

  // Active slides filter
  const activeSlides = useMemo(() => {
    const list = Array.isArray(effectiveConfig.slides) && effectiveConfig.slides.length > 0
      ? effectiveConfig.slides.filter(
          (s) =>
            s &&
            ((Array.isArray(s.texts) && s.texts.some((t) => typeof t === 'string' && t.trim())) ||
              (s.image && s.image.trim()) ||
              (Array.isArray(s.images) && s.images.some((img) => typeof img === 'string' && img.trim())))
        )
      : [];
    return list.length > 0 ? list : DEFAULT_BREAKING_BANNER.slides;
  }, [effectiveConfig.slides]);

  const [slideIndex, setSlideIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isTextExiting, setIsTextExiting] = useState(false);

  // Keep indices in bounds if slides change
  useEffect(() => {
    if (slideIndex >= activeSlides.length) {
      setSlideIndex(0);
      setStepIndex(0);
    }
  }, [activeSlides.length, slideIndex]);

  const currentSlide = activeSlides[slideIndex] || activeSlides[0];

  const slideTexts = useMemo(() => {
    if (!currentSlide || !Array.isArray(currentSlide.texts)) return ['બ્રેકિંગ ન્યૂઝ વિગત'];
    const valid = currentSlide.texts.filter((t) => typeof t === 'string' && t.trim());
    return valid.length > 0 ? valid : ['બ્રેકિંગ ન્યૂઝ વિગત'];
  }, [currentSlide]);

  const currentSlideImages = useMemo(() => {
    if (!currentSlide) return [];
    if (Array.isArray(currentSlide.images) && currentSlide.images.length > 0) {
      const valid = currentSlide.images.filter((img) => typeof img === 'string' && img.trim() !== '');
      if (valid.length > 0) return valid;
    }
    if (currentSlide.image && currentSlide.image.trim() !== '') {
      return [currentSlide.image.trim()];
    }
    return [];
  }, [currentSlide]);

  const totalSteps = Math.max(slideTexts.length, currentSlideImages.length || 1);

  // Keep stepIndex in bounds
  useEffect(() => {
    if (stepIndex >= totalSteps) {
      setStepIndex(0);
    }
  }, [totalSteps, stepIndex]);

  // Reset stepIndex on slideIndex change
  useEffect(() => {
    setStepIndex(0);
  }, [slideIndex]);

  const textIndex = slideTexts.length > 0 ? (stepIndex % slideTexts.length) : 0;
  const currentText = slideTexts[textIndex] || slideTexts[0] || '';
  const hasImage = currentSlideImages.length > 0;

  const { language } = useApp();

  // Dynamic Badge Translation
  const rawBadge = (effectiveConfig.badgeText || 'BREAKING NEWS').trim();
  const presetBadge = getBadgeForLang(rawBadge, language);
  const autoTranslatedBadge = useAutoTranslate(rawBadge, language);
  const displayedBadge = language === 'gu'
    ? rawBadge
    : (presetBadge || autoTranslatedBadge || rawBadge);

  // Dynamic Headline Translation
  const translatedHeadline = useAutoTranslate(currentText, language);
  const displayedHeadline = (language === 'gu' ? currentText : (translatedHeadline || currentText)) || currentText;

  // Step to the next headline point / image, or to next slide if all steps finished
  const advanceNext = useCallback(() => {
    if (activeSlides.length === 0) return;
    const currSlide = activeSlides[slideIndex] || activeSlides[0];
    const texts = (currSlide?.texts || []).filter((t) => typeof t === 'string' && t.trim());
    const imgs = (Array.isArray(currSlide?.images) && currSlide.images.length > 0)
      ? currSlide.images.filter((img) => typeof img === 'string' && img.trim() !== '')
      : (currSlide?.image && currSlide.image.trim() !== '' ? [currSlide.image.trim()] : []);

    const numTexts = texts.length > 0 ? texts.length : 1;
    const numImgs = imgs.length > 0 ? imgs.length : 1;
    const maxSteps = Math.max(numTexts, numImgs);

    setIsTextExiting(true);
    setTimeout(() => {
      if (stepIndex + 1 < maxSteps) {
        setStepIndex((prev) => prev + 1);
      } else {
        setSlideIndex((prev) => (prev + 1) % activeSlides.length);
        setStepIndex(0);
      }
      setTimeout(() => {
        setIsTextExiting(false);
      }, 40);
    }, 240);
  }, [activeSlides, slideIndex, stepIndex]);

  // Timer interval (Continuous broadcast ticker)
  useEffect(() => {
    if (activeSlides.length === 0) return;
    const duration = Math.max(2500, (effectiveConfig.intervalSeconds || 4) * 1000);
    const timer = setInterval(() => {
      advanceNext();
    }, duration);
    return () => clearInterval(timer);
  }, [advanceNext, effectiveConfig.intervalSeconds, activeSlides.length]);

  // If disabled and not preview, render nothing
  if (!effectiveConfig.enabled && !previewMode) {
    return null;
  }

  const slideLink = currentSlide?.link && currentSlide.link.trim() ? currentSlide.link.trim() : null;

  return (
    <section className="mx-auto max-w-screen-xl px-3 sm:px-4 py-2 sm:py-3 mb-4 sm:mb-6 w-full select-none">
      {/* ══════════════════════════════════════════════════════════════════════
           PREMIUM TV NEWS BREAKING BANNER (Exact Reference Match)
           ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#850000] via-[#520000] to-[#240000] p-3 sm:p-5 md:p-7 lg:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(180,0,0,0.4)] border border-[#ff3333]/30">

        {/* ─── 1. BACKGROUND TV STUDIO EFFECTS ─── */}
        {/* A. Radial Center Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,40,40,0.45)_0%,transparent_65%)]" />

        {/* B. Diagonal Red Light Streaks (Top Left) */}
        <DiagonalLightStreaks />

        {/* C. Dotted World Map (Top Right) */}
        <DottedWorldMap />

        {/* ─── 2. TOP HEADER BADGE (Centered BREAKING NEWS) ─── */}
        <div className="relative z-20 flex justify-center mb-4 sm:mb-6">
          {renderTvBreakingHeader(displayedBadge)}
        </div>

        {/* ─── 3. MAIN INNER CONTENT CARD (Glowing Red/Orange Border + Horizontal Lens Flares) ─── */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl border-[1.5px] border-[#ff3b30]/85 bg-gradient-to-br from-[#4a0002] via-[#2d0001] to-[#140000] p-3.5 sm:p-5 md:p-6 lg:p-7 shadow-[0_0_30px_rgba(255,30,30,0.45),inset_0_0_25px_rgba(255,0,0,0.3)] z-10">

          {/* Top Border Horizontal Lens Flare */}
          <div className="pointer-events-none absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-3/4 sm:w-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-200 via-white to-transparent blur-[0.5px]" />
          <div className="pointer-events-none absolute -top-[6px] left-1/2 -translate-x-1/2 w-16 sm:w-24 h-3 bg-white/90 blur-[3px] rounded-full" />

          {/* Bottom Border Horizontal Lens Flare */}
          <div className="pointer-events-none absolute -bottom-[1.5px] left-1/2 -translate-x-1/2 w-3/4 sm:w-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-200 via-white to-transparent blur-[0.5px]" />
          <div className="pointer-events-none absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-16 sm:w-24 h-3 bg-white/90 blur-[3px] rounded-full" />

          {/* Two-Column Layout (Left ~45% Media / Right ~55% Headline + Logo) */}
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-7 lg:gap-8">

            {/* ── LEFT SECTION: News Image / Media (Approx 45%) ── */}
            {hasImage && (
              <div className="w-full md:w-[45%] lg:w-[44%] shrink-0">
                <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] border-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.7)] overflow-hidden bg-black/85 flex items-center justify-center">
                  {activeSlides.map((slide, sIdx) => {
                    const slideImgs = (Array.isArray(slide.images) && slide.images.length > 0)
                      ? slide.images.filter((img) => typeof img === 'string' && img.trim() !== '')
                      : (slide.image && slide.image.trim() !== '' ? [slide.image.trim()] : []);

                    if (slideImgs.length === 0) return null;

                    return slideImgs.map((imgUrl, imgIdx) => {
                      const isImgActive = (sIdx === slideIndex) && (imgIdx === (stepIndex % slideImgs.length));
                      return (
                        <div
                          key={`${slide.id || sIdx}-img-${imgIdx}`}
                          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            isImgActive
                              ? 'opacity-100 z-10'
                              : 'opacity-0 pointer-events-none z-0'
                          }`}
                        >
                          {/* Ambient soft blurred backdrop of image */}
                          <Image
                            src={imgUrl}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 100vw, 550px"
                            className="object-cover blur-xl opacity-25 scale-105"
                            unoptimized
                            priority={sIdx === 0 && imgIdx === 0}
                          />

                          {/* Foreground sharp media maintaining original aspect ratio without cropping */}
                          <div className="relative w-full h-full p-1 sm:p-2 flex items-center justify-center">
                            <Image
                              src={imgUrl}
                              alt={slide.texts?.[0] || 'Breaking News'}
                              fill
                              sizes="(max-width: 768px) 100vw, 550px"
                              className="object-contain"
                              unoptimized
                              priority={sIdx === 0 && imgIdx === 0}
                            />
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            )}

            {/* ── RIGHT SECTION: Headline & Gujarat Post Logo (Approx 55% or 100% if no image) ── */}
            <div
              className={`w-full ${
                hasImage ? 'md:w-[55%] lg:w-[56%]' : 'w-full'
              } flex flex-col justify-between self-stretch min-h-[160px] sm:min-h-[200px] md:min-h-[240px]`}
            >
              {/* Headline with Thick Vertical Yellow Accent Bar */}
              <div className="flex items-start gap-3.5 sm:gap-4 md:gap-5 my-auto">
                {/* Vertical Yellow Accent Bar */}
                <div className="w-2 sm:w-2.5 bg-[#FFD700] rounded-full self-stretch shrink-0 shadow-[0_0_12px_rgba(255,215,0,0.7)]" />

                {/* Gujarati / English Headline with Yellow Highlight on Numbers */}
                {slideLink ? (
                  <Link
                    href={slideLink}
                    className="block group cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    <h2
                      className={`font-black text-2xl sm:text-3xl md:text-[34px] lg:text-[40px] xl:text-[44px] leading-[1.28] tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all duration-300 ${
                        isTextExiting
                          ? 'opacity-0 -translate-y-2'
                          : 'opacity-100 translate-y-0'
                      }`}
                    >
                      {renderHighlightedHeadline(displayedHeadline)}
                    </h2>
                  </Link>
                ) : (
                  <h2
                    className={`font-black text-2xl sm:text-3xl md:text-[34px] lg:text-[40px] xl:text-[44px] leading-[1.28] tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all duration-300 ${
                      isTextExiting
                        ? 'opacity-0 -translate-y-2'
                        : 'opacity-100 translate-y-0'
                    }`}
                  >
                    {renderHighlightedHeadline(displayedHeadline)}
                  </h2>
                )}
              </div>

              {/* Bottom-Right Gujarat Post Branding (Logo in crisp white rounded card) */}
              <div className="flex items-center justify-end mt-4 sm:mt-6">
                {slideLink ? (
                  <Link
                    href={slideLink}
                    className="bg-white rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-1.5 sm:py-2 shadow-lg border border-white/90 shrink-0 flex items-center justify-center hover:shadow-xl transition"
                    title="Gujarat Post"
                  >
                    <Image
                      src="/GujaratpostFinalLogo.png"
                      alt="Gujarat Post"
                      width={130}
                      height={30}
                      className="h-5 sm:h-6 md:h-7 w-auto object-contain"
                      priority
                    />
                  </Link>
                ) : (
                  <div className="bg-white rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-1.5 sm:py-2 shadow-lg border border-white/90 shrink-0 flex items-center justify-center">
                    <Image
                      src="/GujaratpostFinalLogo.png"
                      alt="Gujarat Post"
                      width={130}
                      height={30}
                      className="h-5 sm:h-6 md:h-7 w-auto object-contain"
                      priority
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
