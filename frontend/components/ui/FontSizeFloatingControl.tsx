'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { useIsApk } from '@/lib/useIsApk';
import { X, RotateCcw, Minus, Plus } from 'lucide-react';

const SIZES = [
  { level: 0, px: '14px', labelGu: 'નાના', labelHi: 'छोटे', labelEn: 'Small' },
  { level: 1, px: '16px', labelGu: 'સામાન્ય', labelHi: 'सामान्य', labelEn: 'Normal' },
  { level: 2, px: '18px', labelGu: 'મોટા', labelHi: 'बड़े', labelEn: 'Large' },
  { level: 3, px: '20px', labelGu: 'સૌથી મોટા', labelHi: 'बहुत बड़े', labelEn: 'XL' },
];

export default function FontSizeFloatingControl() {
  const pathname = usePathname();
  const { isApk } = useIsApk();
  const { fsLevel, setFsLevel, incFs, decFs, resetFs, language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Don't render on admin, login, or news-brief screens
  if (!mounted || pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/cms-admin' || pathname === '/news-brief') {
    return null;
  }

  const currentSize = SIZES[fsLevel] || SIZES[1];
  const sizeLabel = language === 'hi' ? currentSize.labelHi : language === 'en' ? currentSize.labelEn : currentSize.labelGu;

  const titleText = language === 'hi' ? 'फ़ॉन्ट साइज़' : language === 'en' ? 'Font Size' : 'ફોન્ટ સાઇઝ (અક્ષરનું કદ)';
  const resetText = language === 'hi' ? 'सामान्य साइज़ (रीसेट)' : language === 'en' ? 'Reset to Default' : 'સામાન્ય સાઇઝ (રીસેટ)';
  const buttonTitle = language === 'hi' ? 'फ़ॉन्ट आकार बदलें' : language === 'en' ? 'Adjust Font Size' : 'ફોન્ટ સાઇઝ નાની/મોટી કરો';

  // Positions cleanly stacked above the bottom-left megaphone button (TajSamacharDrawer)
  // Taj is bottom-6 (24px) in Web, bottom-[72px] in APK.
  // With 44px button height and ~10px gap, this sits at bottom-[78px] in Web, bottom-[126px] in APK.
  const buttonBottomClass = isApk ? 'bottom-[126px] left-4 z-45' : 'bottom-[78px] left-6 z-[9990]';
  const popoverBottomClass = isApk ? 'bottom-[176px] left-3 z-[9995]' : 'bottom-[132px] left-4 sm:left-6 z-[9995]';

  return (
    <div ref={containerRef}>
      {/* Floating Font Size Button */}
      <div className={`fixed ${buttonBottomClass} flex items-center`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={titleText}
          title={buttonTitle}
          className="relative group flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-black text-white shadow-xl shadow-red-900/40 border-2 border-white/30 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none cursor-pointer"
        >
          {/* Typography 'Aa' Icon */}
          <span className="font-black text-[15px] tracking-tight leading-none flex items-baseline select-none">
            A<span className="text-[10.5px] font-bold opacity-90 ml-0.5">a</span>
          </span>

          {/* Mini ± badge on bottom corner */}
          <span className="absolute -bottom-1 -right-1 bg-white text-red-700 text-[9px] font-black w-4 h-4 rounded-full border border-red-700/20 shadow-xs flex items-center justify-center leading-none select-none">
            ±
          </span>
        </button>
      </div>

      {/* Floating Popover Controls */}
      {isOpen && (
        <div
          className={`fixed ${popoverBottomClass} w-[280px] sm:w-[305px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-red-900/20 dark:border-neutral-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 select-none`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-black text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-[14px] tracking-tight leading-none flex items-baseline">
                A<span className="text-[10px] font-bold ml-0.5">a</span>
              </span>
              <h4 className="text-[13px] sm:text-[14px] font-bold tracking-wide leading-none">{titleText}</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Controls: [ A - ] [ Size Badge ] [ A + ] */}
          <div className="p-3.5 space-y-3 bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-2 bg-neutral-100 dark:bg-neutral-800/80 p-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
              {/* Decrease button */}
              <button
                type="button"
                onClick={decFs}
                disabled={fsLevel <= 0}
                title={language === 'gu' ? 'ફોન્ટ નાના કરો' : 'Decrease font size'}
                className="flex items-center justify-center gap-1 h-9 px-3 rounded-lg font-bold text-neutral-800 dark:text-neutral-100 bg-white dark:bg-neutral-700 shadow-xs border border-neutral-200/80 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-xs font-black">A</span>
              </button>

              {/* Current size indicator badge */}
              <div className="flex-1 text-center py-1">
                <div className="text-[13px] font-black text-red-600 dark:text-red-400 leading-tight">
                  {currentSize.px}
                </div>
                <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 leading-tight">
                  {sizeLabel}
                </div>
              </div>

              {/* Increase button */}
              <button
                type="button"
                onClick={incFs}
                disabled={fsLevel >= 3}
                title={language === 'gu' ? 'ફોન્ટ મોટા કરો' : 'Increase font size'}
                className="flex items-center justify-center gap-1 h-9 px-3 rounded-lg font-bold text-neutral-800 dark:text-neutral-100 bg-white dark:bg-neutral-700 shadow-xs border border-neutral-200/80 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-sm font-black">A</span>
              </button>
            </div>

            {/* 4 Quick Preset Buttons */}
            <div>
              <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 px-0.5">
                {language === 'gu' ? 'ઝડપી પસંદગી:' : language === 'hi' ? 'त्वरित चयन:' : 'Quick Select:'}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {SIZES.map((item) => {
                  const isActive = fsLevel === item.level;
                  const itemLabel = language === 'hi' ? item.labelHi : language === 'en' ? item.labelEn : item.labelGu;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setFsLevel(item.level)}
                      className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#B3121B] text-white border-[#B3121B] shadow-sm font-black scale-102'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-red-400 active:scale-95 font-medium'
                      }`}
                    >
                      <span className="text-[12px] leading-tight font-black">{item.px}</span>
                      <span className={`text-[10px] leading-tight ${isActive ? 'text-white/90 font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {itemLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset to Default Button */}
            <button
              type="button"
              onClick={resetFs}
              className="w-full pt-2 pb-0.5 text-xs font-semibold text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 border-t border-neutral-100 dark:border-neutral-800 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{resetText}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

