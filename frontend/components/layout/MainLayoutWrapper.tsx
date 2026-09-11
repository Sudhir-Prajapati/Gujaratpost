'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import BreakingTicker from './BreakingTicker';
import Footer from './Footer';
import SplashLoader from '@/components/ui/SplashLoader';
import TajSamacharDrawer from '@/components/ui/TajSamacharDrawer';
import { useIsApk } from '@/lib/useIsApk';
import ApkHeader from '@/components/apk/ApkHeader';
import ApkBottomNav from '@/components/apk/ApkBottomNav';

import { useApp } from '@/components/AppProvider';

interface Props {
  children: React.ReactNode;
}

export default function MainLayoutWrapper({ children }: Props) {
  const pathname = usePathname();
  const { isApk } = useIsApk();
  const { apkTheme } = useApp();

  // Admin and login pages manage their own layout — skip all frontend chrome
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // News brief has a minimal wrapper
  if (pathname === '/news-brief') {
    return <main className="min-h-screen bg-[#F8F9FA]">{children}</main>;
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
        <ApkBottomNav />
      </div>
    );
  }

  // STANDARD WEB & MOBILE BROWSER VIEW (100% UNTOUCHED):
  return (
    <>
      {pathname === '/' && <SplashLoader />}
      <Header />
      <BreakingTicker />
      <main className="min-h-[75vh]">{children}</main>
      <Footer />
      <TajSamacharDrawer />
    </>
  );
}
