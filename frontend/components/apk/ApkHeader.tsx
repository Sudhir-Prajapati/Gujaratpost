'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search, ChevronDown, Home, MapPin, Video, Zap,
  AlertTriangle, Landmark, Briefcase, Trophy, Laptop, Sparkles, Check,
  Sun, Moon, User
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import UserAuthModal from '@/components/ui/UserAuthModal';
import gpLogo from '../../public/Gujarat Post Logo.gif';

const CATEGORIES = [
  { labelGu: 'હોમ', labelHi: 'होम', labelEn: 'Home', href: '/', icon: Home, isHome: true },
  { labelGu: 'ગુજરાત', labelHi: 'गुजरात', labelEn: 'Gujarat', href: '/category/gujarat', icon: MapPin },
  { labelGu: 'વીડિયો', labelHi: 'वीडियो', labelEn: 'Videos', href: '/videos', icon: Video },
  { labelGu: 'શૉર્ટ્સ', labelHi: 'शॉर्ट्स', labelEn: 'Shorts', href: '/shorts', icon: Zap },
  { labelGu: 'ક્રાઇમ', labelHi: 'क्राइम', labelEn: 'Crime', href: '/category/crime', icon: AlertTriangle },
  { labelGu: 'રાજકારણ', labelHi: 'राजनीति', labelEn: 'Politics', href: '/category/politics', icon: Landmark },
  { labelGu: 'બિઝનેસ', labelHi: 'व्यापार', labelEn: 'Business', href: '/category/business', icon: Briefcase },
  { labelGu: 'સ્પોર્ટ્સ', labelHi: 'खेल', labelEn: 'Sports', href: '/category/sports', icon: Trophy },
  { labelGu: 'ટેકનોલોજી', labelHi: 'टेक्नोलॉजी', labelEn: 'Tech', href: '/category/technology', icon: Laptop },
  { labelGu: 'મનોરંજન', labelHi: 'मनोरंजन', labelEn: 'Entertainment', href: '/category/entertainment', icon: Sparkles },
];

