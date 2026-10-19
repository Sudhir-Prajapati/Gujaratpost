'use client';

import React from 'react';
import Image from 'next/image';
import { Play, ShieldAlert, Sliders, ExternalLink, MapPin } from 'lucide-react';
import { useCookieConsent } from './CookieConsentProvider';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

interface ConsentGateProps {
  children: React.ReactNode;
  category?: 'marketing' | 'analytics' | 'functional';
  type?: 'youtube' | 'map' | 'embed';
  title?: string;
  thumbnailUrl?: string;
  className?: string;
  aspectRatioClass?: string;
}

export function ConsentGate({
  children,
  category = 'marketing',
  type = 'youtube',
  title = 'Media Player',
  thumbnailUrl,
  className = '',
  aspectRatioClass = 'aspect-video',
}: ConsentGateProps) {
  const { preferences, savePreferences, openSettingsModal, isMounted } = useCookieConsent();
  const { language } = useApp();

  // If not mounted yet, render placeholder safely to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={`relative w-full overflow-hidden rounded-xl bg-neutral-900/90 text-white flex items-center justify-center ${aspectRatioClass} ${className}`}>
        <div className="animate-pulse bg-neutral-800 w-full h-full" />
      </div>
    );
  }

  const isConsentGranted = Boolean(preferences[category]);

  // If consent is granted, render the actual embed/children
  if (isConsentGranted) {
    return <>{children}</>;
  }

  // Handle single-click consent grant specifically for this category
  const handleEnableConsent = (e: React.MouseEvent) => {
    e.stopPropagation();
    savePreferences({
      ...preferences,
      [category]: true,
    });
  };

  // If type is Map
  if (type === 'map') {
    return (
      <div className={`relative w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-300 dark:border-zinc-700 p-6 flex flex-col items-center justify-center text-center ${className}`}>
        <span className="p-3 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-3">
          <MapPin className="h-6 w-6" />
        </span>
        <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mb-1">
          {getLocalized(language, {
            gu: 'ગૂગલ મેપ્સ દર્શાવવા માટે કૂકી સંમતિ જરૂરી છે',
            en: 'Google Maps requires cookie consent',
            hi: 'गूगल मैप्स प्रदर्शित करने के लिए कुकी सहमति आवश्यक है',
          })}
        </h4>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mb-4 leading-relaxed">
          {getLocalized(language, {
            gu: 'ગૂગલ મેપ્સ લોડ કરવાથી ગૂગલના સર્વર્સ સાથે જોડાણ થાય છે. તમે અહીં સીધા સંમતિ આપી શકો છો અથવા ગૂગલ મેપ્સને નવી વિંડોમાં ખોલી શકો છો.',
            en: 'Loading Google Maps connects to Google servers. You can enable third-party media cookies here or view the location directly on Google Maps.',
            hi: 'गूगल मैप्स लोड करने से गूगल सर्वर से कनेक्ट होता है। आप यहां मीडिया कुकीज़ सक्षम कर सकते हैं या नई विंडो में मैप खोल सकते हैं।',
          })}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleEnableConsent}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow transition-colors"
          >
            {getLocalized(language, {
              gu: 'મેપ સક્ષમ કરો',
              en: 'Enable Maps',
              hi: 'नक्शा सक्षम करें',
            })}
          </button>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <span>
              {getLocalized(language, {
                gu: 'નવી વિંડોમાં ખોલો',
                en: 'Open External Map',
                hi: 'बाहरी विंडो में खोलें',
              })}
            </span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // Default: YouTube / Video Player Placeholder
  return (
    <div
      className={`group relative w-full overflow-hidden rounded-xl bg-neutral-950 text-white flex flex-col items-center justify-center text-center select-none shadow-md ${aspectRatioClass} ${className}`}
    >
      {/* Background thumbnail if available */}
      {thumbnailUrl ? (
        <div className="absolute inset-0">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover opacity-35 blur-[2px] transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
      )}

      {/* Content overlay */}
      <div className="relative z-10 p-4 max-w-md mx-auto flex flex-col items-center space-y-2.5">
        <div className="p-3 rounded-full bg-red-600/90 text-white shadow-lg shadow-red-600/40 ring-4 ring-white/10">
          <Play className="h-6 w-6 fill-current ml-0.5" />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
            {getLocalized(language, {
              gu: 'યૂટ્યૂબ વિડિયો એકીકરણ',
              en: 'YouTube Embed Protected',
              hi: 'यूट्यूब वीडियो एम्बेड',
            })}
          </p>
          <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
            {title}
          </h4>
          <p className="text-[11px] sm:text-xs text-neutral-300 leading-snug px-2">
            {getLocalized(language, {
              gu: 'આ વિડિયો યૂટ્યૂબ દ્વારા હોસ્ટ કરવામાં આવ્યો છે. ચલાવવા માટે મીડિયા કૂકીઝ સ્વીકારો.',
              en: 'This video is hosted by YouTube. Accept third-party media cookies to play.',
              hi: 'यह वीडियो यूट्यूब द्वारा होस्ट किया गया है। चलाने के लिए मीडिया कुकीज़ स्वीकारें।',
            })}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleEnableConsent}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <span>
              {getLocalized(language, {
                gu: 'સ્વીકારો અને જુઓ',
                en: 'Accept & Play',
                hi: 'स्वीकारें और देखें',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={openSettingsModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
          >
            <Sliders className="h-3 w-3" />
            <span>
              {getLocalized(language, {
                gu: 'સેટિંગ્સ',
                en: 'Settings',
                hi: 'सेटिंग्स',
              })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
