'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import { useIsApk } from '@/lib/useIsApk';

// 4 discrete size steps: 14px (25%), 16px (50%), 18px (75%), 20px (100%)
const SIZES = [
  { level: 0, px: '14px', fillPct: 25, labelGu: 'નાના', labelHi: 'छोटे', labelEn: 'Small' },
  { level: 1, px: '16px', fillPct: 50, labelGu: 'સામાન્ય', labelHi: 'सामान्य', labelEn: 'Normal' },
  { level: 2, px: '18px', fillPct: 75, labelGu: 'મોટા', labelHi: 'बड़े', labelEn: 'Large' },
  { level: 3, px: '20px', fillPct: 100, labelGu: 'સૌથી મોટા', labelHi: 'बहुत बड़े', labelEn: 'XL' },
];

export default function FontSizeFloatingControl() {
  const pathname = usePathname();
  const { isApk } = useIsApk();
  const { fsLevel, setFsLevel, resetFs, language } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragPct, setDragPct] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setDragPct(null);
    }, 3500);
  }, []);

  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  // When open state changes
  useEffect(() => {
    if (isOpen) {
      resetAutoCloseTimer();
    } else {
      clearAutoCloseTimer();
      setDragPct(null);
      setIsDragging(false);
    }
  }, [isOpen, resetAutoCloseTimer, clearAutoCloseTimer]);

  // Click outside to close
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

  // Calculate level directly from vertical pointer position (drag up = increase, drag down = decrease)
  const updateFromPointer = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    // fraction: 0 at bottom, 1 at top
    const fraction = 1 - Math.max(0, Math.min(1, relativeY / rect.height));
    const pct = Math.round(fraction * 100);
    setDragPct(pct);

    let nextLevel = 0;
    if (fraction < 0.28) {
      nextLevel = 0; // 14px
    } else if (fraction < 0.58) {
      nextLevel = 1; // 16px (Normal / Default)
    } else if (fraction < 0.84) {
      nextLevel = 2; // 18px (Large)
    } else {
      nextLevel = 3; // 20px (XL)
    }

    setFsLevel(nextLevel);
  }, [setFsLevel]);

  // Butter-smooth window-level pointer tracking (no lag, 60-120fps)
  useEffect(() => {
    if (!isDragging) return;
    clearAutoCloseTimer();

    const onPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      updateFromPointer(e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setDragPct(null);
      resetAutoCloseTimer();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerUp, { passive: false });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, updateFromPointer, clearAutoCloseTimer, resetAutoCloseTimer]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isOpen) {
      setIsOpen(true);
    }
    setIsDragging(true);
    updateFromPointer(e.clientY);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    // Double tap resets to default 16px
    if (now - lastTapRef.current < 350) {
      resetFs();
      resetAutoCloseTimer();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (isOpen) {
      // Toggle or keep open
      resetAutoCloseTimer();
    } else {
      setIsOpen(true);
    }
  };

  // Skip on admin, login, cms, news-brief
  if (!mounted || pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/cms-admin' || pathname === '/news-brief') {
    return null;
  }

  const currentSize = SIZES[fsLevel] || SIZES[1];
  const sizeLabel = language === 'hi' ? currentSize.labelHi : language === 'en' ? currentSize.labelEn : currentSize.labelGu;

  // Visual fill height (matches user's volume bar: red liquid rising from bottom)
  const displayFillPct = isDragging && dragPct !== null ? dragPct : currentSize.fillPct;

  // Stasis bottom position cleanly stacked above bottom-left megaphone
  const bottomPosClass = isApk ? 'bottom-[126px] left-4 z-45' : 'bottom-[78px] left-6 z-[9990]';

  return (
    <div ref={containerRef} className={`fixed ${bottomPosClass} flex items-end select-none`}>
      {/* Floating Readout Tooltip (Only visible while dragging or right after adjusting) */}
      {isOpen && (
        <div
          className="absolute left-[54px] bottom-6 z-50 pointer-events-none transition-all duration-150 animate-in fade-in"
          style={{ transform: `translateY(-${(displayFillPct / 100) * 110}px)` }}
        >
          <div className="bg-black/90 backdrop-blur-md text-white border border-white/25 px-2.5 py-1 rounded-full text-xs font-black shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-red-400 font-extrabold">{currentSize.px}</span>
            <span className="text-white/80 font-medium text-[11px]">· {sizeLabel}</span>
          </div>
        </div>
      )}

      {/* The Standalone Vertical Volume/Brightness Pill Slider (Image 2 style) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className={`relative rounded-full border-[2.5px] border-white bg-black shadow-2xl shadow-black/80 overflow-hidden cursor-ns-resize touch-none select-none ${
          isOpen ? 'w-11 h-[172px]' : 'w-11 h-11'
        } transition-[height,transform] duration-300 ease-out active:scale-98`}
        style={{ touchAction: 'none' }}
        title="ફોન્ટ સાઇઝ (અક્ષરનું કદ) - Drag Up to increase, Drag Down to decrease"
        aria-label="Font Size Control"
      >
        {/* Red Fill: Rises from bottom to top, exactly like the blue bar in Image 2 */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#e11d2e] pointer-events-none"
          style={{
            height: isOpen ? `${displayFillPct}%` : '100%',
            // During active drag, no transition for instant 0ms finger tracking. When not dragging, smooth ease.
            transition: isDragging ? 'none' : 'height 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />

        {/* White Font Icon 'A' at the bottom of the pill (matches music note in Image 2) */}
        <button
          type="button"
          onClick={handleIconClick}
          className="absolute bottom-0 left-0 right-0 h-11 flex items-center justify-center text-white focus:outline-none cursor-pointer z-10 select-none"
          aria-label="Font Size"
        >
          {/* Bold, clean white font symbol 'A' matching Image 2 music note */}
          <span className="text-white font-black text-[16px] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] flex items-baseline">
            A<span className="text-[10px] font-bold opacity-95 ml-0.5">a</span>
          </span>
        </button>
      </div>
    </div>
  );
}
