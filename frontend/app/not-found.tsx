'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Search, Compass, AlertCircle, Newspaper } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const quickLinks = [
    { label: 'મુખ્ય સમાચાર', labelEn: 'Top News', href: '/' },
    { label: 'ગુજરાત', labelEn: 'Gujarat', href: '/category/gujarat' },
    { label: 'ભારત', labelEn: 'National', href: '/category/national' },
    { label: 'મનોરંજન', labelEn: 'Entertainment', href: '/category/entertainment' },
    { label: 'રમતગમત', labelEn: 'Sports', href: '/category/sports' },
    { label: 'બિઝનેસ', labelEn: 'Business', href: '/category/business' },
  ];

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 sm:py-24 overflow-hidden bg-gradient-to-b from-zinc-50/50 via-white to-zinc-50/50 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950">
      {/* Decorative ambient background glows */}
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 bg-red-500/10 dark:bg-red-500/15 blur-3xl rounded-full" 
      />
      <div 
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-1/4 w-72 h-72 bg-amber-500/5 dark:bg-amber-500/10 blur-3xl rounded-full" 
      />

      <div className="relative w-full max-w-2xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200/80 dark:border-red-900/40 mb-6 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="tracking-wide">404 • પૃષ્ઠ મળ્યું નથી</span>
          <span className="text-red-300 dark:text-red-700">|</span>
          <span className="font-normal opacity-90">Page Not Found</span>
        </div>

        {/* Big 404 Number Graphic */}
        <div className="relative select-none my-2">
          <h1 className="text-8xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-600 font-sans leading-none">
            404
          </h1>
          {/* Subtle Glow Reflection behind 404 */}
          <div 
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center -z-10"
          >
            <span className="text-8xl sm:text-9xl font-black tracking-tight text-red-600/10 dark:text-red-500/20 blur-2xl select-none font-sans">
              404
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-4 mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            આ પેજ હાલમાં ઉપલબ્ધ નથી
          </h2>
          <p className="text-base sm:text-lg font-medium text-zinc-600 dark:text-zinc-300">
            This page is currently not available
          </p>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto pt-1 leading-relaxed">
            તમે જે પેજ શોધી રહ્યા છો તે કદાચ દૂર કરવામાં આવ્યું છે, તેનું નામ બદલાયું છે અથવા અસ્થાયી રૂપે ઉપલબ્ધ નથી. કૃપા કરીને સાચો URL તપાસો અથવા નીચે આપેલા વિકલ્પોનો ઉપયોગ કરો.
          </p>
        </div>

        {/* Action Buttons: Go Back & Home */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
          <button
            type="button"
            onClick={handleGoBack}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-zinc-600 dark:text-zinc-400" />
            <span>પાછા જાઓ (Go Back)</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-red-600/20 bg-red-600 hover:bg-red-700 text-white active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>હોમ પેજ પર જાઓ (Go to Home)</span>
          </Link>

          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/60"
          >
            <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>શોધ (Search)</span>
          </Link>
        </div>

        {/* Helpful Popular Sections Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xs shadow-xs text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3.5">
            <Compass className="w-4 h-4 text-red-600 dark:text-red-500" />
            <span>મુખ્ય વિભાગો (Popular Categories)</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 border border-transparent transition-all duration-150"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">({item.labelEn})</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
