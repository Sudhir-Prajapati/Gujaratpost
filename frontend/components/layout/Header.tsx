'use client';

/* eslint-disable @next/next/no-html-link-for-pages */
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
  Home,
  Heart,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { SocialLinks } from '@/components/ui/SocialLinks';
import Advertisement from '@/components/ads/Advertisement';
import DistrictBar from './DistrictBar';
import gpLogo from '../../public/Gujarat Post Logo.gif';
import { getPublicCategories } from '@/lib/api';
import UserAuthModal from '@/components/ui/UserAuthModal';

const languageLabels = {
  gu: 'ગુજરાતી',
  en: 'English',
  hi: 'हिन्दी',
};

const cityTranslations: Record<string, { gu: string; hi: string; en: string }> = {
  'અમદાવાદ': { gu: 'અમદાવાદ', hi: 'अहमदाबाद', en: 'Ahmedabad' },
  'સુરત': { gu: 'સુરત', hi: 'सूरत', en: 'Surat' },
  'વડોદરા': { gu: 'વડોદરા', hi: 'वडोदरा', en: 'Vadodara' },
  'રાજકોટ': { gu: 'રાજકોટ', hi: 'राजकोट', en: 'Rajkot' },
  'ગાંધીનગર': { gu: 'ગાંધીનગર', hi: 'गांधीनगर', en: 'Gandhinagar' },
  'અન્ય': { gu: 'અન્ય', hi: 'अन्य', en: 'Other' },
};

function AppleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.72-1.18 1.86-1.03 2.97 1.12.09 2.27-.6 2.98-1.41z" />
    </svg>
  );
}

function PlayStoreIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 466 511.98" className={className}>
      <path fill="#EA4335" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z" />
      <path fill="#FBBC04" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z" />
      <path fill="#34A853" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z" />
      <path fill="#4285F4" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z" />
    </svg>
  );
}

// The 12 flat navigation links shown in the nav bar
const NAV_LINKS = [
  { label: 'Home', labelGu: 'હોમ', labelHi: 'होम', href: '/' },
  { label: 'Videos', labelGu: 'વીડિયો', labelHi: 'वीडियो', href: '/videos' },
  { label: 'Gujarat', labelGu: 'ગુજરાત', labelHi: 'गुजरात', href: '/category/gujarat' },
  { label: 'India', labelGu: 'ભારત', labelHi: 'भारत', href: '/category/national' },
  { label: 'World', labelGu: 'વિશ્વ', labelHi: 'विश्व', href: '/category/world' },
  { label: 'Politics', labelGu: 'રાજનીતિ', labelHi: 'राजनीति', href: '/category/politics' },
  { label: 'Crime', labelGu: 'ક્રાઇમ', labelHi: 'क्राइम', href: '/category/crime' },
  { label: 'Health', labelGu: 'હેલ્થ', labelHi: 'स्वास्थ्य', href: '/category/health' },
  { label: 'Entertainment', labelGu: 'મનોરંજન', labelHi: 'मनोरंजन', href: '/category/entertainment' },
  { label: 'Technology', labelGu: 'ટેક્નોલોજી', labelHi: 'टेक्नोलॉजी', href: '/category/technology' },
  { label: 'Fact Check', labelGu: 'ફેક્ટ ચેક', labelHi: 'फैक्टर चेक', href: '/category/fact-check' },
  { label: 'Trending', labelGu: 'ટ્રેન્ડિંગ', labelHi: 'ट्रेंडिंग', href: '/category/trending' },
];

// The links shown under the "More/Other" (અન્ય) dropdown
const OTHER_LINKS = [
  { label: 'Webstory', labelGu: 'વેબસ્ટોરી', labelHi: 'वेब स्टोरीज', href: '/category/webstory' },
  { label: 'Weather', labelGu: 'હવામાન', labelHi: 'मौसम', href: '/category/weather' },
  { label: 'Gold - Silver', labelGu: 'ગોલ્ડ - સિલ્વર', labelHi: 'गोल्ड - सिल्वर', href: '/category/gold-silver' },
];

