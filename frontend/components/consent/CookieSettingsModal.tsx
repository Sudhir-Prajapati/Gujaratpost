'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  ShieldCheck,
  Sliders,
  Settings,
  BarChart3,
  Tv,
  Check,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useCookieConsent } from './CookieConsentProvider';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

type CategoryKey = 'functional' | 'analytics' | 'marketing';

interface CategoryInfo {
  key: CategoryKey;
  icon: React.ReactNode;
  color: string;
  titleGu: string;
  titleEn: string;
  titleHi: string;
  descGu: string;
  descEn: string;
  descHi: string;
}

export function CookieSettingsModal() {
  const {
    isModalOpen,
    preferences,
    savePreferences,
    acceptAll,
    rejectOptional,
    closeSettingsModal,
  } = useCookieConsent();
  const { language } = useApp();

  const [draftPreferences, setDraftPreferences] = useState({
    functional: preferences.functional,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });
  const [expandedKey, setExpandedKey] = useState<CategoryKey | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setDraftPreferences({
        functional: preferences.functional,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      });
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isModalOpen, preferences]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) closeSettingsModal();
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeSettingsModal]);

  if (!isModalOpen) return null;

  const toggleCategory = (key: CategoryKey) => {
    setDraftPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    savePreferences({
      essential: true,
      functional: draftPreferences.functional,
      analytics: draftPreferences.analytics,
      marketing: draftPreferences.marketing,
    });
  };

  const categories: CategoryInfo[] = [
    {
      key: 'functional',
      icon: <Settings className="h-4 w-4" />,
      color: '#3b82f6',
      titleGu: '૨. કાર્યકારી અને વાંચક પસંદગીઓ',
      titleEn: '2. Functional & Reader Preferences',
      titleHi: '2. कार्यात्मक और पाठक प्राथमिकताएं',
      descGu: 'ડાર્ક/લાઇટ મોડ, ફોન્ટ સાઈઝ, પસંદ કરેલ જિલ્લો (અમદાવાદ/સુરત વગેરે) અને બુકમાર્ક કરેલા સમાચારો યાદ રાખવા માટે વપરાય છે.',
      descEn: 'Remembers your theme (light/dark mode), reader font size, district filter (Ahmedabad, Surat, etc.), and saved bookmarks on your device.',
      descHi: 'डार्क/लाइट मोड, फ़ॉन्ट आकार, चयनित जिला और आपके डिवाइस पर सहेजे गए बुकमार्क याद रखने के लिए उपयोग किया जाता है।',
    },
    {
      key: 'analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      color: '#8b5cf6',
      titleGu: '૩. વિશ્લેષણ અને વાચક આંકડા',
      titleEn: '3. Analytics & Readership',
      titleHi: '3. एनालिटिक्स और पाठक विश्लेषण',
      descGu: 'કયા લેખો અને કેટેગરીઝ વધુ વાંચવામાં આવે છે તે સમજીને પત્રકારત્વ અને પોર્ટલના પ્રદર્શનમાં સુધારો કરવામાં મદદ કરે છે. (કોઈપણ વ્યક્તિગત ડેટા વેચવામાં આવતો નથી).',
      descEn: 'Helps our editorial staff understand readership trends, article engagement, and page performance to improve coverage. No personal data is sold.',
      descHi: 'यह समझने में मदद करता है कि कौन से लेख अधिक पढ़े जा रहे हैं ताकि पोर्टल प्रदर्शन में सुधार हो सके। कोई व्यक्तिगत डेटा नहीं बेचा जाता है।',
    },
    {
      key: 'marketing',
      icon: <Tv className="h-4 w-4" />,
      color: '#f59e0b',
      titleGu: '૪. તૃતીય-પક્ષ મીડિયા અને વિડિઓ',
      titleEn: '4. Third-Party Media & Embeds',
      titleHi: '4. तृतीय-पक्ष मीडिया और वीडियो',
      descGu: 'યૂટ્યૂબ વિડિઓ પ્લેયર્સ (Shorts, Live TV) અને ગૂગલ મેપ્સ જેવા બાહ્ય એકીકરણ માટે જરૂરી છે. આ બંધ રાખવાથી વિડિઓ સીધા લોડ થવાને બદલે સંમતિ બટન બતાવશે.',
      descEn: 'Governs external interactive media like embedded YouTube players (Shorts, Live TV) and Google Maps. Disabling shows a privacy placeholder instead of loading third-party scripts.',
      descHi: 'एंबेडेड यूट्यूब प्लेयर और गूगल मैप्स जैसे बाहरी मीडिया को नियंत्रित करता है। इसे बंद करने पर सहमति बटन दिखाई देगा।',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', animation: 'gpModalFadeIn 0.2s ease both' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeSettingsModal(); }}
    >
      <style>{`
        @keyframes gpModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes gpModalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .gp-toggle-track { transition: background 0.2s ease; }
        .gp-toggle-thumb { transition: transform 0.2s ease; }
        .gp-cookie-actions button {
          font-size: 12px;
          font-weight: 600;
          line-height: 20px;
        }
      `}</style>

      <div
        ref={modalRef}
        className="relative w-full max-w-lg flex flex-col rounded-2xl overflow-hidden bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
        style={{
          maxHeight: '92vh',
          boxShadow: '0 32px 80px -16px rgba(0,0,0,0.35)',
          animation: 'gpModalSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-neutral-200/80 dark:border-white/8">
          {/* Red gradient accent */}
          <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, #B3121B 0%, #e53e3e 60%, #B3121B 100%)' }}
          />
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #B3121B 0%, #e53e3e 100%)' }}
            >
              <Sliders className="h-4 w-4" />
            </span>
            <div>
              <h2 id="cookie-settings-title" className="text-[15px] font-extrabold text-neutral-900 dark:text-white leading-tight">
                {getLocalized(language, {
                  gu: 'Cookie પ્રાઇવસી સેટિંગ્સ',
                  en: 'Cookie & Privacy Settings',
                  hi: 'कुकी और गोपनीयता सेटिंग्स',
                })}
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {getLocalized(language, {
                  gu: 'ગુજરાત પોસ્ટ પર ડેટા સેટિંગ્સ કસ્ટમાઇઝ કરો',
                  en: 'Customize data preferences on Gujarat Post',
                  hi: 'गुजरात पोस्ट पर डेटा सेटिंग्स अनुकूलित करें',
                })}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeSettingsModal}
            aria-label="Close dialog"
            className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/8 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* Strictly Necessary — always on */}
          <div className="relative rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 overflow-hidden"
          >
            <div className="relative flex items-start justify-between gap-4 px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] font-bold text-green-900 dark:text-green-300">
                      {getLocalized(language, {
                        gu: '૧. આવશ્યક સ્ટોરેજ',
                        en: '1. Strictly Necessary',
                        hi: '1. अनिवार्य स्टोरेज',
                      })}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-600 text-white">
                      <Lock className="h-2 w-2" />
                      {getLocalized(language, { gu: 'હંમેશા સક્રિય', en: 'Always On', hi: 'हमेशा सक्रिय' })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-green-800 dark:text-green-200 leading-relaxed">
                    {getLocalized(language, {
                      gu: 'લૉગિન, સુરક્ષા, ફોર્મ સબમિશન અને cookie પસંદગી સ્ટોર કરવા માટે જરૂરી.',
                      en: 'Required for session security, login, and storing your consent. Cannot be disabled.',
                      hi: 'सत्र सुरक्षा, लॉगिन और सहमति संग्रहीत करने के लिए आवश्यक।',
                    })}
                  </p>
                </div>
              </div>
              {/* Locked toggle */}
              <div className="shrink-0 mt-1">
                <div className="relative h-6 w-11 rounded-full bg-green-500 opacity-70 cursor-not-allowed">
                  <div className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow" />
                </div>
              </div>
            </div>
          </div>

          {/* Toggleable categories */}
          {categories.map((cat) => {
            const isOn = draftPreferences[cat.key];
            const isExpanded = expandedKey === cat.key;
            return (
              <div
                key={cat.key}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOn
                    ? 'border-red-200 dark:border-red-900 bg-white dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                      style={{ background: isOn ? cat.color : '#9ca3af' }}
                    >
                      {cat.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                        {getLocalized(language, { gu: cat.titleGu, en: cat.titleEn, hi: cat.titleHi })}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Expand/collapse */}
                    <button
                      type="button"
                      onClick={() => setExpandedKey(isExpanded ? null : cat.key)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      aria-expanded={isExpanded}
                      aria-controls={`cookie-description-${cat.key}`}
                    >
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 rotate-180 transition-transform" /> : <ChevronDown className="h-3.5 w-3.5 transition-transform" />}
                    </button>
                    {/* Toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      aria-label={getLocalized(language, { gu: cat.titleGu, en: cat.titleEn, hi: cat.titleHi })}
                      onClick={() => toggleCategory(cat.key)}
                      className="gp-toggle-track relative h-6 w-11 shrink-0 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      style={{ background: isOn ? '#B3121B' : '#d1d5db' }}
                    >
                      <span
                        className="gp-toggle-thumb absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
                        style={{ left: isOn ? '22px' : '2px' }}
                      />
                    </button>
                  </div>
                </div>
                {/* Expanded description */}
                {isExpanded && (
                  <div id={`cookie-description-${cat.key}`} className="px-4 pb-3.5 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    <p className="text-[11.5px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {getLocalized(language, { gu: cat.descGu, en: cat.descEn, hi: cat.descHi })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Policy links */}
          <p className="text-[11px] text-neutral-500 dark:text-neutral-500 px-1 leading-relaxed">
            {language === 'hi' ? 'हमारी' : language === 'en' ? 'Read our' : 'અમારી'}{' '}
            <Link href="/cookie-policy" className="text-red-600 dark:text-red-400 underline underline-offset-2 hover:text-red-700 font-medium transition-colors">Cookie Policy</Link>
            {' '}&{' '}
            <Link href="/privacy-policy" className="text-red-600 dark:text-red-400 underline underline-offset-2 hover:text-red-700 font-medium transition-colors">Privacy Policy</Link>
            {language === 'hi' ? ' पढ़ें।' : language === 'en' ? '.' : ' વાંચો.'}
          </p>
        </div>

        {/* Footer */}
        <div className="gp-cookie-actions relative shrink-0 border-t border-neutral-200 dark:border-neutral-700 px-5 py-4">
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5 [&_button]:flex [&_button]:w-full [&_button]:min-w-0 [&_button]:min-h-11 [&_button]:items-center [&_button]:justify-center [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-xs [&_button]:font-semibold [&_button]:leading-5 [&_button]:text-center [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-red-500">
            {/* Left: reject / accept all */}
            <div className="contents">
              <button
                type="button"
                onClick={rejectOptional}
                className="flex-1 sm:flex-none px-4 py-2 text-[12px] font-semibold rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer active:scale-95"
              >
                {getLocalized(language, { gu: 'માત્ર જરૂરી', en: 'Reject Optional', hi: 'केवल आवश्यक' })}
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="flex-1 sm:flex-none px-4 py-2 text-[12px] font-semibold rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer active:scale-95"
              >
                {getLocalized(language, { gu: 'બધા સ્વીકારો', en: 'Accept All', hi: 'सभी स्वीकारें' })}
              </button>
            </div>

            {/* Right: cancel + save */}
            <div className="contents">
              <button
                type="button"
                onClick={closeSettingsModal}
                className="px-4 py-2 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/8 transition-all cursor-pointer"
              >
                {getLocalized(language, { gu: 'રદ કરો', en: 'Cancel', hi: 'रद्द करें' })}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-[12px] font-black rounded-xl text-white transition-all cursor-pointer active:scale-95 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #B3121B 0%, #e53e3e 100%)',
                  boxShadow: '0 4px 14px -4px rgba(179,18,27,0.4)',
                }}
              >
                <Check className="h-3.5 w-3.5 shrink-0" />
                {getLocalized(language, { gu: 'સાચવો', en: 'Save Preferences', hi: 'सहेजें' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
