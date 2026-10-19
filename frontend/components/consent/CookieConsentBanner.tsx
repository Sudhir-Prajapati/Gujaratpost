'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, X, ShieldCheck } from 'lucide-react';
import { useCookieConsent } from './CookieConsentProvider';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

export function CookieConsentBanner() {
  const { isBannerOpen, acceptAll, rejectOptional, openSettingsModal } = useCookieConsent();
  const { language } = useApp();

  return (
    <>
      {/* ── Compact Bottom-Right Cookie Consent Card ── */}
      {isBannerOpen && (
        <aside
          aria-label="Cookie Consent Banner"
          role="region"
          className="fixed bottom-4 right-4 z-50 w-[340px] sm:w-[360px] pointer-events-none"
          style={{ animation: 'gpCookieSlideUp 0.42s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <style>{`
            @keyframes gpCookieSlideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.96); }
              to   { opacity: 1; transform: translateY(0)   scale(1); }
            }
          `}</style>

          <div
            className="pointer-events-auto w-full relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.22)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.65)]"
            style={{ background: 'linear-gradient(160deg, #ffffff 0%, #fdf9f9 100%)' }}
          >
            {/* Dark mode bg */}
            <div
              className="absolute inset-0 hidden dark:block rounded-2xl pointer-events-none"
              style={{ background: 'linear-gradient(160deg, #1a1010 0%, #1e1212 100%)' }}
            />

            {/* Red accent top bar */}
            <div
              className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, #B3121B 0%, #e53e3e 60%, #B3121B 100%)' }}
            />

            <div className="relative px-4 pt-4.5 pb-4">

              {/* Header row: icon + title + close */}
              <div className="flex items-start gap-2.5">
                {/* Cookie badge */}
                <div
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-sm mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #fff3f3 0%, #ffe0e0 100%)' }}
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M18 3.5C10.02 3.5 3.5 10.02 3.5 18C3.5 25.98 10.02 32.5 18 32.5C25.98 32.5 32.5 25.98 32.5 18C32.5 16.92 32.38 15.86 32.16 14.84C30.85 15.34 29.41 15.08 28.32 14.16C27.05 13.08 26.68 11.33 27.32 9.85C26.04 9.2 25.25 7.86 25.37 6.4C25.44 5.48 24.08 4.02 22.3 3.82C20.9 3.61 19.46 3.5 18 3.5Z"
                      fill="#D87836"
                    />
                    <circle cx="11.5" cy="13" r="2.1" fill="#4A1F08" />
                    <circle cx="20.5" cy="11.5" r="1.9" fill="#4A1F08" />
                    <circle cx="15.5" cy="19.5" r="2.3" fill="#4A1F08" />
                    <circle cx="10" cy="23" r="1.8" fill="#4A1F08" />
                    <circle cx="21.5" cy="22" r="2.1" fill="#4A1F08" />
                    <circle cx="25.5" cy="16.5" r="1.7" fill="#4A1F08" />
                    <circle cx="8" cy="18" r="0.8" fill="#FCE8D5" opacity="0.7" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-50 leading-snug">
                    {getLocalized(language, {
                      gu: 'અમે cookies નો ઉપયોગ કરીએ છીએ.',
                      en: 'We use cookies on this site.',
                      hi: 'हम इस साइट पर cookies उपयोग करते हैं।',
                    })}
                  </p>
                  <p className="mt-1 text-[11.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {getLocalized(language, {
                      gu: 'અનુભવ સુધારવા માટે.',
                      en: 'To enhance your experience.',
                      hi: 'आपका अनुभव बेहतर करने के लिए।',
                    })}{' '}
                    <Link
                      href="/cookie-policy"
                      className="text-red-600 dark:text-red-400 underline underline-offset-2 hover:text-red-700 font-medium transition-colors"
                    >
                      {language === 'en' ? 'Learn more' : language === 'hi' ? 'अधिक जानें' : 'વધુ જાણો'}
                    </Link>
                  </p>
                </div>

                {/* Close X */}
                <button
                  type="button"
                  onClick={rejectOptional}
                  aria-label="Dismiss cookie notice"
                  className="shrink-0 p-1 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/8 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="mt-3.5 flex items-center gap-2">
                {/* Manage */}
                <button
                  type="button"
                  onClick={openSettingsModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer border border-neutral-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-900/40"
                >
                  <Settings className="h-3.5 w-3.5" />
                  {getLocalized(language, { gu: 'મેનેજ', en: 'Manage', hi: 'प्रबंधन' })}
                </button>

                {/* Reject */}
                <button
                  type="button"
                  onClick={rejectOptional}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-[12px] font-bold rounded-xl bg-neutral-100 dark:bg-white/8 hover:bg-neutral-200 dark:hover:bg-white/12 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  {getLocalized(language, { gu: 'નકારો', en: 'Reject', hi: 'अस्वीकार' })}
                </button>

                {/* Accept */}
                <button
                  type="button"
                  onClick={acceptAll}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-black rounded-xl text-white transition-all cursor-pointer active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #B3121B 0%, #e53e3e 100%)',
                    boxShadow: '0 4px 14px -4px rgba(179,18,27,0.5)',
                  }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {getLocalized(language, { gu: 'સ્વીકારો', en: 'Accept', hi: 'स्वीकारें' })}
                </button>
              </div>

            </div>
          </div>
        </aside>
      )}

      {/* Cookie trigger removed — nothing shown after user has decided */}
    </>
  );
}
