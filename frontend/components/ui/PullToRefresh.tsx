'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { useApp } from '@/components/AppProvider';

export default function PullToRefresh() {
  const { language } = useApp();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isEligibleRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  pullDistanceRef.current = pullDistance;
  isRefreshingRef.current = isRefreshing;

  const PULL_THRESHOLD = 68;
  const MAX_PULL = 92;
  const FRICTION = 0.42;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshingRef.current || e.touches.length !== 1) {
      isEligibleRef.current = false;
      return;
    }

    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop <= 1) {
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isEligibleRef.current = true;
    } else {
      isEligibleRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isEligibleRef.current || isRefreshingRef.current || e.touches.length !== 1) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - startYRef.current;
    const diffX = currentX - startXRef.current;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop > 1) {
      isEligibleRef.current = false;
      if (pullDistanceRef.current > 0) {
        setPullDistance(0);
        setIsPulling(false);
      }
      return;
    }

    // Only activate if dragging downward and mostly vertical
    if (diffY > 8 && Math.abs(diffY) > Math.abs(diffX) * 1.2) {
      const distance = Math.min(MAX_PULL, Math.pow(diffY * FRICTION, 0.95));
      setPullDistance(distance);
      setIsPulling(true);

      // Prevent native overscroll rubber-band conflict while dragging
      if (distance > 20 && e.cancelable) {
        e.preventDefault();
      }
    } else if (diffY <= 0 && pullDistanceRef.current > 0) {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isEligibleRef.current && !isPulling) return;
    isEligibleRef.current = false;

    const currentDist = pullDistanceRef.current;
    if (currentDist >= PULL_THRESHOLD && !isRefreshingRef.current) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);

      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      } catch { }

      // Smooth delay so the user sees the confirmation spinner before reload
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [isPulling]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isPulling && !isRefreshing && pullDistance === 0) return null;

  const isTriggered = pullDistance >= PULL_THRESHOLD;
  const rotation = Math.min(360, (pullDistance / PULL_THRESHOLD) * 360);

  const label = isRefreshing
    ? language === 'gu'
      ? 'રીફ્રેશ થઈ રહ્યું છે...'
      : language === 'hi'
      ? 'रिफ्रेश हो रहा है...'
      : 'Refreshing...'
    : isTriggered
    ? language === 'gu'
      ? 'રીફ્રેશ કરવા છોડો'
      : language === 'hi'
      ? 'रिफ्रेश करने के लिए छोड़ें'
      : 'Release to refresh'
    : language === 'gu'
    ? 'રીફ્રેશ કરવા નીચે ખેંચો'
    : language === 'hi'
    ? 'रिफ्रेश करने के लिए नीचे खींचें'
    : 'Pull down to refresh';

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[9999999] pointer-events-none flex justify-center transition-transform duration-200 ease-out select-none"
      style={{
        transform: `translateY(${Math.max(12, pullDistance - 15)}px)`,
        opacity: Math.min(1, pullDistance / 24),
      }}
      aria-live="polite"
    >
      <div className="inline-flex items-center gap-2.5 rounded-full bg-white/95 dark:bg-zinc-900/95 px-4 py-2 text-foreground shadow-2xl border border-red-200/90 dark:border-red-900/50 backdrop-blur-md">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-[#B3121B] text-white shadow-xs ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={
            !isRefreshing
              ? { transform: `rotate(${rotation}deg)`, transition: 'transform 0.1s linear' }
              : undefined
          }
        >
          {isRefreshing || isTriggered ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )}
        </div>
        <span className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
      </div>
    </div>
  );
}