const formatDateLong = (lang: string) => {
  const locale = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-GB';
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateShort = (lang: string) => {
  const locale = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-GB';
  return new Date().toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const CATEGORY_TRANSLATIONS: Record<string, { en: string; hi: string; gu: string }> = {
  'varsad': { en: 'Rainfall', hi: 'वर्षा', gu: 'વરસાદ' },
  'rain': { en: 'Rainfall', hi: 'वर्षा', gu: 'વરસાદ' },
  'weather': { en: 'Weather', hi: 'मौसम', gu: 'હવામાન' },
  'sports': { en: 'Sports', hi: 'खेल', gu: 'રમત-જગત' },
  'education': { en: 'Education', hi: 'शिक्षा', gu: 'શિક્ષણ' },
  'lifestyle': { en: 'Lifestyle', hi: 'लाइफस्टाइल', gu: 'લાઇફસ્ટાઇલ' },
  'gold-silver': { en: 'Gold - Silver', hi: 'गोल्ड - सिल्वर', gu: 'ગોલ્ડ - સિલ્વર' },
  'webstory': { en: 'Webstory', hi: 'वेब स्टोरीज', gu: 'વેબસ્ટોરી' },
};

export default function Header() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  const router = useRouter();
  const { theme, toggleTheme, language, setLanguage, fsLevel, incFs, decFs, openSupportModal } = useApp();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCity, setSelectedCity] = useState('અમદાવાદ');
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [otherMenuOpen, setOtherMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);
  const [hideStickyNav, setHideStickyNav] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(84);

  useEffect(() => {
    const handleScroll = () => {
      const infiniteAdEl = document.getElementById('infinite-ads-section');
      if (!infiniteAdEl) {
        setHideStickyNav(false);
        return;
      }
      const rect = infiniteAdEl.getBoundingClientRect();
      if (rect.top <= 100) {
        setHideStickyNav(true);
      } else {
        setHideStickyNav(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Measure header height so mobile menu overlay starts right below it
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [mounted]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const updateSavedCount = () => {
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedCount(parsed.length);
          return;
        }
      }
      setSavedCount(0);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    try {
      const savedCity = localStorage.getItem('gp-selected-city');
      if (savedCity) {
        setSelectedCity(savedCity);
      } else {
        localStorage.setItem('gp-selected-city', 'અમદાવાદ');
      }
    } catch (e) {
      console.warn(e);
    }
    updateSavedCount();
    window.addEventListener('gp-saved-changed', updateSavedCount);
    window.addEventListener('storage', updateSavedCount);
    return () => {
      window.removeEventListener('gp-saved-changed', updateSavedCount);
      window.removeEventListener('storage', updateSavedCount);
    };
  }, []);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setCityModalOpen(false);
    try {
      localStorage.setItem('gp-selected-city', city);
      window.dispatchEvent(new CustomEvent('gp-city-changed', { detail: city }));
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageChosen, setLanguageChosen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lock background body scroll when mobile menu drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [menuOpen]);

  // On mount: check if user has explicitly chosen a language this session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('gp-lang-chosen') === 'true') {
        setLanguageChosen(true);
      }
    } catch (e) {
      // sessionStorage not available — treat as not chosen
    }
  }, []);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    getPublicCategories({ showInHeader: true })
      .then((cats) => {
        if (cats && Array.isArray(cats) && cats.length > 0) {
          setDbCategories(cats);
        }
      })
      .catch(() => { });
  }, []);

  const { navLinks, otherLinks } = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) {
      return { navLinks: NAV_LINKS, otherLinks: OTHER_LINKS };
    }

    const mapCategory = (c: any) => {
      const slugLower = (c.slug || '').toLowerCase();
      let href = `/category/${c.slug}`;
      if (slugLower === 'home' || slugLower === 'main') href = '/';
      else if (slugLower === 'videos') href = '/videos';
      else if (slugLower === 'photos' || slugLower === 'photo-gallery' || slugLower === 'gallery') href = '/photos';
      else if (slugLower === 'podcasts') href = '/videos?tab=podcast';
      else if (slugLower === 'shorts' || slugLower === 'reels') href = '/shorts';
      else if (slugLower === 'epaper') href = '/epaper';
      else if (slugLower === 'web-stories' || slugLower === 'webstory') href = '/web-stories';

      const staticTrans = CATEGORY_TRANSLATIONS[slugLower];
      const labelEn = c.nameEn || (staticTrans ? staticTrans.en : c.name);
      const labelGu = c.nameGu || (staticTrans ? staticTrans.gu : c.name);
      const labelHi = c.nameHi || (staticTrans ? staticTrans.hi : c.name);

      return { label: labelEn, labelGu, labelHi, href };
    };

    // GLOBAL type → Row 1 main nav bar (sorted by headerOrder desc)
    const row1Cats = dbCategories
      .filter((c) => c.showInHeader !== false && (!c.headerType || c.headerType === 'GLOBAL'))
      .sort((a: any, b: any) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0));

    // OTHER type → "અન્ย" dropdown (sorted by headerOrder desc)
    const otherCats = dbCategories
      .filter((c) => c.showInHeader !== false && c.headerType === 'OTHER')
      .sort((a: any, b: any) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0));

    const homeLink = { label: 'Home', labelGu: 'હોમ', labelHi: 'होम', href: '/' };

    const nonHomeRow1Links = row1Cats
      .map(mapCategory)
      .filter((l) => l.href !== '/');

    // Home + up to 14 GLOBAL categories in main nav bar (Max 15 total links in Row 1)
    const row1MainLinks = nonHomeRow1Links.slice(0, 14);
    const row1OverflowLinks = nonHomeRow1Links.slice(14);

    const mainNav = [homeLink, ...row1MainLinks];

    // OTHER-typed categories + any Row 1 overflow categories (beyond 15) go into "અન્ય" dropdown
    const dropdownLinks = [
      ...otherCats.map(mapCategory),
      ...row1OverflowLinks,
    ];

    return { navLinks: mainNav, otherLinks: dropdownLinks };
  }, [dbCategories]);

  // Determine active link: exact match for home, startsWith for others
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
  };

  const getNavLabel = (link: { label: string; labelGu?: string; labelHi?: string }) => {
    if (language === 'hi') return link.labelHi || link.label;
    if (language === 'gu') return link.labelGu || link.label;
    return link.label;
  };

  return (
    <>
      <header ref={headerRef} className="relative z-[60] border-b border-border bg-card/95">
        {/* Top bar: date + social */}
        <div className="bg-black dark:bg-black text-white/95 select-none">
          <div className="mx-auto flex max-w-screen-xl max-w-header-layout items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1.5">
            {/* Left: Date + City */}
            <div className="min-w-0 flex items-center gap-2 sm:gap-3 truncate text-xs sm:text-sm font-semibold opacity-90">
              <span className="hidden sm:inline">
                {mounted ? formatDateLong(language) : 'Sunday, 21 June 2026'}
              </span>
              <span className="sm:hidden text-[11px] font-bold">
                {mounted ? formatDateShort(language) : '21 Jun 2026'}
              </span>
              <span className="opacity-40">|</span>
              <button
                type="button"
                onClick={() => setCityModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white hover:text-red-200 transition duration-150 cursor-pointer bg-white/10 hover:bg-white/20 px-2 sm:px-2.5 py-0.5 rounded-full select-none font-sans shrink-0"
              >
                <span>📍</span>
                <span>{cityTranslations[selectedCity]?.[language] || selectedCity}</span>
              </button>
            </div>

            {/* Right: Desktop App buttons & Social links */}
            <div className="flex items-center gap-3.5 shrink-0 max-md:hidden">
              <div className="flex items-center gap-2">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[10.5px] font-black text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all hover:scale-[1.03] active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  <AppleIcon className="h-3.5 w-3.5 text-white" />
                  <span translate="no">App Store</span>
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[10.5px] font-black text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all hover:scale-[1.03] active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  <PlayStoreIcon className="h-3.5 w-3.5 text-white" />
                  <span translate="no">Google Play</span>
                </a>
              </div>
              <span className="opacity-20 select-none text-current">|</span>
              <SocialLinks size="sm" />
            </div>

            {/* Right: Mobile quick access badges (News Brief & AQI) */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              <Link
                href="/news-brief"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-xs"
              >
                <span>⚡</span>
                <span>Brief</span>
              </Link>
              <Link
                href="/aqi"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-black uppercase tracking-wider transition active:scale-95 border border-amber-500/30"
              >
                <span>🌤️</span>
                <span>AQI</span>
              </Link>
            </div>
          </div>
        </div>


        {/* Logo + Controls */}
        <div className="mx-auto flex max-w-screen-xl max-w-header-layout items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-4 py-2 sm:py-2.5 relative">
          {/* Slogan on top, Logo below */}
          <div className="flex flex-col items-start gap-0.5 select-none shrink-0">
            {/* Slogan */}
            <div className="flex flex-col justify-center leading-tight">
              <p className="text-[10px] sm:text-[12px] md:text-[13px] font-black text-foreground tracking-wide whitespace-nowrap" translate="no">
                Real Stories. <span className="text-red-600">Real Gujarat.</span>
              </p>
            </div>

            {/* Logo */}
            <a href="/" className="logo-3d group flex shrink-0 items-center">
              <span className="logo-3d-inner relative block h-10 sm:h-12 lg:h-16 w-32 sm:w-44 lg:w-56 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black/10 transition-all duration-300">
                <Image
                  src={gpLogo}
                  alt="Gujarat Post"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 640px) 128px, (max-width: 1024px) 176px, 224px"
                  className="object-cover"
                />
              </span>
            </a>
          </div>

          {/* Header Ad Slot (visible on desktop) */}
          <div className="hidden lg:flex flex-1 min-w-0 mx-4 2xl:mx-6" style={{ maxWidth: 728, height: 90 }}>
            <Advertisement position="header" className="w-full h-full" />
          </div>

          {/* Right-side compact News Brief + Weather/AQI + Search Container (desktop only) */}
          <div className="ml-auto mr-3 hidden md:flex items-center gap-4 lg:gap-5 select-none shrink-0">
            {/* NEWS BRIEF Button */}
            <Link
              href="/news-brief"
              className="group flex items-center gap-1 hover:opacity-90 transition-all select-none active:scale-[0.98]"
            >
              <Image
                src="/rightSide.png"
                alt="NEWS BRIEF"
                width={16}
                height={16}
                className="shrink-0 object-contain transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ width: 16, height: 16 }}
              />
              <span translate="no" className="font-black font-sans text-[15px] tracking-wider text-black dark:text-white uppercase leading-none select-none group-hover:text-[#B3121B] transition-colors duration-200">
                NEWS BRIEF
              </span>
            </Link>

            {/* AQI Button */}
            <Link
              href="/aqi"
              title={language === 'gu' ? 'હવામાન અને AQI' : language === 'hi' ? 'मौसम और AQI' : 'Weather & AQI'}
              className="group flex items-center gap-1 hover:opacity-90 transition-all select-none active:scale-[0.98] cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-amber-500 shrink-0 transition-transform duration-200 group-hover:scale-110"
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
              <span translate="no" className="font-black font-sans text-[15px] tracking-wider text-black dark:text-white uppercase leading-none select-none group-hover:text-[#B3121B] transition-colors duration-200">
                AQI
              </span>
            </Link>

            {/* Compact Search Trigger */}
            <div
              className="relative w-[140px] lg:w-[180px] flex items-center cursor-pointer group shrink-0"
              onClick={() => router.push('/search')}
            >
              <div className="h-[34px] w-full rounded-full border border-border bg-muted py-1.5 pl-10 pr-3.5 text-[13px] text-muted-foreground transition-all duration-200 group-hover:border-accent group-hover:bg-card select-none flex items-center">
                {language === 'gu' ? 'સમાચાર શોધો...' : language === 'hi' ? 'समाचार खोजें...' : 'Search news...'}
              </div>
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
                <Search className="h-[14px] w-[14px]" />
              </span>
            </div>
          </div>

          {/* Controls (Mobile + Desktop compact icons) */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="md:hidden flex h-8.5 w-8.5 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-secondary active:scale-95 shrink-0"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Language switcher */}
            <div className="relative z-50 transition-all duration-300 notranslate shrink-0">
              <button
                type="button"
                onClick={() => setLanguageOpen((value) => !value)}
                className={`inline-flex h-8.5 sm:h-10 items-center gap-1 sm:gap-1.5 rounded-full bg-muted px-2.5 sm:px-4 text-xs sm:text-sm font-black text-foreground transition-all duration-200 hover:bg-secondary cursor-pointer shadow-xs active:scale-95 ${languageOpen ? 'ring-2 ring-red-600/50 bg-secondary' : ''
                  }`}
                aria-label="Switch language"
                aria-expanded={languageOpen}
              >
                {/* Globe icon */}
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="truncate max-w-[65px] sm:max-w-none">
                  {languageChosen ? languageLabels[language] : 'Language'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${languageOpen ? 'rotate-180 text-red-600' : ''}`} />
              </button>

              {languageOpen && (
                <>
                  {/* Backdrop overlay to close dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-[9998] cursor-default"
                    onClick={() => setLanguageOpen(false)}
                  />

                  {/* Dropdown Menu Popup with Smooth Scale & Slide Entrance Animation */}
                  <div className="absolute right-0 top-full z-[9999] mt-2 w-36 rounded-xl border border-border/90 bg-card p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-md origin-top-right transition-all duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 notranslate">
                    {(['gu', 'en', 'hi'] as const).map((item) => {
                      const isSelected = languageChosen && language === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setLanguage(item);
                            setLanguageOpen(false);
                            setLanguageChosen(true);
                            try { sessionStorage.setItem('gp-lang-chosen', 'true'); } catch (e) { }
                          }}
                          className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-98 ${isSelected
                            ? 'bg-red-600 text-white font-extrabold shadow-sm'
                            : 'text-foreground hover:bg-muted'
                            }`}
                        >
                          <span>{languageLabels[item]}</span>
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8.5 w-8.5 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-secondary shrink-0 active:scale-95"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User / Login */}
            <button
              type="button"
              onClick={() => {
                const hasToken = typeof document !== 'undefined' && document.cookie.includes('access_token');
                if (hasToken) {
                  router.push('/admin');
                } else {
                  setAuthModalOpen(true);
                }
              }}
              className="inline-flex h-8.5 w-8.5 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-secondary shrink-0 active:scale-95"
              aria-label="Sign In"
              title="Sign In"
            >
              <User className="h-4 w-4" />
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-8.5 w-8.5 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-red-600 text-white md:hidden shrink-0 shadow-sm active:scale-95"
              aria-label="Open menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Mobile Full-Width Search Overlay Bar */}
          {searchOpen && (
            <div className="absolute inset-0 z-50 flex items-center bg-card px-3 md:hidden animate-in fade-in duration-200">
              <form onSubmit={submitSearch} className="relative w-full flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={language === 'gu' ? 'સમાચાર શોધો...' : language === 'hi' ? 'समाचार खोजें...' : 'Search news...'}
                    className="h-10 w-full rounded-full border border-border bg-muted py-2 pl-9 pr-8 text-sm text-foreground outline-none focus:border-accent focus:bg-card shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30 text-card hover:bg-muted-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-full bg-accent text-white text-xs font-black shrink-0 active:scale-95 shadow-sm"
                >
                  {language === 'gu' ? 'શોધો' : language === 'hi' ? 'खोजें' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* -- Full-Screen Mobile Menu Drawer Overlay (below header) ------------- */}
        {menuOpen && (
          <div className="fixed inset-x-0 bottom-0 z-[999999] flex flex-col bg-card text-foreground md:hidden overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 select-none" style={{ top: `${headerHeight}px` }}>
            {/* Menu Drawer Content Container */}
            <div className="px-4 py-4 space-y-4 pb-24">
              {/* Quick Action Badges Bar: News Brief, AQI, E-Paper, Support Us */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <Link
                  href="/news-brief"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-zinc-900 to-black p-2 text-xs font-black text-white shadow-sm border border-zinc-800 hover:scale-[1.02] active:scale-95 transition"
                >
                  <Image src="/rightSide.png" alt="News Brief" width={14} height={14} className="object-contain" />
                  <span>BRIEF</span>
                </Link>
                <Link
                  href="/aqi"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-xs font-black text-amber-600 dark:text-amber-400 shadow-sm hover:scale-[1.02] active:scale-95 transition"
                >
                  <span className="text-amber-500">🌤️</span>
                  <span>AQI</span>
                </Link>
                <a
                  href="/epaper"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-accent p-2 text-xs font-black text-white shadow-sm hover:bg-accent-hover active:scale-95 transition"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{language === 'gu' ? 'ઈ-પેપર' : language === 'hi' ? 'ઈ-પેપર' : 'E-Paper'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openSupportModal();
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 p-2 text-xs font-black text-white shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer"
                >
                  <Heart className="h-3.5 w-3.5 fill-current animate-pulse text-white" />
                  <span>{language === 'gu' ? 'સપોર્ટ' : language === 'hi' ? 'सपोर्ट' : 'Support'}</span>
                </button>
              </div>

              {/* App downloads CTA */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/50 border border-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">App:</span>
                <div className="flex gap-2">
                  <a
                    href="https://apps.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-black text-white hover:border-zinc-500 hover:bg-zinc-800 transition active:scale-95 shadow-sm"
                  >
                    <AppleIcon className="h-3.5 w-3.5 text-white" />
                    <span translate="no">App Store</span>
                  </a>
                  <a
                    href="https://play.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-black text-white transition active:scale-95 shadow-sm hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    <PlayStoreIcon className="h-3.5 w-3.5 text-white" />
                    <span translate="no">Google Play</span>
                  </a>
                </div>
              </div>

              {/* Flat Link Grid */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {[...navLinks, ...otherLinks].map((link) => {
                  const active = isActive(link.href);
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${active
                        ? 'border-accent/30 bg-accent/8 text-accent font-extrabold'
                        : 'border-border bg-muted/60 text-foreground hover:border-accent/25 hover:text-accent'
                        }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      )}
                      <span className="truncate">{getNavLabel(link)}</span>
                    </a>
                  );
                })}
              </div>

              {/* Social links at bottom of drawer */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Follow Us:</span>
                <SocialLinks size="sm" />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* -- Sticky Nav Section (Category Bar + District Bar) ------------------ */}
      <div className={`${hideStickyNav ? 'relative z-50' : 'sticky top-0 z-50'} bg-card/98 shadow-md transition-all duration-300`}>
        {/* Desktop Nav Bar */}
        <nav
          className="hidden border-t border-border bg-card/98 md:block"
          aria-label="Main navigation"
        >
          <div className="mx-auto max-w-screen-2xl px-2 xl:px-4 flex items-center gap-2 relative">
            {/* Main scrollable navigation list */}
            <div className="min-w-0 max-w-full overflow-hidden">
              <ul className="flex items-center gap-0 overflow-x-auto scrollbar-none">                {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={`${link.href}-${language}`} className="shrink-0">
                    <a
                      href={link.href}
                      className={`relative flex h-11 items-center whitespace-nowrap px-1.5 xl:px-2 2xl:px-2.5 text-[13px] xl:text-[14px] font-bold tracking-tight transition-colors duration-150 ${active
                        ? 'text-accent'
                        : 'text-foreground hover:text-accent'
                        }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {link.href === '/' ? (
                        <span className="flex items-center gap-1.5">
                          <Home className="h-4 w-4 shrink-0 text-accent" />
                          <span>{getNavLabel(link)}</span>
                        </span>
                      ) : (
                        getNavLabel(link)
                      )}
                      {/* Active indicator – thick red underline */}
                      {active && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-accent"
                          aria-hidden="true"
                        />
                      )}
                    </a>
                  </li>
                );
              })}

                {/* Other / અન્ય Dropdown Trigger */}
                {/* <li
                  ref={triggerRef}
                  className="relative shrink-0"
                  onMouseEnter={() => {
                    setOtherMenuOpen(true);
                    const rect = triggerRef.current?.getBoundingClientRect();
                    const navWrapper = triggerRef.current?.closest('.max-w-screen-2xl');
                    const navRect = navWrapper?.getBoundingClientRect();
                    if (rect && navRect) {
                      setDropdownLeft(rect.left - navRect.left);
                    }
                  }}
                  onMouseLeave={() => setOtherMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setOtherMenuOpen(!otherMenuOpen)}
                    className={`relative flex h-11 items-center gap-1 whitespace-nowrap px-2 xl:px-3 text-[14px] 2xl:text-[15px] font-bold tracking-tight transition-colors duration-150 cursor-pointer ${otherMenuOpen ? 'text-accent' : 'text-foreground hover:text-accent'
                      }`}
                  >
                    <span key={language}>{language === 'gu' ? 'અન્ય' : language === 'hi' ? 'अन्य' : 'More'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${otherMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </li> */}
              </ul>
            </div>

            {/* Other / અન્ય Dropdown Trigger — sits right after the last nav link (Podcast) */}
            <div
              ref={triggerRef}
              className="relative shrink-0"
              onMouseEnter={() => {
                setOtherMenuOpen(true);
                const rect = triggerRef.current?.getBoundingClientRect();
                const navWrapper = triggerRef.current?.closest('.max-w-screen-2xl');
                const navRect = navWrapper?.getBoundingClientRect();
                if (rect && navRect) {
                  setDropdownLeft(rect.left - navRect.left);
                }
              }}
              onMouseLeave={() => setOtherMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setOtherMenuOpen(!otherMenuOpen)}
                className={`relative flex h-11 items-center gap-1 whitespace-nowrap px-1.5 xl:px-2 2xl:px-2.5 text-[13px] xl:text-[14px] font-bold tracking-tight transition-colors duration-150 cursor-pointer ${otherMenuOpen ? 'text-accent' : 'text-foreground hover:text-accent'
                  }`}
              >
                <span key={language}>{language === 'gu' ? 'અન્ય' : language === 'hi' ? 'अन्य' : 'More'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${otherMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Non-scrollable controls pinned to the right (Support Us & E-Paper CTAs) */}
            <div className="ml-auto flex items-center gap-2.5 shrink-0 pl-3 border-l border-border/40 h-11 relative">
              {/* Support Us CTA */}
              <button
                type="button"
                onClick={openSupportModal}
                className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3 text-xs font-black text-white shadow-md shadow-red-900/20 ring-1 ring-red-600/40 transition-all duration-200 hover:shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" aria-hidden="true" />
                <Heart className="h-3.5 w-3.5 shrink-0 fill-current text-white animate-pulse" />
                <span className="tracking-wide">{language === 'gu' ? 'સપોર્ટ કરો' : language === 'hi' ? 'सपोर्ट करें' : 'Support Us'}</span>
              </button>

              {/* E-Paper CTA */}
              <a
                href="/epaper"
                className="group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-accent to-red-700 px-4 text-xs font-black text-white shadow-md shadow-red-900/30 ring-1 ring-red-700/40 transition-all duration-200 hover:shadow-lg hover:shadow-red-900/40 hover:scale-[1.03] active:scale-95"
              >
                {/* shimmer sweep on hover */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" aria-hidden="true" />
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="tracking-wide">{language === 'gu' ? 'ઈ-પેપર' : language === 'hi' ? 'ઈ-પેપર' : 'E-Paper'}</span>
                {/* live pulse dot */}
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </a>
            </div>

            {otherMenuOpen && (
              <div
                className="absolute z-50 min-w-44 rounded-lg border border-border bg-card p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                  top: '100%',
                  left: dropdownLeft !== null ? `${dropdownLeft}px` : undefined,
                }}
                onMouseEnter={() => setOtherMenuOpen(true)}
                onMouseLeave={() => setOtherMenuOpen(false)}
              >
                {otherLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <a
                      key={`${link.href}-${language}`}
                      href={link.href}
                      className={`block rounded-md px-3.5 py-2 text-left text-[14px] font-bold transition-colors duration-150 ${active
                        ? 'bg-accent/10 text-accent'
                        : 'text-foreground hover:bg-muted hover:text-accent'
                        }`}
                    >
                      {getNavLabel(link)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* District Bar */}
        <DistrictBar />
      </div>

      {/* City selection modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs transition-opacity duration-300">
          <div className="w-full max-w-sm scale-100 rounded-lg border border-border bg-card p-5 shadow-2xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-[15px] font-black text-foreground flex items-center gap-1.5 select-none">
                <span>📍</span>
                {language === 'gu' ? 'શહેર પસંદ કરો' : language === 'hi' ? 'शहर का चयन करें' : 'Select Your City'}
              </h3>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {['અમદાવાદ', 'સુરત', 'વડોદરા', 'રાજકોટ', 'ગાંધીનગર', 'અન્ય'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className={`rounded border py-2.5 text-xs font-black transition-all cursor-pointer text-center ${selectedCity === city
                    ? 'border-accent bg-accent/5 text-accent shadow-sm font-sans'
                    : 'border-border bg-card hover:bg-muted hover:border-foreground/20 text-foreground'
                    }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
      />
    </>
  );
}
