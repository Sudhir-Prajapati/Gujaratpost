'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { useIsApk } from '@/lib/useIsApk';
import { X, RotateCcw, ChevronUp, ChevronDown, Check } from 'lucide-react';

const SIZES = [
  { level: 0, px: '14px', fillPct: 25, labelGu: 'નાના', labelHi: 'छोटे', labelEn: 'Small' },
  { level: 1, px: '16px', fillPct: 50, labelGu: 'સામાન્ય', labelHi: 'सामान्य', labelEn: 'Normal' },
  { level: 2, px: '18px', fillPct: 75, labelGu: 'મોટા', labelHi: 'बड़े', labelEn: 'Large' },
  { level: 3, px: '20px', fillPct: 100, labelGu: 'સૌથી મોટા', labelHi: 'बहुत बड़े', labelEn: 'XL' },
];

export default function FontSizeFloatingControl() {
  const pathname = usePathname();
  const { isApk } = useIsApk();
  const { fsLevel, setFsLevel, incFs, decFs, resetFs, language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

  // Handle Drag Up / Drag Down (Volume / Brightness Slider calculation)
  const calculateLevelFromY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    // 0 at bottom, 1 at top (like volume/brightness slider)
    const relativeY = clientY - rect.top;
    const fraction = 1 - Math.max(0, Math.min(1, relativeY / rect.height));

    let nextLevel = 0;
    if (fraction < 0.25) {
      nextLevel = 0; // 14px
    } else if (fraction < 0.55) {
      nextLevel = 1; // 16px (Normal)
    } else if (fraction < 0.82) {
      nextLevel = 2; // 18px (Large)
    } else {
      nextLevel = 3; // 20px (XL)
    }

    setFsLevel(nextLevel);
  }, [setFsLevel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    calculateLevelFromY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    calculateLevelFromY(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Don't render on admin, login, or news-brief screens
  if (!mounted || pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/cms-admin' || pathname === '/news-brief') {
    return null;
  }

  const currentSize = SIZES[fsLevel] || SIZES[1];
  const sizeLabel = language === 'hi' ? currentSize.labelHi : language === 'en' ? currentSize.labelEn : currentSize.labelGu;

  const titleText = language === 'hi' ? 'फ़ॉन्ट साइज़' : language === 'en' ? 'Font Size' : 'ફોન્ટ સાઇઝ (અક્ષરનું કદ)';
  const dragHintText = language === 'hi' ? 'ड्रैग अप/डाउन करें' : language === 'en' ? 'Drag Up / Down to adjust' : 'ઉપર / નીચે ડ્રેગ કરો';
  const resetText = language === 'hi' ? 'सामान्य साइज़ (रीसेट)' : language === 'en' ? 'Reset to Default' : 'સામાન્ય સાઇઝ (રીસેટ)';
  const buttonTitle = language === 'hi' ? 'फ़ॉन्ट आकार बदलें' : language === 'en' ? 'Adjust Font Size' : 'ફોન્ટ સાઇઝ નાની/મોટી કરો';

  // Position stacked above the megaphone button
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

      {/* Floating Volume/Brightness Slider Popover */}
      {isOpen && (
        <div
          className={`fixed ${popoverBottomClass} w-[265px] sm:w-[275px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-red-900/20 dark:border-neutral-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 select-none`}
        >
          {/* Header Bar */}
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

          {/* Body: Volume / Brightness Style Vertical Drag Slider */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 space-y-3">
            <div className="flex items-center gap-3">
              {/* Vertical Slider Capsule (Drag Up / Drag Down) */}
              <div className="flex flex-col items-center select-none">
                {/* Step Up (+) Arrow */}
                <button
                  type="button"
                  onClick={incFs}
                  disabled={fsLevel >= 3}
                  title="વધારો (Up)"
                  className="w-9 h-6 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 transition-all cursor-pointer mb-1"
                >
                  <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* The Drag Pill Capsule Track */}
                <div
                  ref={trackRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={`relative w-14 h-[164px] rounded-[24px] bg-neutral-200 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 overflow-hidden cursor-ns-resize touch-none shadow-inner transition-transform ${
                    isDragging ? 'scale-[1.03] border-red-500' : 'hover:border-red-400'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {/* Dynamic Gradient Liquid Fill (Rises from bottom to top like volume/brightness) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-700 via-red-600 to-red-500 transition-all duration-200 ease-out flex flex-col justify-start items-center pt-2"
                    style={{ height: `${currentSize.fillPct}%` }}
                  >
                    {/* White Grabber Pill / Thumb Handle */}
                    <div className="w-6 h-1 bg-white/90 rounded-full shadow-xs mb-1 animate-pulse" />
                  </div>

                  {/* Top Icon: Big 'A+' */}
                  <div className="absolute top-2.5 left-0 right-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-[13px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      A<span className="text-[10px]">+</span>
                    </span>
                  </div>

                  {/* Center Value Badge: shows px in real-time */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <div className="text-center px-1">
                      <span className="text-[14px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] tracking-tight block">
                        {currentSize.px}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Icon: Small 'A-' */}
                  <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      A<span className="text-[9px]">-</span>
                    </span>
                  </div>
                </div>

                {/* Step Down (-) Arrow */}
                <button
                  type="button"
                  onClick={decFs}
                  disabled={fsLevel <= 0}
                  title="ઘટાડો (Down)"
                  className="w-9 h-6 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 transition-all cursor-pointer mt-1"
                >
                  <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Right Side: 4 Step Notches (Direct Clickable Selection) */}
              <div className="flex-1 flex flex-col justify-between h-[164px] py-1 select-none">
                {SIZES.slice().reverse().map((item) => {
                  const isActive = fsLevel === item.level;
                  const itemLabel = language === 'hi' ? item.labelHi : language === 'en' ? item.labelEn : item.labelGu;

                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setFsLevel(item.level)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#B3121B] text-white border-[#B3121B] shadow-sm font-bold scale-[1.02]'
                          : 'bg-neutral-50 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700/70 hover:border-red-400 active:scale-95'
                      }`}
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="text-[12px] font-black">{item.px}</span>
                        <span className={`text-[10px] ${isActive ? 'text-white/90 font-semibold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {itemLabel}
                        </span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Hint and Reset Bar */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <span>↕</span> {dragHintText}
              </span>

              {/* Reset to 16px Default */}
              <button
                type="button"
                onClick={resetFs}
                className="text-[11px] font-semibold text-neutral-600 hover:text-red-600 dark:text-neutral-300 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                title="ડિફોલ્ટ 16px સાઇઝ પર સેટ કરો"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{resetText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
