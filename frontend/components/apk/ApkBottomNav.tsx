'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import ApkDrawer from './ApkDrawer';

export default function ApkBottomNav() {
  const pathname = usePathname();
  const { language } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isHomeActive = pathname === '/';
  const isVideosActive = pathname.startsWith('/videos');
  const isShortsActive = pathname.startsWith('/shorts');
  const isEpaperActive = pathname.startsWith('/epaper');

  const getLabel = (gu: string, hi: string, en: string) => {
    if (language === 'hi') return hi;
    if (language === 'en') return en;
    return gu;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 dark:bg-[#18181b]/98 backdrop-blur-md border-t border-gray-200/90 dark:border-gray-800 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.4)] select-none transition-colors duration-200">
        <div className="grid grid-cols-5 h-[58px] items-center px-1">
          {/* 1. HOME */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center h-full active:scale-90 transition-transform cursor-pointer"
          >
            {isHomeActive ? (
              <div className="w-8 h-8 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-xs">
                <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-5 h-5 fill-none stroke-current stroke-[1.9]"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
            )}
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                isHomeActive ? 'font-black text-[#B3121B]' : 'font-bold text-gray-500 dark:text-gray-400'
              }`}
            >
              {getLabel('હોમ', 'होम', 'Home')}
            </span>
          </Link>

          {/* 2. VIDEOS */}
          <Link
            href="/videos"
            className="flex flex-col items-center justify-center h-full active:scale-90 transition-transform cursor-pointer"
          >
            {isVideosActive ? (
              <div className="w-8 h-8 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-xs">
                <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-5 h-5 fill-none stroke-current stroke-[1.8]"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="3" width="20" height="15" rx="3" />
                  <polygon
                    points="10 7.5 16 10.5 10 13.5 10 7.5"
                    fill="currentColor"
                    stroke="none"
                  />
                  <path strokeLinecap="round" d="M8 21h8m-4-3v3" />
                </svg>
              </div>
            )}
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                isVideosActive ? 'font-black text-[#B3121B]' : 'font-bold text-gray-500 dark:text-gray-400'
              }`}
            >
              {getLabel('વીડિયો', 'वीडियो', 'Videos')}
            </span>
          </Link>

          {/* 3. SHORTS */}
          <Link
            href="/shorts"
            className="flex flex-col items-center justify-center h-full active:scale-90 transition-transform cursor-pointer"
          >
            {isShortsActive ? (
              <div className="w-8 h-8 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-xs">
                <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-5 h-5 fill-none stroke-current stroke-[1.9]"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  />
                </svg>
              </div>
            )}
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                isShortsActive ? 'font-black text-[#B3121B]' : 'font-bold text-gray-500 dark:text-gray-400'
              }`}
            >
              {getLabel('શોર્ટસ', 'शॉर्ट्स', 'Shorts')}
            </span>
          </Link>

          {/* 4. EPAPER */}
          <Link
            href="/epaper"
            className="flex flex-col items-center justify-center h-full active:scale-90 transition-transform cursor-pointer"
          >
            {isEpaperActive ? (
              <div className="w-8 h-8 rounded-full bg-[#B3121B] text-white flex items-center justify-center shadow-xs">
                <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-5 h-5 fill-none stroke-current stroke-[1.8]"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            )}
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                isEpaperActive ? 'font-black text-[#B3121B]' : 'font-bold text-gray-500 dark:text-gray-400'
              }`}
            >
              {getLabel('ઇ-પેપર', 'ई-पेपर', 'E-Paper')}
            </span>
          </Link>

          {/* 5. MENU */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center h-full active:scale-90 transition-transform cursor-pointer"
          >
            <div
              className={`w-8 h-8 flex items-center justify-center ${
                drawerOpen ? 'text-[#B3121B]' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <svg
                className="w-5 h-5 stroke-current stroke-[2.2]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <span
              className={`text-[10px] tracking-tight mt-0.5 ${
                drawerOpen ? 'font-black text-[#B3121B]' : 'font-bold text-gray-500 dark:text-gray-400'
              }`}
            >
              {getLabel('મેનુ', 'मेनू', 'Menu')}
            </span>
          </button>
        </div>
      </nav>

      {/* Side Menu Drawer */}
      <ApkDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
