'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ShieldCheck,
  Sliders,
  Settings,
  BarChart3,
  Tv,
  Check,
  Lock,
  Calendar,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useCookieConsent } from '@/components/consent/CookieConsentProvider';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

export default function CookieSettingsClient() {
  const { preferences, savePreferences, acceptAll, rejectOptional, isMounted } = useCookieConsent();
  const { language } = useApp();

  const [draft, setDraft] = useState({
    functional: preferences.functional,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });

  const [savedNotification, setSavedNotification] = useState(false);

  useEffect(() => {
    setDraft({
      functional: preferences.functional,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
  }, [preferences]);

  const toggle = (cat: 'functional' | 'analytics' | 'marketing') => {
    setDraft((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSave = () => {
    savePreferences({
      essential: true,
      functional: draft.functional,
      analytics: draft.analytics,
      marketing: draft.marketing,
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  if (!isMounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
          {getLocalized(language, { gu: 'હોમ', en: 'Home', hi: 'होम' })}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {getLocalized(language, { gu: 'કૂકી સેટિંગ્સ', en: 'Cookie Settings', hi: 'कुकी सेटिंग्स' })}
        </span>
      </nav>

      {/* Page Title & Intro */}
      <div className="mb-8 space-y-2 border-b border-neutral-200 pb-6 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <span className="rounded-xl bg-red-100 p-2.5 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <Sliders className="h-6 w-6" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            {getLocalized(language, {
              gu: 'કૂકી અને ગોપનીયતા સેટિંગ્સ',
              en: 'Cookie & Privacy Settings',
              hi: 'कुकी और गोपनीयता सेटिंग्स',
            })}
          </h1>
        </div>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
          {getLocalized(language, {
            gu: 'તમે ગુજરાત પોસ્ટ પર તમારા બ્રાઉઝરમાં સાચવવામાં આવતી કૂકીઝ અને ડેટા પસંદગીઓને નિયંત્રિત કરી શકો છો. તમે કોઈપણ સમયે તમારી પસંદગીઓ બદલી શકો છો.',
            en: 'Manage how cookies and browser storage are used when you read GujaratPost. You have complete control to adjust or withdraw your choices at any time.',
            hi: 'गुजरात पोस्ट पढ़ते समय कुकीज़ और ब्राउज़र स्टोरेज का उपयोग कैसे किया जाता है, इसे नियंत्रित करें। आप किसी भी समय अपनी पसंद बदल सकते हैं।',
          })}
        </p>

        {savedNotification && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300 animate-in fade-in">
            <Check className="h-4 w-4" />
            <span>
              {getLocalized(language, {
                gu: 'તમારી પસંદગીઓ સફળતાપૂર્વક સાચવવામાં આવી છે!',
                en: 'Your preferences have been saved successfully!',
                hi: 'आपकी प्राथमिकताएं सफलतापूर्वक सहेजी गई हैं!',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Main Settings Panel */}
      <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Category 1: Strictly Necessary */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-5 dark:border-zinc-800/80">
          <div className="flex items-start gap-3.5">
            <span className="mt-1 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-zinc-800 dark:text-neutral-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  {getLocalized(language, {
                    gu: '૧. આવશ્યક સંગ્રહ (Strictly Necessary)',
                    en: '1. Strictly Necessary',
                    hi: '1. अनिवार्य स्टोरेज (Strictly Necessary)',
                  })}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-400">
                  <Lock className="h-2.5 w-2.5" />
                  {getLocalized(language, { gu: 'હંમેશા સક્રિય', en: 'Always Active', hi: 'हमेशा सक्रिय' })}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                {getLocalized(language, {
                  gu: 'વેબસાઇટની મુખ્ય સુવિધાઓ, લૉગિન સત્ર, સુરક્ષા અને કૂકી સંમતિ સાચવવા માટે જરૂરી છે. આ કૂકીઝ વિના પોર્ટલ યોગ્ય રીતે કાર્ય કરી શકતું નથી.',
                  en: 'Required for core portal functions, authentication sessions, security defenses, and remembering your cookie consent record. These cannot be disabled.',
                  hi: 'वेबसाइट के मुख्य कार्यों, प्रमाणीकरण सत्र, सुरक्षा और कुकी सहमति को याद रखने के लिए आवश्यक है।',
                })}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <input
              type="checkbox"
              checked={true}
              disabled
              aria-label="Necessary storage is always active"
              className="h-6 w-11 rounded-full appearance-none bg-green-500 checked:bg-green-500 cursor-not-allowed opacity-80 relative before:content-[''] before:absolute before:top-0.5 before:left-[22px] before:w-5 before:h-5 before:bg-white before:rounded-full"
            />
          </div>
        </div>

        {/* Category 2: Functional */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-5 dark:border-zinc-800/80">
          <div className="flex items-start gap-3.5">
            <span className="mt-1 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-zinc-800 dark:text-neutral-300">
              <Settings className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {getLocalized(language, {
                  gu: '૨. કાર્યકારી અને વાંચક પસંદગીઓ (Functional & Preferences)',
                  en: '2. Functional & Reader Preferences',
                  hi: '2. कार्यात्मक और पाठक प्राथमिकताएं (Functional)',
                })}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                {getLocalized(language, {
                  gu: 'ડાર્ક/લાઇટ થીમ, ફોન્ટ સાઇઝ એડજસ્ટમેન્ટ, સ્થાનિક સમાચાર માટે પસંદ કરેલ શહેર અને બુકમાર્ક સાચવવા માટે વપરાય છે.',
                  en: 'Remembers reader customizations such as dark/light mode, font scaling, your selected local city filter, and offline bookmarks.',
                  hi: 'डार्क/लाइट थीम, फ़ॉन्ट का आकार, स्थानीय समाचारों के लिए चयनित शहर और बुकमार्क सहेजने के लिए उपयोग किया जाता है।',
                })}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={draft.functional}
              onClick={() => toggle('functional')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 ${
                draft.functional ? 'bg-red-600' : 'bg-neutral-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  draft.functional ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Category 3: Analytics */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-5 dark:border-zinc-800/80">
          <div className="flex items-start gap-3.5">
            <span className="mt-1 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-zinc-800 dark:text-neutral-300">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {getLocalized(language, {
                  gu: '૩. વિશ્લેષણ અને વાચક આંકડા (Analytics)',
                  en: '3. Analytics & Readership Measurement',
                  hi: '3. एनालिटिक्स और पाठक विश्लेषण (Analytics)',
                })}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                {getLocalized(language, {
                  gu: 'વાચકોના વલણો અને પોર્ટલના પ્રદર્શનને સમજવામાં મદદ કરે છે જેથી પત્રકારત્વ અને ગતિમાં સુધારો કરી શકાય. કોઈ વ્યક્તિગત ડેટા વેચવામાં આવતો નથી.',
                  en: 'Provides aggregated readership analytics to help editorial staff identify popular topics and optimize performance. No user profile is sold.',
                  hi: 'पाठकों के रुझान और प्रदर्शन को समझने में मदद करता है ताकि पत्रकारिता और गति में सुधार हो सके।',
                })}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={draft.analytics}
              onClick={() => toggle('analytics')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 ${
                draft.analytics ? 'bg-red-600' : 'bg-neutral-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  draft.analytics ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Category 4: Marketing & Third-Party Media */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="mt-1 rounded-lg bg-neutral-100 p-2 text-neutral-600 dark:bg-zinc-800 dark:text-neutral-300">
              <Tv className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {getLocalized(language, {
                  gu: '૪. તૃતીય-પક્ષ મીડિયા અને વિડિઓ (Marketing & External Media)',
                  en: '4. Third-Party Media & Embeds',
                  hi: '4. तृतीय-पक्ष मीडिया और वीडियो (Marketing & Media)',
                })}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                {getLocalized(language, {
                  gu: 'યૂટ્યૂબ વિડિયો પ્લેયર્સ (Shorts, Live TV) અને ગૂગલ મેપ્સ જેવા બાહ્ય એકીકરણ માટે વપરાય છે. અક્ષમ હોય ત્યારે વિડિઓ ચલાવવા પહેલાં પુષ્ટિ બટન દેખાશે.',
                  en: 'Controls interactive embeds from YouTube (Shorts, Live TV) and Google Maps. When disabled, embeds display a privacy placeholder with an opt-in play button.',
                  hi: 'यूट्यूब वीडियो प्लेयर और गूगल मैप्स जैसे बाहरी मीडिया को नियंत्रित करता है। अक्षम होने पर सीधे चलने के बजाय पुष्टि बटन दिखाई देगा।',
                })}
              </p>
            </div>
          </div>
          <div className="pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={draft.marketing}
              onClick={() => toggle('marketing')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 ${
                draft.marketing ? 'bg-red-600' : 'bg-neutral-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  draft.marketing ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 pt-6 dark:border-zinc-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={rejectOptional}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {getLocalized(language, {
                gu: 'માત્ર જરૂરી સ્વીકારો',
                en: 'Reject Optional',
                hi: 'केवल आवश्यक',
              })}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {getLocalized(language, {
                gu: 'બધા સ્વીકારો',
                en: 'Accept All',
                hi: 'सभी स्वीकारें',
              })}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md shadow-red-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <Check className="h-4 w-4" />
            <span>
              {getLocalized(language, {
                gu: 'પસંદગી સાચવો',
                en: 'Save Preferences',
                hi: 'प्राथमिकताएं सहेजें',
              })}
            </span>
          </button>
        </div>
      </div>

      {/* Helpful Links */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-4">
          <Link href="/cookie-policy" className="hover:text-red-600 dark:hover:text-red-400 underline transition-colors">
            {getLocalized(language, { gu: 'કૂકી પોલિસી વાંચો', en: 'Read Cookie Policy', hi: 'कुकी नीति पढ़ें' })}
          </Link>
          <span>•</span>
          <Link href="/privacy-policy" className="hover:text-red-600 dark:hover:text-red-400 underline transition-colors">
            {getLocalized(language, { gu: 'પ્રાઇવસી પોલિસી', en: 'Privacy Policy', hi: 'गोपनीयता नीति' })}
          </Link>
        </div>
        <p>
          {getLocalized(language, {
            gu: 'છેલ્લે અપડેટ: ઓક્ટોબર ૨૦૨૬',
            en: 'Last Updated: October 2026',
            hi: 'अंतिम अपडेट: अक्टूबर 2026',
          })}
        </p>
      </div>
    </div>
  );
}
