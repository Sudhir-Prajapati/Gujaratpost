'use client';

/* eslint-disable @next/next/no-html-link-for-pages */
import { createElement, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  Clapperboard,
  House,
  Menu,
  Moon,
  Newspaper,
  RadioTower,
  Search,
  Sun,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { NAV_ITEMS } from '@/data';
import { useApp } from '@/components/AppProvider';
import { SocialLinks } from '@/components/ui/SocialLinks';
import Advertisement from '@/components/ads/Advertisement';
import gpLogo from '../../public/Gujarat Post Logo.gif';

const languageLabels = {
  gu: 'ગુજરાતી',
  en: 'English',
  hi: 'हिन्दी',
};

const navGroups = [
  {
    icon: House,
    label: 'Home',
    labelGu: 'હોમ',
    description: 'Top stories and latest updates',
    href: '/',
    items: ['Home', 'Gujarat', 'Videos', 'Shorts'],
  },
  {
    icon: Building2,
    label: 'Cities',
    labelGu: 'શહેરો',
    description: 'Local news from Gujarat cities',
    href: '/category/gujarat',
    items: ['Gujarat', 'Ahmedabad', 'Rajkot', 'Surat', 'Vadodara'],
  },
  {
    icon: Newspaper,
    label: 'News',
    labelGu: 'સમાચાર',
    description: 'Politics, crime and world news',
    href: '/category/politics',
    items: ['Crime', 'Politics', 'World', 'Gujarat Election 2027'],
  },
  {
    icon: TrendingUp,
    label: 'Markets',
    labelGu: 'બજાર',
    description: 'Business, tech and education',
    href: '/category/business',
    items: ['Business', 'Technology', 'Education'],
  },
  {
    icon: Clapperboard,
    label: 'Culture',
    labelGu: 'કલ્ચર',
    description: 'Sports, lifestyle and entertainment',
    href: '/category/entertainment',
    items: ['Sports', 'Entertainment', 'Lifestyle'],
  },
  {
    icon: Clapperboard,
    label: 'Media',
    labelGu: 'મીડિયા',
    description: 'Endless video, shorts, podcasts and editions',
    href: '/videos',
    items: ['Videos', 'Watch Never Ends', 'Shorts', 'Podcasts', 'E-paper'],
  },
  {
    icon: RadioTower,
    label: 'Live',
    labelGu: 'લાઇવ',
    description: 'Weather, market and score updates',
    href: '/#live-dashboard',
    items: ['Weather', 'Markets', 'Cricket Scorecard', 'Football Scorecard'],
  },
];

const findNavItem = (label: string) => NAV_ITEMS.find((item) => item.label === label);
const liveItems = {
  Weather: { label: 'Weather', labelGu: 'હવામાન', labelHi: 'मौसम', href: '/#live-dashboard' },
  Markets: { label: 'Markets', labelGu: 'બજાર', labelHi: 'बाजार', href: '/#live-dashboard' },
  'Cricket Scorecard': { label: 'Cricket Scorecard', labelGu: 'ક્રિકેટ સ્કોર', labelHi: 'क्रिकेट स्कोर', href: '/#live-dashboard' },
  'Football Scorecard': { label: 'Football Scorecard', labelGu: 'ફૂટબોલ સ્કોર', labelHi: 'फुटबॉल स्कोर', href: '/#live-dashboard' },
};
const findMenuItem = (label: string) => findNavItem(label) || liveItems[label as keyof typeof liveItems];

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

export default function Header() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  const router = useRouter();
  const { theme, toggleTheme, language, setLanguage } = useApp();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-4 py-1.5">
          <div className="min-w-0 truncate text-sm font-semibold opacity-85">
            <span className="hidden sm:inline">
              {mounted ? formatDateLong(language) : 'Sunday, 21 June 2026'}
            </span>
            <span className="sm:hidden">
              {mounted ? formatDateShort(language) : '21 Jun 2026'}
            </span>
            <span className="mx-2 opacity-40">|</span>
            <span>ગુજરાતનું વિશ્વસનીય ન્યૂઝ નેટવર્ક</span>
          </div>
          <SocialLinks size="sm" className="shrink-0 max-sm:hidden" />
        </div>
      </div>

      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-5 px-4 py-2.5">
        <a href="/" className="logo-3d group flex shrink-0 items-center">
          <span className={`logo-3d-inner relative block h-14 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black/10 transition-all duration-300 sm:h-14 lg:h-16 ${
            searchOpen ? 'w-24 sm:w-36 lg:w-44' : 'w-40 sm:w-48 lg:w-56'
          }`}>
            <Image
              src={gpLogo}
              alt="Gujarat Post"
              fill
              priority
              unoptimized
              sizes="(max-width: 640px) 160px, (max-width: 1024px) 192px, 224px"
              className="object-cover"
            />
          </span>
        </a>

        <Advertisement position="header" className="hidden min-w-0 flex-1 lg:block [&>div]:!min-h-16" />

        <div className="flex shrink-0 items-center gap-2">
          <div className={`relative flex items-center transition-all duration-300 ease-in-out ${searchOpen ? 'w-44 sm:w-72 md:w-80 lg:w-[28rem]' : 'w-10'}`}>
            <form onSubmit={submitSearch} className="relative w-full flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="સમાચાર શોધો..."
                className={`h-10 w-full rounded-full border border-border bg-muted py-2 pl-10 pr-10 text-sm text-foreground outline-none transition-all duration-300 ease-in-out focus:border-accent focus:bg-card ${
                  searchOpen ? 'opacity-100 pointer-events-auto' : 'w-10 opacity-0 pointer-events-none'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (searchOpen) {
                    if (searchQuery.trim()) {
                      const query = searchQuery.trim();
                      setSearchOpen(false);
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                    } else {
                      setSearchOpen(false);
                    }
                  } else {
                    setSearchOpen(true);
                  }
                }}
                className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-secondary ${
                  searchOpen ? 'text-muted-foreground hover:bg-transparent' : 'bg-muted'
                }`}
                aria-label={searchOpen ? "Submit Search" : "Search"}
              >
                <Search className="h-4 w-4" />
              </button>
              {searchOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Close search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>

          <div className={`relative transition-all duration-300 ${searchOpen ? 'max-sm:hidden' : ''}`}>
            <button
              type="button"
              onClick={() => setLanguageOpen((value) => !value)}
              className="inline-flex h-10 items-center gap-1 rounded-full bg-muted px-4 text-sm font-black text-foreground transition hover:bg-secondary"
              aria-label="Switch language"
              aria-expanded={languageOpen}
            >
              {languageLabels[language]}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-32 rounded-md border border-border bg-card p-1 shadow-lg">
                {(['gu', 'en', 'hi'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setLanguage(item);
                      setLanguageOpen(false);
                    }}
                    className="block w-full rounded px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    {languageLabels[item]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-secondary ${
              searchOpen ? 'max-sm:hidden' : ''
            }`}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Auth-Aware User Icon / Login Button */}
          <a
            href={isAuthenticated ? "/admin" : "/login"}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-secondary ${
              searchOpen ? 'max-sm:hidden' : ''
            }`}
            aria-label={isAuthenticated ? "Go to Admin Dashboard" : "Go to Login Page"}
            title={isAuthenticated ? "Admin Dashboard" : "Sign In"}
          >
            <User className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground md:hidden"
            aria-label="Open menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>



      <nav className="hidden border-t border-border bg-card/95 py-1.5 shadow-[0_6px_18px_rgb(15_23_42/0.04)] md:block">
        <div className="mx-auto max-w-screen-xl px-4">
          <ul className="mx-auto flex w-fit min-w-0 items-center justify-center gap-1 rounded-2xl border border-border/70 bg-muted/55 p-1.5">
            {navGroups.map((group) => (
              <li
                key={group.label}
                className="group relative"
                onMouseEnter={() => setActiveDropdown(group.label)}
                onMouseLeave={() => setActiveDropdown(null)}
                onFocus={() => setActiveDropdown(group.label)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropdown(null);
                }}
              >
                <a
                  href={group.href}
                  aria-expanded={activeDropdown === group.label}
                  className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-black transition duration-200 lg:px-4 ${activeDropdown === group.label ? 'bg-card text-accent shadow-sm ring-1 ring-border' : 'text-foreground hover:bg-card hover:text-accent'}`}
                >
                  {createElement(group.icon, { className: `h-4 w-4 shrink-0 ${activeDropdown === group.label ? 'text-accent' : 'text-muted-foreground'}` })}
                  <span className="whitespace-nowrap">{group.label}</span>
                  <span className="hidden whitespace-nowrap text-[11px] font-bold text-muted-foreground xl:inline">{group.labelGu}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition duration-200 ${activeDropdown === group.label ? 'rotate-180 text-accent' : ''}`} />
                </a>
                <div
                  className={`absolute left-1/2 top-full z-50 w-[25rem] -translate-x-1/2 pt-3 transition duration-200 ${
                    activeDropdown === group.label
                      ? 'visible translate-y-0 opacity-100'
                      : 'invisible translate-y-2 opacity-0'
                  }`}
                >
                  <span className="absolute left-1/2 top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-border bg-card" />
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_70px_rgb(15_23_42/0.24)] ring-1 ring-black/5">
                    <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary to-slate-800 px-5 py-4 text-white">
                      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full border-[18px] border-white/[0.04]" />
                      <div className="relative flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent shadow-lg shadow-red-950/30">
                          {createElement(group.icon, { className: 'h-5 w-5' })}
                        </span>
                        <div>
                          <p className="text-base font-black">{group.label} <span className="ml-1 text-sm text-white/55">{group.labelGu}</span></p>
                          <p className="mt-0.5 text-xs font-semibold text-white/55">{group.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {group.items.map((label, index) => {
                        const item = findMenuItem(label);
                        if (!item) return null;
                        const localLabel = language === 'hi' ? item.labelHi : item.labelGu;
                        return (
                          <a
                            key={`${group.label}-${item.label}-${item.href}`}
                            href={item.href}
                            onClick={() => setActiveDropdown(null)}
                            className="group/item flex min-w-0 items-center gap-3 rounded-xl border border-transparent bg-muted/45 px-3 py-3 text-sm font-bold text-foreground transition hover:border-accent/20 hover:bg-accent/[0.06]"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-[10px] font-black text-muted-foreground shadow-sm ring-1 ring-border transition group-hover/item:bg-accent group-hover/item:text-white group-hover/item:ring-accent">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-black">{item.label}</span>
                              <span className="mt-0.5 block truncate text-[10px] font-semibold text-muted-foreground">{localLabel}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover/item:translate-x-0.5 group-hover/item:text-accent" />
                          </a>
                        );
                      })}
                    </div>
                    <a href={group.href} onClick={() => setActiveDropdown(null)} className="group/all flex items-center justify-between border-t border-border bg-muted/35 px-5 py-3 text-xs font-black text-foreground transition hover:text-accent">
                      <span>Explore all {group.label}</span>
                      <ArrowRight className="h-4 w-4 transition group-hover/all:translate-x-1" />
                    </a>
                  </div>
                </div>
              </li>
            ))}
            <li className="flex items-center">
              <a
                href="/epaper"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-black text-white shadow-md hover:bg-accent-hover transition duration-200 ml-1.5"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>E-Paper</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {menuOpen && (
        <nav className="border-t border-border bg-card p-4 md:hidden">
          <div className="space-y-3">
            <a
              href="/epaper"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-black text-white shadow hover:bg-accent-hover transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>E-Paper</span>
            </a>
            {navGroups.map((group) => (
              <section key={group.label} className="rounded-2xl border border-border bg-muted p-3">
                <a href={group.href} onClick={() => setMenuOpen(false)} className="mb-2 block text-sm font-black text-accent">
                  {group.label} / {group.labelGu}
                </a>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((label) => {
                    const item = findMenuItem(label);
                    if (!item) return null;
                    return (
                      <a
                        key={`${group.label}-mobile-${item.label}-${item.href}`}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-xl bg-card px-3 py-2 text-sm font-bold text-foreground shadow-sm"
                      >
                        <span className="block">{item.label}</span>
                        <span className="text-xs font-medium text-muted-foreground">{language === 'hi' ? item.labelHi : item.labelGu}</span>
                      </a>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
