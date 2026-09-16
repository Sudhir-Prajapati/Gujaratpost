'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, Globe, Sun, Moon, User, Heart } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import UserAuthModal from '@/components/ui/UserAuthModal';
import gpLogo from '../../public/Gujarat Post Logo.gif';

interface ApkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryItem {
  nameGu: string;
  nameHi: string;
  nameEn: string;
  href: string;
  isExternal?: boolean;
}

const ALL_APP_CATEGORIES: CategoryItem[] = [
  { nameGu: 'હોમ', nameHi: 'होम', nameEn: 'Home', href: '/' },
  { nameGu: 'ન્યૂઝ બ્રીફ (NEWS BRIEF)', nameHi: 'न्यूज़ ब्रीफ (NEWS BRIEF)', nameEn: 'News Brief', href: '/news-brief' },
  { nameGu: 'હવામાન & AQI', nameHi: 'मौसम & AQI', nameEn: 'Weather & AQI', href: '/aqi' },
  { nameGu: 'વીડિયો', nameHi: 'वीडियो', nameEn: 'Videos', href: '/videos' },
  { nameGu: 'ગુજરાત', nameHi: 'गुजरात', nameEn: 'Gujarat', href: '/category/gujarat' },
  { nameGu: 'દેશ', nameHi: 'देश', nameEn: 'India', href: '/category/national' },
  { nameGu: 'વિદેશ', nameHi: 'विदेश', nameEn: 'World', href: '/category/world' },
  { nameGu: 'રાજકારણ', nameHi: 'राजनीति', nameEn: 'Politics', href: '/category/politics' },
  { nameGu: 'ક્રાઇમ', nameHi: 'क्राइम', nameEn: 'Crime', href: '/category/crime' },
  { nameGu: 'હેલ્થ', nameHi: 'हेल्थ', nameEn: 'Health', href: '/category/health' },
  { nameGu: 'મનોરંજન', nameHi: 'मनोरंजन', nameEn: 'Entertainment', href: '/category/entertainment' },
  { nameGu: 'ટેકનોલોજી', nameHi: 'टेक्नोलॉजी', nameEn: 'Technology', href: '/category/technology' },
  { nameGu: 'ફોટો ગેલેરી', nameHi: 'फोटो गैलरी', nameEn: 'Photo Gallery', href: '/photos' },
  { nameGu: 'ફેક્ટ ચેક', nameHi: 'फैक्ट चेक', nameEn: 'Fact Check', href: '/category/fact-check' },
  { nameGu: 'ટ્રેન્ડિંગ', nameHi: 'ट्रेंडिंग', nameEn: 'Trending', href: '/category/trending' },
  { nameGu: 'ચૂંટણી 2027', nameHi: 'चुनाव 2027', nameEn: 'Election 2027', href: '/category/election-2027' },
  { nameGu: 'પોડકાસ્ટ', nameHi: 'पॉडकास्ट', nameEn: 'Podcast', href: '/videos?tab=podcast' },
  { nameGu: 'તાજા સમાચાર', nameHi: 'ताजा समाचार', nameEn: 'Latest News', href: '/category/latest' },
  { nameGu: 'ઇન્સ્ટાગ્રામ', nameHi: 'इंस्टाग्राम', nameEn: 'Instagram', href: 'https://www.instagram.com/gujaratpost.in/', isExternal: true },
  { nameGu: 'શોર્ટ વીડિયો', nameHi: 'शॉर्ट वीडियो', nameEn: 'Short Videos', href: '/shorts' },
  { nameGu: 'હવામાન', nameHi: 'मौसम', nameEn: 'Weather', href: '/category/weather' },
  { nameGu: 'વેપાર', nameHi: 'व्यापार', nameEn: 'Business', href: '/category/business' },
  { nameGu: 'રમત-જગત', nameHi: 'खेल', nameEn: 'Sports', href: '/category/sports' },
  { nameGu: 'શિક્ષણ', nameHi: 'शिक्षा', nameEn: 'Education', href: '/category/education' },
  { nameGu: 'વરસાદ', nameHi: 'वर्षा / बारिश', nameEn: 'Rainfall', href: '/category/varsad' },
  { nameGu: 'લાઈફસ્ટાઈલ', nameHi: 'लाइफस्टाइल', nameEn: 'Lifestyle', href: '/category/lifestyle' },
  { nameGu: 'ગોલ્ડ - સિલ્વર', nameHi: 'गोल्ड - सिल्वर', nameEn: 'Gold - Silver', href: '/category/gold-silver' },
  { nameGu: 'આજના ખાસ ફોટા', nameHi: 'आज के खास फोटो', nameEn: 'Special Photos', href: '/photos' },
  { nameGu: 'નોકરી & કારકિર્દી', nameHi: 'नौकरी & करियर', nameEn: 'Jobs & Career', href: '/category/jobs' },
  { nameGu: 'અન્ય શહેરો', nameHi: 'अन्य शहर', nameEn: 'Other Cities', href: '/category/other-cities' },
];

