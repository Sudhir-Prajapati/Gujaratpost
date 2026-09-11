'use client';

import { useState, useEffect } from 'react';

// Tracks whether the initial client hydration pass has completed
let hasHydrated = false;
let cachedIsApk = false;

function checkIsApkSync(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const previewParam = urlParams.get('preview');

    // Manual preview toggle for developers
    if (previewParam === 'apk' || previewParam === 'app') return true;
    if (previewParam === 'web' || previewParam === 'desktop') return false;

    // Check session cache so navigating between pages maintains the APK UI
    const sessionCache = sessionStorage.getItem('gp_is_apk');
    if (sessionCache === 'true') return true;
    if (sessionCache === 'false') return false;

    // 1. Android TWA / PWA Standalone Mode Check
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.matchMedia('(display-mode: fullscreen)').matches
      || (window.navigator as any).standalone === true;

    // 2. Android Package Referrer Check
    const isAndroidReferrer = document.referrer.includes('android-app://') || document.referrer.includes('app.vercel.gujaratpost.twa');

    // 3. User Agent check for TWA WebView
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isTwaUa = userAgent.includes('gujaratpost-app') || userAgent.includes('wv');

    return Boolean(isStandalone || isAndroidReferrer || isTwaUa);
  } catch {
    return false;
  }
}

export function useIsApk() {
  // During SSR and initial client hydration, start with false to match server HTML.
  // On all subsequent client renders/navigations, immediately use cachedIsApk without delay.
  const [isApk, setIsApk] = useState<boolean>(() => (hasHydrated ? cachedIsApk : false));
  const [isReady, setIsReady] = useState<boolean>(() => hasHydrated);

  useEffect(() => {
    hasHydrated = true;
    const detected = checkIsApkSync();
    cachedIsApk = detected;

    if (detected) {
      try {
        sessionStorage.setItem('gp_is_apk', 'true');
      } catch {}
    }

    setIsApk(detected);
    setIsReady(true);
  }, []);

  return { isApk, isReady };
}
