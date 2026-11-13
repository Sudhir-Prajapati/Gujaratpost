'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import BreakingTicker from './BreakingTicker';
import Footer from './Footer';
import SplashLoader from '@/components/ui/SplashLoader';
import TajSamacharDrawer from '@/components/ui/TajSamacharDrawer';
import FontSizeFloatingControl from '@/components/ui/FontSizeFloatingControl';
import { useIsApk } from '@/lib/useIsApk';
import ApkHeader from '@/components/apk/ApkHeader';
import ApkBottomNav from '@/components/apk/ApkBottomNav';

import { useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { stopArticleAudio } from '@/lib/articleTtsPlayer';

interface Props {
  children: React.ReactNode;
}

export default function MainLayoutWrapper({ children }: Props) {
  const pathname = usePathname();
  const { isApk } = useIsApk();
  const { apkTheme } = useApp();

  // Instantly stop any active article TTS voice when navigating to another article/page
  useEffect(() => {
    stopArticleAudio();
  }, [pathname]);

  // Gracefully handle ChunkLoadError from HMR / dynamic chunk invalidations
  useEffect(() => {
    const handleChunkError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'reason' in e ? e.reason : e.error;
      const msg = error?.message || (typeof error === 'string' ? error : '');
      const name = error?.name || '';
      if (
        name === 'ChunkLoadError' ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to load chunk')
      ) {
        const storageKey = 'gp_last_chunk_reload';
        const lastReload = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
        if (Date.now() - lastReload > 8000) {
          sessionStorage.setItem(storageKey, String(Date.now()));
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);
    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  // Admin and login pages manage their own layout — skip all frontend chrome
  if (pathname === '/login' || pathname === '/cms-admin' || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // News brief has a minimal locked viewport wrapper
  if (pathname === '/news-brief') {
    return <main className="fixed inset-0 h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden bg-[#f0f2f5] dark:bg-[#0c0d10] text-gray-900 dark:text-gray-100 select-none touch-none overscroll-none">{children}</main>;
  }

  // DEDICATED ANDROID MOBILE APK VIEW:
  // Rendered ONLY inside the installed Android APK (TWA) or ?preview=apk.
  // Standard Desktop Website & Mobile Browser Website remain 100% UNTOUCHED below.
  if (isApk) {
    return (
      <div
        className={`min-h-screen ${apkTheme === 'dark' ? 'dark bg-[#0f1015] text-gray-100' : 'bg-[#F8F9FA] text-gray-900'} transition-colors duration-200`}
        data-theme={apkTheme}
      >
        <ApkHeader />
        <main className={`min-h-[80vh] pb-16 ${apkTheme === 'dark' ? 'bg-[#0f1015]' : 'bg-[#F8F9FA]'}`}>{children}</main>
        <TajSamacharDrawer />
        <FontSizeFloatingControl />
        <ApkBottomNav />
      </div>
    );
  }

  // STANDARD WEB & MOBILE BROWSER VIEW:
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-1 flex-[1_0_auto] w-full flex-col bg-background">
      {pathname === '/' && <SplashLoader />}
      <div className="flex-shrink-0">
        <Header />
        <BreakingTicker />
      </div>
      <main className="flex-1 flex-[1_0_auto] min-h-0 w-full flex flex-col">{children}</main>
      <Footer />
      <TajSamacharDrawer />
      <FontSizeFloatingControl />
    </div>
  );
}
