'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home, ArrowLeft, RefreshCcw } from 'lucide-react';

interface SiteMaintenanceErrorProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  isGlobal?: boolean;
}

export default function SiteMaintenanceError({
  error,
  reset,
}: SiteMaintenanceErrorProps) {
  const [countdown, setCountdown] = useState(5);
  const [isAutoReloadPaused, setIsAutoReloadPaused] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Auto-reload countdown timer (5 seconds)
  useEffect(() => {
    if (isAutoReloadPaused || isReloading) return;

    if (countdown <= 0) {
      setIsReloading(true);
      if (reset) {
        try {
          reset();
        } catch {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isAutoReloadPaused, isReloading, reset]);

  const handleManualReload = () => {
    setIsReloading(true);
    if (reset) {
      try {
        reset();
      } catch {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-[#0d0f17] dark:via-[#131622] dark:to-[#0d0f17] text-slate-800 dark:text-slate-100 font-sans px-4 py-8 select-none">
      {/* Top Header / Branding */}
      <header className="w-full max-w-4xl flex items-center justify-between pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <Link href="/" className="inline-block transition-transform hover:scale-102">
          <img
            src="/GujaratpostFinalLogo.png"
            alt="Gujarat Post"
            className="h-10 sm:h-12 w-auto object-contain"
            onError={(e) => {
              // Fallback if logo fails
              (e.currentTarget as HTMLImageElement).src = '/assets/GujaratLogo.png';
            }}
          />
        </Link>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>અપડેટ પ્રક્રિયા ચાલુ છે • Updating</span>
        </div>
      </header>

      {/* Main Content Center Card */}
      <main className="w-full max-w-xl mx-auto my-auto text-center py-8">
        {/* Animated Visual Gear / Pulse Graphic */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#C8101E]/15 via-red-500/10 to-amber-500/10 dark:from-[#C8101E]/25 dark:to-amber-500/20 border border-red-500/20 mb-6 shadow-xl shadow-red-500/5">
          <RefreshCcw className="w-12 h-12 sm:w-14 sm:h-14 text-[#C8101E] animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-0 rounded-3xl bg-red-500/5 blur-xl animate-pulse -z-10" />
        </div>

        {/* Headings */}
        <h1 className="text-2xl sm:text-4xl font-black text-[#171B2D] dark:text-white tracking-tight leading-tight">
          અમે ટૂંક સમયમાં પાછા આવીશું!
        </h1>
        <p className="text-base sm:text-lg font-bold text-slate-600 dark:text-slate-300 mt-2">
          We will be back in a short time
        </p>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-3 leading-relaxed">
          સાઇટ પર નવીનતમ સમાચારો અને ફીચર્સ અપડેટ થઈ રહ્યા છે. થોડી જ ક્ષણોમાં સાઇટ આપોઆપ શરૂ થઈ જશે. ધીરજ રાખવા બદલ આભાર!
        </p>

        {/* Live Auto-Reload Countdown Pill */}
        <div className="mt-6 inline-flex flex-col items-center gap-2 bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 shadow-md">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            <RotateCw className={`w-4 h-4 text-[#C8101E] ${isReloading ? 'animate-spin' : ''}`} />
            <span>
              {isReloading
                ? 'સાઇટ રિલોડ થઈ રહી છે...'
                : `${countdown} સેકન્ડમાં પેજ આપોઆપ રિફ્રેશ થશે...`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C8101E] to-red-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAutoReloadPaused((prev) => !prev)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer mt-1"
          >
            {isAutoReloadPaused ? 'ઓટો-રિલોડ શરૂ કરો (Resume)' : 'ઓટો-રિલોડ થોભાવો (Pause)'}
          </button>
        </div>

        {/* Manual Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={handleManualReload}
            disabled={isReloading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#C8101E] to-[#E01E2E] hover:from-[#A80F19] hover:to-[#C8101E] shadow-lg shadow-red-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
          >
            <RotateCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? 'રિલોડ થાય છે...' : 'હમણાં રિફ્રેશ કરો (Reload Now)'}</span>
          </button>

          <button
            type="button"
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white dark:bg-[#1a1c29] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>પાછા જાઓ (Go Back)</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>હોમ પેજ (Home)</span>
          </Link>
        </div>

        {/* Subtle error digest for dev diagnosis if available */}
        {error?.digest && (
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600 mt-8">
            Reference ID: {error.digest}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center pt-6 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 font-medium">
        © {new Date().getFullYear()} Gujarat Post • સત્ય અને સચોટ સમાચાર
      </footer>
    </div>
  );
}
