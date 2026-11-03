'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Play, Radio, PenTool, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHeroSettings } from '@/lib/api';
import { useApp } from '@/components/AppProvider';
import { useAutoTranslate } from '@/lib/translate';
import type { Language } from '@/types';

export interface BreakingSlide {
  id: string;
  image: string;
  link?: string;
  texts: string[];
}

export interface BreakingBannerConfig {
  enabled: boolean;
  badgeText: string;
  intervalSeconds: number;
  slides: BreakingSlide[];
}

export const DEFAULT_BREAKING_BANNER: BreakingBannerConfig = {
  enabled: true,
  badgeText: 'BREAKING NEWS',
  intervalSeconds: 4,
  slides: [
    {
      id: 'slide-1',
      image: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=1200&q=80',
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


const BREAKING_I18N: Record<string, Record<Language, string>> = {
  visualReport: {
    gu: 'વિઝ્યુઅલ રિપોર્ટ',
    hi: 'विजुअल रिपोर्ट',
    en: 'Visual Report',
  },
  liveUpdate: {
    gu: 'લાઇવ અપડેટ્સ',
    hi: 'लाइव अपडेट्स',
    en: 'Live Updates',
  },
  brandName: {
    gu: 'ગુજરાત પોસ્ટ',
    hi: 'गुजरात पोस्ट',
    en: 'Gujarat Post',
  },
  readFull: {
    gu: 'સંપૂર્ણ વાંચો',
    hi: 'पूरा पढ़ें',
    en: 'Read More',
  },
};

/**
 * Renders the two-tone broadcast slanted badge matching the reference design:
 * Red slanted box for first word (e.g. BREAKING), white slanted box for rest (e.g. NEWS)
 * Prominently sized for impactful television broadcast presence.
 */
function renderBroadcastBadge(badgeText: string) {
  const clean = (badgeText || 'BREAKING NEWS').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    const firstWord = parts[0];
    const rest = parts.slice(1).join(' ');
    return (
      <div className="inline-flex items-center transform -skew-x-12 shadow-2xl overflow-hidden rounded-xs sm:rounded-sm ring-1 ring-black/40">
        <span className="bg-[#CC1D0C] text-white font-black text-base sm:text-xl md:text-2xl lg:text-[28px] xl:text-[32px] px-3 sm:px-5 md:px-7 py-1 sm:py-1.5 md:py-2 tracking-wider uppercase select-none drop-shadow-md">
          {firstWord}
        </span>
        <span className="bg-white text-zinc-950 font-black italic text-base sm:text-xl md:text-2xl lg:text-[28px] xl:text-[32px] px-3 sm:px-5 md:px-7 py-1 sm:py-1.5 md:py-2 tracking-wider uppercase select-none drop-shadow-md">
          {rest}
        </span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center transform -skew-x-12 shadow-2xl overflow-hidden rounded-xs sm:rounded-sm bg-[#CC1D0C] px-4 sm:px-6 md:px-8 py-1 sm:py-1.5 md:py-2 text-white font-black text-base sm:text-xl md:text-2xl lg:text-[28px] xl:text-[32px] tracking-wider uppercase select-none drop-shadow-md ring-1 ring-black/40">
      {clean}
    </div>
  );
}

function getBadgeForLang(raw: string, lang: Language): string {
  const t = (raw || '').trim();
  const lower = t.toLowerCase();
  if (lower === 'breaking news' || lower === 'breakingnews') {
    if (lang === 'hi') return 'ब्रेકિંગ न्यूज़';
    return 'BREAKING NEWS';
  }
  if (t === 'બ્રેકિંગ ન્યૂઝ') {
    if (lang === 'hi') return 'ब्रेકિંગ न्यूज़';
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
  if (lower === 'live updates' || lower === 'live update') {
    if (lang === 'hi') return 'लाइव अपडेट्स';
    return 'LIVE UPDATES';
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
      ? effectiveConfig.slides.filter((s) => s && ((Array.isArray(s.texts) && s.texts.some((t) => t.trim())) || s.image))
      : [];
    return list.length > 0 ? list : DEFAULT_BREAKING_BANNER.slides;
  }, [effectiveConfig.slides]);

  const [slideIndex, setSlideIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [isTextExiting, setIsTextExiting] = useState(false);

  // Keep indices in bounds if slides change
  useEffect(() => {
    if (slideIndex >= activeSlides.length) {
      setSlideIndex(0);
      setTextIndex(0);
    }
  }, [activeSlides.length, slideIndex]);

  const currentSlide = activeSlides[slideIndex] || activeSlides[0];
  const slideTexts = useMemo(() => {
    if (!currentSlide || !Array.isArray(currentSlide.texts)) return [];
    const valid = currentSlide.texts.filter((t) => typeof t === 'string' && t.trim());
    return valid.length > 0 ? valid : ['બ્રેકિંગ ન્યૂઝ વિગત'];
  }, [currentSlide]);

  // Keep textIndex in bounds
  useEffect(() => {
    if (textIndex >= slideTexts.length) {
      setTextIndex(0);
    }
  }, [slideTexts.length, textIndex]);

  const currentText = slideTexts[textIndex] || slideTexts[0] || '';
  const hasImage = Boolean(currentSlide?.image && currentSlide.image.trim() !== '');

  const { language } = useApp();

  // Dynamic Badge Translation:
  // Both words / whole phrase update live from what the admin configures!
  // In primary view ('gu'), faithfully render the admin's exact configured badge.
  // When switched to Hindi ('hi') or English ('en'), translate dynamically.
  const rawBadge = (effectiveConfig.badgeText || 'BREAKING NEWS').trim();
  const presetBadge = getBadgeForLang(rawBadge, language);
  const autoTranslatedBadge = useAutoTranslate(rawBadge, language);
  const displayedBadge = language === 'gu'
    ? rawBadge
    : (presetBadge || autoTranslatedBadge || rawBadge);

  // Dynamic Headline Translation
  const translatedHeadline = useAutoTranslate(currentText, language);
  const displayedHeadline = (language === 'gu' ? currentText : (translatedHeadline || currentText)) || currentText;

  // Step backwards (previous text or previous slide)
  const advancePrev = useCallback(() => {
    if (activeSlides.length === 0) return;
    setIsTextExiting(true);
    setTimeout(() => {
      if (textIndex > 0) {
        setTextIndex((prev) => prev - 1);
      } else {
        const prevSlideIdx = (slideIndex - 1 + activeSlides.length) % activeSlides.length;
        const prevSlide = activeSlides[prevSlideIdx];
        const prevSlideTexts = (prevSlide?.texts || []).filter((t) => typeof t === 'string' && t.trim());
        const lastTextIdx = Math.max(0, prevSlideTexts.length - 1);

        setSlideIndex(prevSlideIdx);
        setTextIndex(lastTextIdx);
      }
      setTimeout(() => {
        setIsTextExiting(false);
      }, 40);
    }, 240);
  }, [activeSlides, slideIndex, textIndex]);

  // Step to the next text, or to next slide if all texts shown
  const advanceNext = useCallback(() => {
    if (activeSlides.length === 0) return;
    const currSlide = activeSlides[slideIndex] || activeSlides[0];
    const currentTexts = (currSlide?.texts || []).filter((t) => typeof t === 'string' && t.trim());
    const totalTexts = currentTexts.length > 0 ? currentTexts.length : 1;

    setIsTextExiting(true);
    setTimeout(() => {
      if (textIndex + 1 < totalTexts) {
        // Next text of current slide
        setTextIndex((prev) => prev + 1);
      } else {
        // Next slide!
        setSlideIndex((prev) => (prev + 1) % activeSlides.length);
        setTextIndex(0);
      }
      setTimeout(() => {
        setIsTextExiting(false);
      }, 40);
    }, 240);
  }, [activeSlides, slideIndex, textIndex]);

  // Timer interval (Continuous broadcast ticker, never stops on cursor hover)
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

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-2 sm:py-2.5 mb-4 sm:mb-6 md:mb-7 w-full select-none">
      <style>{`
        @keyframes broadcast_globe_spin {
          0% { transform: translateX(0); }
          100% { transform: translateX(-360px); }
        }
        @keyframes broadcast_beam {
          0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          20% { opacity: 0.35; }
          50% { opacity: 0.15; }
          100% { transform: translateX(450%) skewX(-25deg); opacity: 0; }
        }
        @keyframes broadcast_pulse_glow {
          0%, 100% { opacity: 0.35; transform: translateY(-50%) scale(1); }
          50% { opacity: 0.65; transform: translateY(-50%) scale(1.08); }
        }
      `}</style>
      {/* ── High-Fidelity Breaking News Card Container (Exact Gujarat Post Logo Red: #CC1D0C) ── */}
      <div
        className="group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border-[3px] border-[#CC1D0C] dark:border-[#CC1D0C] bg-[#750A00] shadow-2xl shadow-[#CC1D0C]/25 transition-all"
      >
        {/* ── Top Ribbon Bar (Gujarat Post Logo Red Gradient) ── */}
        <div className="relative overflow-hidden flex items-center justify-between gap-2 sm:gap-4 border-b-2 border-white/60 py-3 sm:py-4 px-3 sm:px-6 bg-gradient-to-r from-[#8B0B00] via-[#CC1D0C] to-[#8B0B00]">
          {/* Studio Tech Grid Watermark Texture */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:12px_12px] opacity-25" />

          {/* Left spacer for desktop center balance */}
          <div className="hidden lg:block w-32 shrink-0 relative z-10" />

          {/* Centered Slanted Broadcast Badge (/// BREAKING NEWS ///) */}
          <div className="flex items-center justify-center mx-auto relative z-10">
            <span className="text-white/80 font-black italic text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tighter mr-2 sm:mr-3.5 select-none drop-shadow-sm">
              ///
            </span>
            {renderBroadcastBadge(displayedBadge)}
            <span className="text-white/80 font-black italic text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tighter ml-2 sm:mr-3.5 select-none drop-shadow-sm">
              ///
            </span>
          </div>

          {/* Right: Slide Counter + Navigation Buttons */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 ml-auto lg:ml-0 lg:w-32 relative z-10">
            <span className="text-xs sm:text-sm font-black text-white/95 select-none px-2 py-0.5 rounded bg-black/40 border border-white/20">
              {slideIndex + 1}/{activeSlides.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  advancePrev();
                }}
                aria-label="Previous"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-sm bg-black/70 hover:bg-black border border-white/30 text-white cursor-pointer active:scale-95 transition shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  advanceNext();
                }}
                aria-label="Next"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-sm bg-black/70 hover:bg-black border border-white/30 text-white cursor-pointer active:scale-95 transition shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Inner Showcase Container with White Border Framing (Framing Image Box & Headline Box) ── */}
        <div className="p-1.5 sm:p-2 md:p-2.5 bg-gradient-to-b from-[#8B0B00] via-[#520700] to-[#1A0200]">
          <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] border-white/90 shadow-2xl flex flex-col md:flex-row min-h-[220px] sm:min-h-[245px] md:min-h-[270px] lg:min-h-[295px] bg-black">
            {/* ── Left Side: Visual Image Box with Defined Border ── */}
            {hasImage && (
              <div className="relative w-full md:w-[48%] lg:w-[46%] xl:w-[45%] shrink-0 overflow-hidden bg-[#09090b] border-b-2 md:border-b-0 md:border-r-2 border-white/40">
                <div className="relative h-56 sm:h-64 md:h-full min-h-[210px] w-full overflow-hidden">
                  {activeSlides.map((slide, sIdx) => {
                    const isActive = sIdx === slideIndex;
                    return (
                      <div
                        key={slide.id || `slide-${sIdx}`}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                          isActive
                            ? 'opacity-100 scale-100 z-10'
                            : 'opacity-0 scale-105 pointer-events-none z-0'
                        }`}
                      >
                        {slide?.image ? (
                          <Image
                            src={slide.image}
                            alt={slide.texts?.[0] || 'Breaking News'}
                            fill
                            sizes="(max-width: 768px) 100vw, 620px"
                            className="object-cover object-center"
                            unoptimized
                            priority={sIdx === 0}
                          />
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Gradient Overlays for Depth */}
                  <div className="pointer-events-none absolute inset-0 z-15 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/40" />

                  {/* TV Badge on bottom left of image: [ ▶ વિઝ્યુઅલ રિપોર્ટ ] (Matching Logo Red: #CC1D0C) */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-black/85 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/30 shadow-md">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#CC1D0C] text-white">
                      <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                    </span>
                    <span>{BREAKING_I18N.visualReport[language] || 'વિઝ્યુઅલ રિપોર્ટ'}</span>
                  </div>
                </div>

                {/* Angled Golden Divider Bar between Image & Red Headline on Desktop */}
                <div className="hidden md:block pointer-events-none absolute -right-2 top-0 bottom-0 w-4 bg-gradient-to-b from-amber-400 via-yellow-300 to-amber-500 transform -skew-x-12 z-25 shadow-lg shadow-yellow-500/50 border-l border-r border-amber-200" />
              </div>
            )}

          {/* ── Headline Card: Gujarat Post Signature Logo Red (#CC1D0C) ── */}
          <div className={`relative flex-1 flex flex-col justify-between bg-gradient-to-br from-[#A00E02] via-[#CC1D0C] to-[#520700] ${
            hasImage
              ? 'p-5 sm:p-6 md:p-7 lg:p-8'
              : 'p-6 sm:p-8 md:p-10 lg:p-12'
          } text-white overflow-hidden transition-all duration-300`}>

            {/* 1. Broadcast Studio Background Texture (Matching User Reference Image) */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden mix-blend-screen opacity-50 select-none">
              <Image
                src="/assets/breaking-globe-bg.jpg"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover object-left scale-105"
                priority
              />
            </div>

            {/* 2. Digital World Map / Tech Dot Matrix Grid Overlay */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.2)_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-30 select-none" />

            {/* 3. Animated 3D Wireframe Broadcast Globe with Rotating Continents & Orbit Rings */}
            <div className="pointer-events-none absolute -left-14 sm:-left-10 md:-left-8 top-1/2 -translate-y-1/2 w-64 h-64 sm:w-76 sm:h-76 md:w-88 md:h-88 z-0 opacity-45 sm:opacity-55 select-none">
              <svg viewBox="0 0 320 320" className="w-full h-full">
                <defs>
                  {/* Sphere Shadow & Illumination Gradient */}
                  <radialGradient id="globeSphereGrad" cx="35%" cy="38%" r="65%">
                    <stop offset="0%" stopColor="#ff6659" stopOpacity="0.45" />
                    <stop offset="45%" stopColor="#CC1D0C" stopOpacity="0.2" />
                    <stop offset="80%" stopColor="#1A0200" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#080100" stopOpacity="0.95" />
                  </radialGradient>

                  {/* Rim Glow Gradient */}
                  <linearGradient id="globeRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff7b70" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#CC1D0C" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#520700" stopOpacity="0.15" />
                  </linearGradient>

                  {/* Circular Sphere ClipPath */}
                  <clipPath id="globeSphereClip">
                    <circle cx="160" cy="160" r="132" />
                  </clipPath>
                </defs>

                {/* Outer Atmosphere Glow */}
                <circle cx="160" cy="160" r="135" fill="none" stroke="url(#globeRimGrad)" strokeWidth="3" className="opacity-70 blur-xs" />

                {/* Globe Sphere Interior */}
                <g clipPath="url(#globeSphereClip)">
                  {/* Dark Base Sphere */}
                  <circle cx="160" cy="160" r="132" fill="#240300" />

                  {/* Seamless Rotating Continents (Drifting across globe) */}
                  <g className="animate-[broadcast_globe_spin_30s_linear_infinite]" style={{ transformBox: 'fill-box' }}>
                    <svg x="0" y="30" width="720" height="260" viewBox="0 0 720 260">
                      {/* Americas & Europe/Africa/Asia continent silhouettes (Repeated twice for seamless loop) */}
                      <path
                        fill="rgba(255, 255, 255, 0.28)"
                        d="M35,45 Q55,30 85,42 Q105,52 90,85 Q82,102 70,115 Q65,130 72,150 Q80,175 68,210 Q60,225 50,215 Q40,195 48,160 Q42,130 30,110 Q20,80 35,45 Z M120,40 Q150,25 180,35 Q195,50 185,75 Q170,90 155,80 Q135,70 120,40 Z M130,95 Q155,90 170,110 Q180,140 175,180 Q160,215 140,205 Q125,180 132,145 Q120,120 130,95 Z M200,45 Q245,30 290,55 Q310,95 285,130 Q250,145 220,120 Q195,90 200,45 Z M260,150 Q285,145 300,165 Q295,195 270,195 Q250,185 260,150 Z M395,45 Q415,30 445,42 Q465,52 450,85 Q442,102 430,115 Q425,130 432,150 Q440,175 428,210 Q420,225 410,215 Q400,195 408,160 Q402,130 390,110 Q380,80 395,45 Z M480,40 Q510,25 540,35 Q555,50 545,75 Q530,90 515,80 Q495,70 480,40 Z M490,95 Q515,90 530,110 Q540,140 535,180 Q520,215 500,205 Q485,180 492,145 Q480,120 490,95 Z M560,45 Q605,30 650,55 Q670,95 645,130 Q610,145 580,120 Q555,90 560,45 Z M620,150 Q645,145 660,165 Q655,195 630,195 Q610,185 620,150 Z"
                      />
                    </svg>
                  </g>

                  {/* 3D Wireframe Latitude Lines */}
                  <ellipse cx="160" cy="90" rx="115" ry="24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" />
                  <ellipse cx="160" cy="130" rx="130" ry="28" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="4 4" />
                  <line x1="28" y1="160" x2="292" y2="160" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <ellipse cx="160" cy="190" rx="130" ry="28" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="4 4" />
                  <ellipse cx="160" cy="230" rx="115" ry="24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" />

                  {/* 3D Spherical Volume Overlay (Lighting & Deep Shadowing) */}
                  <circle cx="160" cy="160" r="132" fill="url(#globeSphereGrad)" />
                </g>

                {/* Orbital Broadcast Satellite Ring */}
                <ellipse cx="160" cy="160" rx="148" ry="46" fill="none" stroke="rgba(255,215,0,0.4)" strokeWidth="1.5" strokeDasharray="6 6" transform="rotate(-20 160 160)" />
              </svg>
            </div>

            {/* 4. Sweeping Broadcast Light Beam (Like TV Studio Ticker) */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
              <div className="h-full w-48 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[broadcast_beam_8s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
            </div>

            {/* 5. Pulsing Atmospheric Red Glow */}
            <div className="pointer-events-none absolute -left-16 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#CC1D0C]/40 blur-3xl animate-[broadcast_pulse_glow_5s_ease-in-out_infinite]" />

            {/* Large Bold Gujarati Headline (Matching Image 1: Clean, Bold, Sans-serif) */}
            <div className="relative z-10 my-auto min-h-[80px] sm:min-h-[95px] md:min-h-[110px] flex items-center py-2 sm:py-3 overflow-hidden">
              <h2
                className={`${
                  hasImage
                    ? 'text-xl sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[34px]'
                    : 'text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[44px]'
                } font-black leading-snug md:leading-normal text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isTextExiting
                    ? 'opacity-0 -translate-y-3 scale-[0.98]'
                    : 'opacity-100 translate-y-0 scale-100'
                }`}
              >
                <span>{displayedHeadline}</span>
              </h2>
            </div>

            {/* Bottom Meta Bar: ((•)) લાઇવ અપડેટ્સ  |  ✒ ગુજરાત પોસ્ટ (Matching Image 1) */}
            <div className="relative z-10 mt-3 sm:mt-4 flex items-center justify-between gap-3 pt-2.5 sm:pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                <Radio className="h-4 w-4 text-red-400 animate-pulse" />
                <span>{BREAKING_I18N.liveUpdate[language] || 'લાઇવ અપડેટ્સ'}</span>
              </div>

              <span className="text-white/40 font-light select-none">|</span>

              {currentSlide?.link ? (
                <Link
                  href={currentSlide.link}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs sm:text-sm font-black text-[#CC1D0C] shadow-sm hover:bg-zinc-100 transition active:scale-95"
                >
                  <span>{BREAKING_I18N.readFull[language] || 'સંપૂર્ણ વાંચો'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white">
                  <PenTool className="h-4 w-4 text-yellow-400" />
                  <span>{BREAKING_I18N.brandName[language] || 'ગુજરાત પોસ્ટ'}</span>
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