const APK_SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/gujaratpostnews',
    bg: 'bg-[#1877F2] text-white hover:bg-[#166fe5]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/gujaratpost.in/',
    bg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@Gujaratpostnews',
    bg: 'bg-[#FF0000] text-white hover:bg-[#e60000]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: 'https://t.me/gujaratpostnews',
    bg: 'bg-[#229ED9] text-white hover:bg-[#1e8dbf]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white translate-x-[-0.5px] translate-y-[0.5px]" aria-hidden="true">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://whatsapp.com/channel/0029Va9y6Xn9RZAY5m4f8V1a',
    bg: 'bg-[#25D366] text-white hover:bg-[#20bd5a]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12.004 2.003A9.998 9.998 0 0 0 2 12.001c0 1.762.46 3.418 1.268 4.858L2.05 21.78a.5.5 0 0 0 .607.632l5.09-1.336A9.953 9.953 0 0 0 12.004 22c5.522 0 9.998-4.477 9.998-9.999S17.526 2.003 12.004 2.003zm0 18.001a8.299 8.299 0 0 1-4.232-1.156l-.303-.18-3.024.793.808-2.955-.198-.32A8.3 8.3 0 0 1 3.7 12.001c0-4.584 3.73-8.31 8.304-8.31 4.576 0 8.305 3.726 8.305 8.31 0 4.583-3.73 8.303-8.305 8.303z"/>
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/gujaratpostnews',
    bg: 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-black/10 dark:border-white/10',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Google News',
    href: 'https://news.google.com/publications/CAAqBwgKMMT_nwsw5-axAw',
    bg: 'bg-[#4285F4] text-white hover:bg-[#3367d6]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
];

