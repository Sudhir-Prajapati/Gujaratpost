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
    }, 4000);
  }, []);

  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetAutoCloseTimer();
    } else {
      clearAutoCloseTimer();
      setDragPct(null);
      setIsDragging(false);
    }
  }, [isOpen, resetAutoCloseTimer, clearAutoCloseTimer]);

  // Click outside closes the slider
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

  // Calculate level directly from vertical pointer position on the 180px track
  const updateFromPointer = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    // fraction: 0 at bottom, 1 at top
    const fraction = 1 - Math.max(0, Math.min(1, relativeY / rect.height));
    const pct = Math.round(fraction * 100);
    setDragPct(pct);

    // Band mapping with a wide comfort zone for 16px (Normal)
    let nextLevel = 1;
    if (fraction < 0.25) {
      nextLevel = 0; // 14px
    } else if (fraction < 0.60) {
      nextLevel = 1; // 16px (Normal / Default)
    } else if (fraction < 0.85) {
      nextLevel = 2; // 18px (Large)
    } else {
      nextLevel = 3; // 20px (XL)
    }

    setFsLevel(nextLevel);
  }, [setFsLevel]);

  // Window-level butter-smooth pointer movement
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

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isOpen) {
      // If collapsed, only open! Never calculate or change font size on initial open tap!
      setIsOpen(true);
      return;
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

    if (!isOpen) {
      setIsOpen(true);
    } else {
      resetAutoCloseTimer();
    }
  };

  // Don't render on admin, login, or news-brief screens
  if (!mounted || pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/cms-admin' || pathname === '/news-brief') {
    return null;
  }

  const currentSize = SIZES[fsLevel] || SIZES[1];
  const sizeLabel = language === 'hi' ? currentSize.labelHi : language === 'en' ? currentSize.labelEn : currentSize.labelGu;

  // Visual fill height (matches user reference image: red liquid rising from bottom)
  const displayFillPct = isDragging && dragPct !== null ? dragPct : currentSize.fillPct;

  // Stasis bottom position cleanly stacked above bottom-left megaphone
  const bottomPos = isApk ? '126px' : '78px';
  const leftPos = isApk ? '16px' : '24px';
  const zIndexVal = isApk ? 45 : 9990;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: bottomPos,
        left: leftPos,
        zIndex: zIndexVal,
        display: 'flex',
        alignItems: 'flex-end',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Floating Readout Tooltip (Only visible while open/dragging, with hardcoded fixed px sizes) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: '54px',
            bottom: `${displayFillPct}%`,
            transform: 'translateY(50%)',
            pointerEvents: 'none',
            transition: isDragging ? 'none' : 'bottom 0.22s ease-out, transform 0.15s ease-out',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.92)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '9999px',
              padding: '4px 10px',
              fontSize: '12px',
              lineHeight: '1.2',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: '#ff6b6b', fontWeight: 900, fontSize: '13px' }}>{currentSize.px}</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '11px' }}>· {sizeLabel}</span>
          </div>
        </div>
      )}

      {/* The Standalone Vertical Volume Pill Slider (Exact match to reference Image 2, with FIXED px) */}
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        style={{
          position: 'relative',
          width: '44px',
          height: isOpen ? '180px' : '44px',
          borderRadius: '22px',
          border: '2.5px solid #ffffff',
          backgroundColor: '#000000',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          cursor: isOpen ? 'ns-resize' : 'pointer',
          touchAction: 'none',
          transition: 'height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.15s ease-out',
          boxSizing: 'border-box',
        }}
        title="ફોન્ટ સાઇઝ (અક્ષરનું કદ) - Drag Up/Down"
        aria-label="Font Size Control"
      >
        {/* Red Fill: Rises from bottom to top, exactly like the blue bar in reference Image 2 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: isOpen ? `${displayFillPct}%` : '100%',
            backgroundColor: '#e11d2e',
            pointerEvents: 'none',
            transition: isDragging ? 'none' : 'height 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
            boxSizing: 'border-box',
          }}
        />

        {/* White Font Icon 'A' at the bottom of the pill (matches music note in reference Image 2) */}
        <button
          type="button"
          onClick={handleIconClick}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            zIndex: 10,
            userSelect: 'none',
            padding: 0,
            margin: 0,
          }}
          aria-label="Font Size"
        >
          {/* Bold, clean white font symbol 'A' with FIXED px size so it NEVER scales */}
          <span
            style={{
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '16px',
              lineHeight: '1',
              display: 'flex',
              alignItems: 'baseline',
              textShadow: '0 1px 3px rgba(0,0,0,0.7)',
            }}
          >
            A<span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.95, marginLeft: '1px' }}>a</span>
          </span>
        </button>
      </div>
    </div>
  );
}