export default function ApkHeader() {
  const pathname = usePathname();
  const { language, setLanguage, apkTheme, toggleApkTheme } = useApp();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  // Smart scroll effect: Hide header on scroll down, reveal on scroll up
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show when near the very top
      if (currentScrollY <= 40) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // If language menu is open, don't auto-hide
      if (langMenuOpen) {
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // Scrolling down past threshold -> smoothly hide
      if (diff > 8) {
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      }
      // Scrolling up past threshold -> smoothly reveal
      else if (diff < -8) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [langMenuOpen]);

  // Always reveal header on route change
  useEffect(() => {
    setIsVisible(true);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCatLabel = (cat: typeof CATEGORIES[0]) => {
    if (language === 'hi') return cat.labelHi;
    if (language === 'en') return cat.labelEn;
    return cat.labelGu;
  };

  const getDropdownTitle = () => {
    if (language === 'hi') return 'भाषा चुनें';
    if (language === 'en') return 'Select Language';
    return 'ભાષા પસંદ કરો';
  };

  return (
    <header
      className={`sticky top-0 z-40 select-none shadow-md transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
    >
      {/* ── TOP RED HEADER BAR ─────────────────────────────────────── */}
      <div className="relative bg-[#B3121B] text-white px-3 py-2 flex items-center justify-between h-14 border-b border-black/10">
        {/* Left: Animated 3D Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center active:scale-95 transition shrink-0" aria-label="Gujarat Post Home">
            <div className="relative h-9.5 w-32 sm:w-36 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black/10">
              <Image
                src={gpLogo}
                alt="Gujarat Post"
                fill
                priority
                unoptimized
                sizes="(max-width: 640px) 128px, 144px"
                className="object-cover"
              />
            </div>
          </Link>
        </div>

        {/* Right: User Login + Theme Toggle + Search + Language Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* User Sign In / Profile Icon Button */}
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-white active:scale-90 transition shadow-xs shrink-0 cursor-pointer"
            title={language === 'hi' ? 'साइन इन करें' : language === 'en' ? 'Sign In' : 'સાઇન ઇન કરો'}
            aria-label="User sign in"
          >
            <User className="w-4 h-4 text-white" />
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleApkTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-white active:scale-90 transition shadow-xs shrink-0 cursor-pointer"
            title={apkTheme === 'dark' ? 'લાઇટ મોડ (Light Mode)' : 'ડાર્ક મોડ (Dark Mode)'}
            aria-label="Toggle dark/light theme"
          >
            {apkTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-100 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Search Icon */}
          <Link
            href="/search"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-white active:scale-95 transition shadow-xs shrink-0"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 bg-black/25 hover:bg-black/40 border border-white/20 px-2.5 py-1.5 rounded-full text-white text-xs font-black active:scale-95 transition cursor-pointer shadow-xs shrink-0"
              title={getDropdownTitle()}
            >
              <span className="font-extrabold uppercase leading-none">
                {language === 'gu' ? 'GU' : language === 'hi' ? 'HI' : 'EN'}
              </span>
              <ChevronDown className={`w-3 h-3 text-white/80 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#1f2026] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 text-gray-800 dark:text-gray-100 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  {getDropdownTitle()}
                </div>
                {[
                  { code: 'gu', label: 'ગુજરાતી', sub: 'GU' },
                  { code: 'hi', label: 'हिन्दी', sub: 'HI' },
                  { code: 'en', label: 'English', sub: 'EN' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code as any);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 font-bold flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#B3121B] transition cursor-pointer ${language === item.code
                      ? 'text-[#B3121B] bg-red-50/80 dark:bg-red-950/30 font-extrabold'
                      : 'text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">{item.label}</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{item.sub}</span>
                    </div>
                    {language === item.code && <Check className="w-4 h-4 text-[#B3121B] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL CATEGORIES PILLS BAR (Hidden on /shorts for full-screen immersive view) ── */}
      {pathname !== '/shorts' && (
        <div className="bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 shadow-xs px-2.5 py-2 overflow-x-auto scrollbar-hide flex items-center gap-1.5">
          {/* 1. Home Category */}
          <Link
            href="/"
            prefetch={true}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap ${pathname === '/'
              ? 'bg-[#B3121B] text-white shadow-xs'
              : 'bg-white dark:bg-[#27272a] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <Home className={`w-3.5 h-3.5 ${pathname === '/' ? 'text-white' : 'text-[#B3121B]'}`} />
            <span>{getCatLabel(CATEGORIES[0])}</span>
          </Link>

          {/* 2. NEWS BRIEF Quick Access Button */}
          <Link
            href="/news-brief"
            prefetch={true}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-black flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap ${pathname === '/news-brief'
              ? 'bg-[#B3121B] text-white shadow-xs'
              : 'bg-white dark:bg-[#27272a] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 shadow-2xs'
              }`}
          >
            <Image
              src="/rightSide.png"
              alt="NEWS BRIEF"
              width={15}
              height={15}
              className="shrink-0 object-contain"
            />
            <span translate="no" className="font-black font-sans uppercase">
              NEWS BRIEF
            </span>
          </Link>

          {/* 3. AQI Quick Access Button */}
          <Link
            href="/aqi"
            prefetch={true}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-black flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap ${pathname === '/aqi'
              ? 'bg-[#B3121B] text-white shadow-xs'
              : 'bg-white dark:bg-[#27272a] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 shadow-2xs'
              }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-amber-500 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="M20 12h2" />
              <path d="m19.07 4.93-1.41 1.41" />
              <path d="M15.9 16A5 5 0 1 0 9 10.45" />
              <path d="M17 20h-9a4 4 0 0 1 0-8h.4" />
            </svg>
            <span translate="no" className="font-black font-sans uppercase">
              AQI
            </span>
          </Link>

          {/* 4. Other Standard Categories */}
          {CATEGORIES.slice(1).map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = pathname.startsWith(cat.href);

            return (
              <Link
                key={idx}
                href={cat.href}
                prefetch={true}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap ${isActive
                  ? 'bg-[#B3121B] text-white shadow-xs'
                  : 'bg-white dark:bg-[#27272a] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#B3121B]'}`} />
                <span>{getCatLabel(cat)}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* User Login / Email Sign-In Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
      />
    </header>
  );
}