export default function ApkDrawer({ isOpen, onClose }: ApkDrawerProps) {
  const pathname = usePathname();
  const { language, setLanguage, apkTheme, toggleApkTheme, openSupportModal } = useApp();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('gp_user_email');
      const isVerified = localStorage.getItem('gp_user_verified') === 'true';
      if (email && isVerified) {
        setUserEmail(email);
      } else {
        setUserEmail(null);
      }
    }
  }, [isOpen, authModalOpen]);

  // Lock body scroll and prevent background scrolling while drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCatName = (cat: CategoryItem) => {
    if (language === 'hi') return cat.nameHi;
    if (language === 'en') return cat.nameEn;
    return cat.nameGu;
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] bg-white dark:bg-[#18181b] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overscroll-contain">
        {/* Drawer Header */}
        <div className="bg-[#B3121B] text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <div className="relative h-9.5 w-32 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black/10">
              <Image
                src={gpLogo}
                alt="Gujarat Post"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account & Support Us Quick Action Bar */}
        <div className="p-3 bg-red-50/70 dark:bg-red-950/20 border-b border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-2">
          {/* User Sign In / Profile Button */}
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#27272a] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 flex items-center gap-2 hover:border-[#B3121B]/40 active:scale-95 transition shadow-2xs cursor-pointer overflow-hidden"
          >
            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 text-[#B3121B] flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[11px] font-black leading-none truncate">
                {userEmail ? 'મારું એકાઉન્ટ' : (language === 'hi' ? 'साइन इन करें' : language === 'en' ? 'Sign In' : 'સાઇન ઇન')}
              </span>
              <span className="text-[9px] text-gray-400 font-semibold truncate leading-tight mt-0.5">
                {userEmail || (language === 'hi' ? 'ईमेल से लॉगिन' : language === 'en' ? 'Email Login' : 'ઇમેઇલ લોગિન')}
              </span>
            </div>
          </button>

          {/* Support Us Button */}
          <button
            type="button"
            onClick={() => {
              openSupportModal();
            }}
            className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center gap-1.5 font-black text-xs shadow-md active:scale-95 transition cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-rose-100 text-rose-100 animate-pulse shrink-0" />
            <span className="truncate">{language === 'hi' ? 'सपोर्ट करें' : language === 'en' ? 'Support Us' : 'સપોર્ટ કરો'}</span>
          </button>
        </div>

        {/* Language Selection */}
        <div className="p-3 bg-gray-50 dark:bg-[#1e1e24] border-b border-gray-200 dark:border-gray-800">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            {language === 'hi' ? 'भाषा चुनें (Language)' : language === 'en' ? 'Select Language' : 'ભાષા પસંદ કરો (Language)'}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { code: 'gu', label: 'ગુજરાતી' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'en', label: 'English' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code as any)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition text-center cursor-pointer ${
                  language === lang.code
                    ? 'bg-[#B3121B] text-white border-[#B3121B] shadow-xs'
                    : 'bg-white dark:bg-[#27272a] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark / Light Mode Switcher */}
        <div className="p-3 bg-gray-50 dark:bg-[#1e1e24] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {apkTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            )}
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {apkTheme === 'dark'
                ? (language === 'hi' ? 'डार्क मोड सक्रिय' : language === 'en' ? 'Dark Mode Active' : 'ડાર્ક મોડ સક્રિય')
                : (language === 'hi' ? 'लाइट मोड सक्रिय' : language === 'en' ? 'Light Mode Active' : 'લાઇટ મોડ સક્રિય')}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleApkTheme}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              apkTheme === 'dark' ? 'bg-[#B3121B]' : 'bg-gray-300 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={apkTheme === 'dark'}
            title={apkTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                apkTheme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Categories List (2-column pill grid matching website drawer) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-3.5">
          <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
            {language === 'hi' ? 'श्रेणियां (Categories)' : language === 'en' ? 'Categories' : 'શ્રેણીઓ (Categories)'}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {ALL_APP_CATEGORIES.map((cat, idx) => {
              const active = isActive(cat.href);
              const isExternal = cat.isExternal || cat.href.startsWith('http');

              if (isExternal) {
                return (
                  <a
                    key={`cat-${idx}`}
                    href={cat.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="h-11 flex items-center justify-center text-center rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-[#F4F4F6] dark:bg-[#222228] px-2.5 text-[13px] font-bold text-gray-800 dark:text-gray-200 transition hover:border-[#B3121B]/40 hover:text-[#B3121B] active:scale-95 shadow-2xs"
                  >
                    <span className="truncate">{getCatName(cat)}</span>
                  </a>
                );
              }

              return (
                <Link
                  key={`cat-${idx}`}
                  href={cat.href}
                  prefetch={true}
                  onClick={onClose}
                  className={`h-11 flex items-center justify-center text-center rounded-2xl border px-2.5 text-[13px] font-bold transition active:scale-95 shadow-2xs ${
                    active
                      ? 'border-[#B3121B]/40 bg-[#FDF2F2] dark:bg-red-950/40 text-[#B3121B] font-extrabold gap-1.5'
                      : 'border-gray-200/90 dark:border-gray-800 bg-[#F4F4F6] dark:bg-[#222228] text-gray-800 dark:text-gray-200 hover:border-[#B3121B]/40 hover:text-[#B3121B]'
                  }`}
                >
                  {active && (
                    <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#B3121B]" />
                  )}
                  <span className="truncate">{getCatName(cat)}</span>
                </Link>
              );
            })}
          </div>

          {/* Social Follow Links Bar (Matching Reference Screenshot - Vibrant Brand Icons) */}
          <div className="pt-3.5 pb-2 border-t border-gray-200/80 dark:border-gray-800">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[12px] font-extrabold text-gray-700 dark:text-gray-300 shrink-0">
                Follow Us:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {APK_SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.label}
                    aria-label={item.label}
                    className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shadow-xs transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${item.bg}`}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-gray-50 dark:bg-[#1e1e24] border-t border-gray-200 dark:border-gray-800 text-center text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          © 2026 Gujarat Post. All rights reserved.
        </div>
      </div>

      {/* User Login / Email Sign-In Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
      />
    </div>
  );
}
