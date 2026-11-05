'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Play, Radio } from 'lucide-react';
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
 * Renders the broadcast header badge matching the exact requested design:
 * "BREAKING" in bold red text on white background, followed by a solid red box with "NEWS" in bold white text.
 * Prominently sized with enlarged font for maximum impact.
 */
function renderBroadcastBadge(badgeText: string) {
  const clean = (badgeText || 'BREAKING NEWS').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    const firstWord = parts[0];
    const rest = parts.slice(1).join(' ');
    return (
      <div className="inline-flex items-center gap-2 sm:gap-3 md:gap-3.5 select-none py-0.5">
        <span className="text-[#CC1D0C] font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[54px] tracking-wide uppercase select-none leading-none drop-shadow-xs">
          {firstWord}
        </span>
        <span className="bg-[#CC1D0C] text-white font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[54px] px-3 sm:px-4 md:px-5 py-1 sm:py-1.5 md:py-2 tracking-wide uppercase select-none leading-none rounded-none shadow-sm">
          {rest}
        </span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center select-none py-0.5">
      <span className="bg-[#CC1D0C] text-white font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[54px] px-4 sm:px-6 md:px-8 py-1 sm:py-1.5 md:py-2 tracking-wide uppercase select-none leading-none shadow-sm">
        {clean}
      </span>
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

  // Step backwards (previous step or previous slide)
  const advancePrev = useCallback(() => {
    if (activeSlides.length === 0) return;
    setIsTextExiting(true);
    setTimeout(() => {
      if (stepIndex > 0) {
        setStepIndex((prev) => prev - 1);
      } else {
        const prevSlideIdx = (slideIndex - 1 + activeSlides.length) % activeSlides.length;
        const prevSlide = activeSlides[prevSlideIdx];
        const prevTexts = (prevSlide?.texts || []).filter((t) => typeof t === 'string' && t.trim());
        const prevImgs = (Array.isArray(prevSlide?.images) && prevSlide.images.length > 0)
          ? prevSlide.images.filter((img) => typeof img === 'string' && img.trim() !== '')
          : (prevSlide?.image && prevSlide.image.trim() !== '' ? [prevSlide.image.trim()] : []);
        const prevMax = Math.max(prevTexts.length || 1, prevImgs.length || 1);
        setSlideIndex(prevSlideIdx);
        setStepIndex(Math.max(0, prevMax - 1));
      }
      setTimeout(() => {
        setIsTextExiting(false);
      }, 40);
    }, 240);
  }, [activeSlides, slideIndex, stepIndex]);

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
        {/* ── Top Ribbon Bar (Crisp White Header Matching Broadcast Reference) ── */}
        <div className="relative overflow-hidden flex items-center justify-center border-b-[3px] border-[#CC1D0C] py-2.5 sm:py-3.5 md:py-4 px-3 sm:px-6 bg-white shadow-sm">
          {/* Centered Broadcast Badge ("BREAKING" in red text, "NEWS" in solid red box) */}
          <div className="flex items-center justify-center mx-auto relative z-10">
            {renderBroadcastBadge(displayedBadge)}
          </div>
        </div>

        {/* ── Inner Showcase Container with White Border Framing (Framing Image Box & Headline Box) ── */}
        <div className="p-1.5 sm:p-2 md:p-2.5 bg-gradient-to-b from-[#8B0B00] via-[#520700] to-[#1A0200]">
          <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] border-white/90 shadow-2xl flex flex-col md:flex-row min-h-[240px] sm:min-h-[270px] md:min-h-[300px] lg:min-h-[330px] bg-black">
            {/* ── Left Side: Visual Image Box with Defined Border ── */}
            {hasImage && (
              <div className="relative w-full md:w-[48%] lg:w-[46%] xl:w-[45%] shrink-0 overflow-hidden bg-[#09090b]">
                <div className="relative h-56 sm:h-64 md:h-full min-h-[220px] sm:min-h-[250px] md:min-h-[280px] lg:min-h-[310px] w-full overflow-hidden">
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
                          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                            isImgActive
                              ? 'opacity-100 scale-100 z-10'
                              : 'opacity-0 scale-105 pointer-events-none z-0'
                          }`}
                        >
                          <Image
                            src={imgUrl}
                            alt={slide.texts?.[0] || 'Breaking News'}
                            fill
                            sizes="(max-width: 768px) 100vw, 620px"
                            className="object-cover object-center"
                            unoptimized
                            priority={sIdx === 0 && imgIdx === 0}
                          />
                        </div>
                      );
                    });
                  })}

                  {/* Gradient Overlays for Depth */}
                  <div className="pointer-events-none absolute inset-0 z-15 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/40" />

                  {/* TV Badge on bottom left of image: [ ▶ વિઝ્યુઅલ રિપોર્ટ ] (Matching Logo Red: #CC1D0C) */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full bg-black/85 px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-black text-white backdrop-blur-sm border border-white/40 shadow-lg">
                    <span className="flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#CC1D0C] text-white">
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ml-0.5" />
                    </span>
                    <span>{BREAKING_I18N.visualReport[language] || 'વિઝ્યુઅલ રિપોર્ટ'}</span>
                    {currentSlideImages.length > 1 && (
                      <span className="text-[11px] font-bold text-yellow-300 ml-0.5 pl-1.5 border-l border-white/30">
                        {(stepIndex % currentSlideImages.length) + 1}/{currentSlideImages.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── High-Contrast Broadcast Divider Border Between Left (Image) and Right (Text) Sections ── */}
            {hasImage && (
              <>
                {/* Desktop: Vertical 2px-3px Glowing White & Gold Divider Bar */}
                <div
                  className="hidden md:flex flex-col shrink-0 w-1.5 self-stretch bg-gradient-to-b from-white via-amber-300 to-white shadow-[0_0_10px_rgba(255,255,255,0.7)] z-20 relative"
                  aria-hidden="true"
                />
                {/* Mobile: Horizontal 2px-3px Glowing White & Gold Divider Bar */}
                <div
                  className="block md:hidden h-1.5 w-full bg-gradient-to-r from-white via-amber-300 to-white shadow-[0_0_10px_rgba(255,255,255,0.7)] z-20 relative"
                  aria-hidden="true"
                />
              </>
            )}

          {/* ── Headline Card: Gujarat Post Signature Logo Red (#CC1D0C) ── */}
          <div className={`relative flex-1 flex flex-col justify-between bg-gradient-to-br from-[#A00E02] via-[#CC1D0C] to-[#520700] ${
            hasImage
              ? 'p-5 sm:p-6 md:p-8 lg:p-9'
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

            {/* Large Bold Gujarati Headline (Increased Text Size for Maximum Broadcast Impact) */}
            <div className="relative z-10 my-auto min-h-[95px] sm:min-h-[115px] md:min-h-[135px] lg:min-h-[150px] flex items-center py-2 sm:py-3 overflow-hidden">
              <h2
                className={`${
                  hasImage
                    ? 'text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] xl:text-[42px]'
                    : 'text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] xl:text-[54px]'
                } font-black leading-snug md:leading-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isTextExiting
                    ? 'opacity-0 -translate-y-3 scale-[0.98]'
                    : 'opacity-100 translate-y-0 scale-100'
                }`}
              >
                <span>{displayedHeadline}</span>
              </h2>
            </div>

            {/* Bottom Meta Bar: ((•)) લાઇવ અપડેટ્સ  |  ✒ ગુજરાત પોસ્ટ (Clean, Bold, Polished) */}
            <div className="relative z-10 mt-4 sm:mt-5 flex items-center justify-between gap-3 pt-3 sm:pt-3.5 border-t-2 border-white/30">
              <div className="flex items-center gap-2 text-sm sm:text-base font-black text-white">
                <Radio className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-red-300 animate-pulse shrink-0" />
                <span>
                  {(effectiveConfig.liveUpdateText && effectiveConfig.liveUpdateText.trim()) ||
                    BREAKING_I18N.liveUpdate[language] ||
                    'લાઇવ અપડેટ્સ'}
                </span>
              </div>

              <span className="text-white/60 font-semibold text-base sm:text-lg select-none">|</span>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {currentSlide?.link && (
                  <Link
                    href={currentSlide.link}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black text-[#CC1D0C] shadow-md hover:bg-zinc-100 transition active:scale-95 shrink-0"
                  >
                    <span>{BREAKING_I18N.readFull[language] || 'સંપૂર્ણ વાંચો'}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}

                <Link
                  href={currentSlide?.link || '/'}
                  className="inline-flex items-center bg-white px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg shadow-md border border-white/50 hover:opacity-95 transition shrink-0"
                  title="Gujarat Post"
                >
                  <Image
                    src="/GujaratpostFinalLogo.png"
                    alt="Gujarat Post"
                    width={110}
                    height={26}
                    className="h-5 sm:h-6 w-auto object-contain"
                    priority
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
}
