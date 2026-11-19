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
 * and quoted phrases in brilliant golden yellow (#FFE600) matching professional TV news graphics.
 */
function renderHighlightedHeadline(text: string) {
  if (!text) return null;
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
          className="text-[#FFE600] drop-shadow-[0_0_15px_rgba(255,230,0,0.75)] font-black"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * High-definition vector TV studio background layer:
 * Includes the radial red background glow, volumetric light cones, razor-sharp diagonal laser lines,
 * high-contrast crimson dotted world map, and blazing anamorphic horizontal lens flares.
 */
function TvStudioVectorBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0">
      <svg viewBox="0 0 1024 512" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          {/* Background Crimson Studio Gradient */}
          <radialGradient id="tvBgGlow" cx="50%" cy="15%" r="75%">
            <stop offset="0%" stopColor="#cc0000" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#800000" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#280000" stopOpacity="1" />
          </radialGradient>

          {/* Top-Left Corner Radial Flare */}
          <radialGradient id="cornerFlare" cx="0%" cy="0%" r="55%">
            <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#cc1100" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#800000" stopOpacity="0" />
          </radialGradient>

          {/* Anamorphic Lens Flare Horizontal Gradient */}
          <linearGradient id="flareLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3300" stopOpacity="0" />
            <stop offset="25%" stopColor="#ff6600" stopOpacity="0.85" />
            <stop offset="48%" stopColor="#ffe6aa" stopOpacity="1" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="52%" stopColor="#ffe6aa" stopOpacity="1" />
            <stop offset="75%" stopColor="#ff6600" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ff3300" stopOpacity="0" />
          </linearGradient>

          {/* Diagonal Laser Line Gradient */}
          <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#ff8888" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ff2200" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#990000" stopOpacity="0" />
          </linearGradient>

          {/* Volumetric Laser Beam Soft Gradient */}
          <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4444" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#ff1100" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#660000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Base Studio Gradient Fill */}
        <rect width="1024" height="512" fill="url(#tvBgGlow)" />
        <rect width="1024" height="512" fill="url(#cornerFlare)" />

        {/* 2. DIAGONAL LIGHT STREAKS / LASER BEAMS (Top-Left) */}
        {/* Volumetric Light Cones */}
        <polygon points="0,0 260,0 460,260 0,260" fill="url(#beamGrad)" />
        <polygon points="0,0 180,0 360,280 0,180" fill="url(#beamGrad)" opacity="0.6" />

        {/* Razor-sharp Diagonal Laser Lines */}
        <line x1="0" y1="15" x2="380" y2="395" stroke="url(#laserGrad)" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="15" y1="0" x2="440" y2="425" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.95" strokeLinecap="round" />
        <line x1="60" y1="0" x2="490" y2="430" stroke="#ff8888" strokeWidth="3" strokeOpacity="0.85" strokeLinecap="round" />
        <line x1="120" y1="0" x2="520" y2="400" stroke="#ff3b30" strokeWidth="5" strokeOpacity="0.8" strokeLinecap="round" />
        <line x1="180" y1="0" x2="540" y2="360" stroke="#ff2200" strokeWidth="2.5" strokeOpacity="0.65" strokeLinecap="round" />

        {/* 3. DOTTED WORLD MAP (Top-Right - High-Contrast Visible Dots) */}
        <g fill="#ff4d4d">
          {/* North America */}
          <circle cx="760" cy="25" r="2.5" /><circle cx="768" cy="22" r="2.5" /><circle cx="776" cy="20" r="2.5" /><circle cx="784" cy="22" r="2.5" /><circle cx="792" cy="26" r="2.5" />
          <circle cx="762" cy="34" r="2.5" /><circle cx="770" cy="32" r="2.5" /><circle cx="778" cy="30" r="2.5" /><circle cx="786" cy="32" r="2.5" /><circle cx="794" cy="36" r="2.5" />
          <circle cx="766" cy="44" r="2.5" /><circle cx="774" cy="42" r="2.5" /><circle cx="782" cy="42" r="2.5" /><circle cx="790" cy="46" r="2.5" />
          <circle cx="776" cy="54" r="2.5" /><circle cx="784" cy="56" r="2.5" /><circle cx="790" cy="66" r="2.5" /><circle cx="794" cy="76" r="2.5" />
          {/* South America */}
          <circle cx="796" cy="86" r="2.5" /><circle cx="804" cy="88" r="2.5" /><circle cx="812" cy="90" r="2.5" />
          <circle cx="798" cy="96" r="2.5" /><circle cx="806" cy="98" r="2.5" /><circle cx="814" cy="100" r="2.5" />
          <circle cx="802" cy="106" r="2.5" /><circle cx="810" cy="108" r="2.5" /><circle cx="806" cy="116" r="2.5" />
          {/* Europe */}
          <circle cx="830" cy="20" r="2.5" /><circle cx="838" cy="18" r="2.5" /><circle cx="846" cy="18" r="2.5" /><circle cx="854" cy="20" r="2.5" /><circle cx="862" cy="22" r="2.5" />
          <circle cx="828" cy="28" r="2.5" /><circle cx="836" cy="28" r="2.5" /><circle cx="844" cy="28" r="2.5" /><circle cx="852" cy="30" r="2.5" /><circle cx="860" cy="32" r="2.5" />
          {/* Africa */}
          <circle cx="832" cy="40" r="2.5" /><circle cx="840" cy="40" r="2.5" /><circle cx="848" cy="42" r="2.5" /><circle cx="856" cy="44" r="2.5" />
          <circle cx="834" cy="50" r="2.5" /><circle cx="842" cy="52" r="2.5" /><circle cx="850" cy="54" r="2.5" /><circle cx="858" cy="54" r="2.5" />
          <circle cx="838" cy="62" r="2.5" /><circle cx="846" cy="64" r="2.5" /><circle cx="854" cy="64" r="2.5" />
          <circle cx="842" cy="74" r="2.5" /><circle cx="850" cy="74" r="2.5" /><circle cx="846" cy="84" r="2.5" />
          {/* Russia & Asia */}
          <circle cx="870" cy="16" r="2.5" /><circle cx="878" cy="16" r="2.5" /><circle cx="886" cy="18" r="2.5" /><circle cx="894" cy="18" r="2.5" /><circle cx="902" cy="20" r="2.5" /><circle cx="910" cy="20" r="2.5" /><circle cx="918" cy="22" r="2.5" /><circle cx="926" cy="24" r="2.5" />
          <circle cx="872" cy="26" r="2.5" /><circle cx="880" cy="26" r="2.5" /><circle cx="888" cy="28" r="2.5" /><circle cx="896" cy="28" r="2.5" /><circle cx="904" cy="30" r="2.5" /><circle cx="912" cy="32" r="2.5" /><circle cx="920" cy="34" r="2.5" /><circle cx="928" cy="36" r="2.5" />
          <circle cx="874" cy="36" r="2.5" /><circle cx="882" cy="38" r="2.5" /><circle cx="890" cy="38" r="2.5" /><circle cx="898" cy="40" r="2.5" /><circle cx="906" cy="42" r="2.5" /><circle cx="914" cy="44" r="2.5" />
          {/* Middle East & India */}
          <circle cx="866" cy="46" r="2.5" /><circle cx="874" cy="48" r="2.5" /><circle cx="882" cy="50" r="2.5" /><circle cx="890" cy="52" r="2.5" />
          <circle cx="878" cy="58" r="2.5" /><circle cx="886" cy="62" r="2.5" /><circle cx="894" cy="62" r="2.5" /><circle cx="888" cy="72" r="2.5" />
          {/* East Asia & SE Asia */}
          <circle cx="918" cy="46" r="2.5" /><circle cx="926" cy="48" r="2.5" /><circle cx="934" cy="50" r="2.5" /><circle cx="942" cy="52" r="2.5" />
          <circle cx="912" cy="56" r="2.5" /><circle cx="920" cy="58" r="2.5" /><circle cx="928" cy="62" r="2.5" />
          {/* Australia */}
          <circle cx="924" cy="86" r="2.5" /><circle cx="932" cy="86" r="2.5" /><circle cx="940" cy="88" r="2.5" /><circle cx="948" cy="90" r="2.5" />
          <circle cx="922" cy="96" r="2.5" /><circle cx="930" cy="96" r="2.5" /><circle cx="938" cy="98" r="2.5" /><circle cx="946" cy="100" r="2.5" />
          <circle cx="926" cy="106" r="2.5" /><circle cx="934" cy="106" r="2.5" /><circle cx="942" cy="108" r="2.5" />
        </g>

        {/* 4. BLAZING ANAMORPHIC LENS FLARES (Top & Bottom of Inner Box) */}
        {/* Top Border Flare */}
        <line x1="80" y1="130" x2="944" y2="130" stroke="url(#flareLineGrad)" strokeWidth="3" />
        <ellipse cx="512" cy="130" rx="90" ry="4" fill="#ffffff" opacity="0.95" />
        <circle cx="512" cy="130" r="8" fill="#ffffff" />
        <ellipse cx="512" cy="130" rx="160" ry="10" fill="#ff7700" opacity="0.75" />

        {/* Bottom Border Flare */}
        <line x1="80" y1="465" x2="944" y2="465" stroke="url(#flareLineGrad)" strokeWidth="3" />
        <ellipse cx="512" cy="465" rx="90" ry="4" fill="#ffffff" opacity="0.95" />
        <circle cx="512" cy="465" r="8" fill="#ffffff" />
        <ellipse cx="512" cy="465" rx="160" ry="10" fill="#ff7700" opacity="0.75" />
      </svg>
    </div>
  );
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
    <div className="relative inline-flex items-center justify-center select-none">
      {/* Deep Ambient Occlusion Shadow casting down onto the card */}
      <div className="absolute -bottom-4 inset-x-4 h-12 bg-black/90 blur-xl rounded-full pointer-events-none" />
      {/* Background ambient red glow */}
      <div className="absolute inset-0 bg-[#ff2000]/85 blur-xl rounded-2xl scale-125 pointer-events-none" />

      {/* 3D Skewed Television News Badge */}
      <div className="relative flex items-center overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[22px] shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_25px_rgba(255,40,40,0.6)] border border-white/50 transform -skew-x-12">
        {/* BREAKING (Red) */}
        <div className="relative bg-gradient-to-b from-[#ff3322] via-[#cc1108] to-[#7a0600] text-white font-black italic tracking-wider text-xl sm:text-3xl md:text-4xl lg:text-[44px] px-6 sm:px-10 md:px-12 py-1.5 sm:py-2 md:py-2.5 flex items-center justify-center">
          {/* Top Gloss Highlight */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
          <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] uppercase transform skew-x-12">
            {firstWord}
          </span>
        </div>

        {/* NEWS (White) */}
        {restWord ? (
          <div className="relative bg-gradient-to-b from-white via-zinc-100 to-zinc-200 text-zinc-950 font-black italic tracking-wider text-xl sm:text-3xl md:text-4xl lg:text-[44px] px-6 sm:px-10 md:px-12 py-1.5 sm:py-2 md:py-2.5 flex items-center justify-center border-l-2 border-black/15">
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
    <section className="mx-auto max-w-screen-xl px-2.5 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-5 w-full select-none">
      {/* ══════════════════════════════════════════════════════════════════════
           PREMIUM TV NEWS BREAKING BANNER (Exact Match to User Reference Graphic)
           ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden rounded-2xl md:rounded-[30px] bg-[#750000] p-3 sm:p-5 md:p-6 lg:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.95)] border border-[#ff4444]/60">

        {/* ─── 1. VECTOR TV STUDIO BACKGROUND LAYER (Laser Streaks, World Map, Flares) ─── */}
        <TvStudioVectorBackground />

        {/* ─── 2. TOP HEADER BADGE (With Deep TV News Broadcast Drop Shadow) ─── */}
        <div className="relative z-20 flex justify-center mb-3 sm:mb-4 md:mb-5">
          {renderTvBreakingHeader(displayedBadge)}
        </div>

        {/* ─── 3. MAIN INNER CONTENT CARD (Deep Crimson Background + Glowing Red Border) ─── */}
        <div className="relative w-full rounded-xl sm:rounded-2xl md:rounded-[24px] border-[2px] border-[#ff3b30] bg-gradient-to-br from-[#3b0002]/95 via-[#220001]/95 to-[#100000]/95 p-3.5 sm:p-5 md:p-6 lg:p-7 shadow-[0_15px_50px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.85)] z-10 backdrop-blur-xs">

          {/* Two-Column Layout (Media Left ~45% / Text Right ~55%) */}
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-7 lg:gap-8">

            {/* ── LEFT SECTION: News Image / Media (Approx 45%) ── */}
            {hasImage && (
              <div className="w-full md:w-[45%] lg:w-[45%] shrink-0">
                <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[330px] rounded-xl sm:rounded-2xl border-[3px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.95)] overflow-hidden bg-black flex items-center justify-center">
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
                          <Image
                            src={imgUrl}
                            alt={slide.texts?.[0] || 'Breaking News'}
                            fill
                            sizes="(max-width: 768px) 100vw, 550px"
                            className="object-cover"
                            unoptimized
                            priority={sIdx === 0 && imgIdx === 0}
                          />
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
                hasImage ? 'md:w-[55%] lg:w-[55%]' : 'w-full'
              } flex flex-col justify-between self-stretch min-h-[180px] sm:min-h-[220px] md:min-h-[270px] lg:min-h-[300px] py-1`}
            >
              {/* Headline with Thick Vertical Yellow Accent Bar */}
              <div className="flex items-start gap-4 sm:gap-5 my-auto">
                {/* Thick Vibrant Golden Yellow Accent Bar */}
                <div className="w-2.5 sm:w-3.5 bg-[#FFE600] rounded-full self-stretch shrink-0 shadow-[0_0_15px_rgba(255,230,0,0.85)]" />

                {/* Gujarati / English Headline */}
                {slideLink ? (
                  <Link
                    href={slideLink}
                    className="block group cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    <h2
                      className={`font-black text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[48px] leading-[1.22] tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)] transition-all duration-300 ${
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
                    className={`font-black text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[48px] leading-[1.22] tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)] transition-all duration-300 ${
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
              <div className="flex items-center justify-end mt-3 sm:mt-4">
                {slideLink ? (
                  <Link
                    href={slideLink}
                    className="bg-white rounded-xl sm:rounded-2xl px-3.5 sm:px-4.5 py-1.5 sm:py-2 shadow-xl border border-white shrink-0 flex items-center justify-center hover:shadow-2xl transition"
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
                  <div className="bg-white rounded-xl sm:rounded-2xl px-3.5 sm:px-4.5 py-1.5 sm:py-2 shadow-xl border border-white shrink-0 flex items-center justify-center">
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
