'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '@/components/AppProvider';

const DISTRICTS = [
  { gu: 'અમદાવાદ', hi: 'अहमदाबाद', en: 'Ahmedabad', slug: 'ahmedabad' },
  { gu: 'ગાંધીનગર', hi: 'गांधीनगर', en: 'Gandhinagar', slug: 'gandhinagar' },
  { gu: 'સુરત', hi: 'સૂરત', en: 'Surat', slug: 'surat' },
  { gu: 'વડોદરા', hi: 'वडोदरा', en: 'Vadodara', slug: 'vadodara' },
  { gu: 'રાજકોટ', hi: 'રાજકોટ', en: 'Rajkot', slug: 'rajkot' },
  { gu: 'અન્ય શહેરો', hi: 'अन्य शहर', en: 'Other Cities', slug: 'other-cities' }
];

export default function DistrictBar({
  navLinks = [],
  otherLinks = [],
}: {
  navLinks?: { label: string; labelGu?: string; labelHi?: string; href: string }[];
  otherLinks?: { label: string; labelGu?: string; labelHi?: string; href: string }[];
}) {
  const { language } = useApp();
  const pathname = usePathname();
  const [gujaratCategories, setGujaratCategories] = useState<any[]>([]);

  const [gujaratDropdownOpen, setGujaratDropdownOpen] = useState(false);
  const gujaratButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownLeft, setDropdownLeft] = useState(12);
  const [caretLeft, setCaretLeft] = useState(70);

  // Scroll arrow state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const checkScrollEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollWidth - el.scrollLeft - el.clientWidth < 4;
    setShowScrollArrow(!atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScrollEnd();
    el.addEventListener('scroll', checkScrollEnd, { passive: true });
    const ro = new ResizeObserver(checkScrollEnd);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScrollEnd);
      ro.disconnect();
    };
  }, [checkScrollEnd]);

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' });
  };

  // Close dropdown on route change
  useEffect(() => {
    setGujaratDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on window scroll
  useEffect(() => {
    if (!gujaratDropdownOpen) return;
    const handleScroll = () => setGujaratDropdownOpen(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [gujaratDropdownOpen]);

  // Close on click outside
  useEffect(() => {
    if (!gujaratDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        gujaratButtonRef.current &&
        gujaratButtonRef.current.contains(target)
      ) {
        return;
      }
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(target)
      ) {
        return;
      }
      setGujaratDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [gujaratDropdownOpen]);

  const toggleGujaratDropdown = () => {
    if (!gujaratDropdownOpen && gujaratButtonRef.current) {
      const rect = gujaratButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 280;
      const buttonCenter = rect.left + rect.width / 2;
      const idealLeft = buttonCenter - 70;
      const clamped = Math.max(10, Math.min(window.innerWidth - dropdownWidth - 10, idealLeft));
      setDropdownLeft(clamped);
      setCaretLeft(Math.max(16, Math.min(dropdownWidth - 24, buttonCenter - clamped)));
    }
    setGujaratDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchCats = () => {
      import('@/lib/api').then(({ getPublicCategories }) => {
        getPublicCategories({ showInHeader: true, headerType: 'GUJARAT' })
          .then((cats) => {
            if (cats && Array.isArray(cats) && cats.length > 0) {
              setGujaratCategories(cats.sort((a: any, b: any) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0)));
            }
          })
          .catch(() => {});
      });
    };

    fetchCats();
    window.addEventListener('focus', fetchCats);
    window.addEventListener('gp-categories-updated', fetchCats);
    return () => {
      window.removeEventListener('focus', fetchCats);
      window.removeEventListener('gp-categories-updated', fetchCats);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (!href.startsWith('/')) {
      return pathname === `/category/${href}` || pathname.startsWith(`/category/${href}/`);
    }
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
  };

  const isVideosActive = pathname === '/videos' || pathname.startsWith('/videos/') || pathname.startsWith('/videos?');

  const isGujaratActive = useMemo(() => {
    if (pathname === '/category/gujarat' || pathname.startsWith('/category/gujarat/')) return true;
    return DISTRICTS.some((d) => pathname === `/category/${d.slug}` || pathname.startsWith(`/category/${d.slug}/`));
  }, [pathname]);

  const displayList = useMemo(() => {
    const rawList = gujaratCategories && gujaratCategories.length > 0
      ? gujaratCategories.map((cat: any) => {
        const slug = (cat.slug || '').toLowerCase();
        const distMatch = DISTRICTS.find((d) => d.slug === slug);
        let label = cat.name;
        if (distMatch) {
          label = language === 'hi' ? distMatch.hi : language === 'gu' ? distMatch.gu : distMatch.en;
        } else {
          label = language === 'hi' ? (cat.nameHi || cat.name) : language === 'gu' ? (cat.nameGu || cat.name) : (cat.nameGu || cat.name);
        }
        return { slug: cat.slug, label };
      })
      : DISTRICTS.map((dist) => ({
        slug: dist.slug,
        label: language === 'hi' ? dist.hi : language === 'gu' ? dist.gu : dist.en,
      }));

    return [...rawList].sort((a, b) => {
      if (a.slug === 'ahmedabad') return -1;
      if (b.slug === 'ahmedabad') return 1;
      return 0;
    });
  }, [gujaratCategories, language]);

  const getNavLabel = (link: { label: string; labelGu?: string; labelHi?: string; href: string }) => {
    if (language === 'hi') return link.labelHi || link.label;
    if (language === 'gu') return link.labelGu || link.label;
    return link.label;
  };

  // Video Link
  const videoLink = useMemo(() => {
    return navLinks.find((l) => l.href === '/videos') || {
      label: 'Videos',
      labelGu: 'વીડિયો',
      labelHi: 'वीडियो',
      href: '/videos',
    };
  }, [navLinks]);

  // Mobile Other Categories: all links except Home (/), Videos (/videos), and Gujarat (/category/gujarat)
  const mobileOtherCategories = useMemo(() => {
    const combined = [...navLinks, ...otherLinks];
    const seen = new Set<string>();
    const list: { label: string; labelGu?: string; labelHi?: string; href: string }[] = [];
    for (const item of combined) {
      if (item.href === '/' || item.href === '/videos' || item.href === '/category/gujarat') continue;
      if (!seen.has(item.href)) {
        seen.add(item.href);
        list.push(item);
      }
    }
    return list;
  }, [navLinks, otherLinks]);

  return (
    <div className="w-full border-t border-border/40 bg-card/95 backdrop-blur-md select-none relative z-40">
      <div className="mx-auto flex max-w-[1700px] items-center gap-2 px-1.5 sm:px-2 xl:px-3">
        {/* Gujarat Map Logo and vertical separator (At start for both mobile & desktop) */}
        <Link
          href="/category/gujarat"
          className="flex items-center justify-center shrink-0 ml-1 sm:ml-2.5 pr-1.5 sm:pr-2 border-r border-border/60 h-8 md:h-9 self-center overflow-hidden"
          title={language === 'gu' ? 'ગુજરાત' : language === 'hi' ? 'ગુજરાત' : 'Gujarat'}
        >
          <img
            src="/assets/GujaratLogo.png"
            alt="Gujarat Logo"
            width={28}
            height={24}
            style={{ height: '24px', maxHeight: '24px', width: 'auto', maxWidth: '36px', objectFit: 'contain' }}
            className="district-gujarat-logo h-6 md:h-7.5 max-h-6 md:max-h-7.5 w-auto object-contain transition-transform duration-200 hover:scale-105 cursor-pointer select-none shrink-0"
          />
        </Link>

        {/* Scrollable list + right arrow wrapper */}
        <div className="relative flex-1 min-w-0">
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-none overscroll-x-contain touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* ─── DESKTOP VIEW (>= md): Full horizontal city list ─── */}
            <div className="hidden md:flex items-center gap-4 sm:gap-4.5 md:gap-5 py-0 pl-1 pr-3 md:pr-4">
              {displayList.map((item) => {
                const active = isActive(item.slug);
                return (
                  <Link
                    key={`desk-${item.slug}-${language}`}
                    href={`/category/${item.slug}`}
                    className={`relative flex shrink-0 h-10 md:h-11 items-center whitespace-nowrap text-[15.5px] sm:text-[16px] md:text-[16px] font-extrabold tracking-tight transition-colors duration-150 ${active ? 'text-accent font-black' : 'text-foreground hover:text-accent'}`}
                    style={{ fontWeight: 800 }}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-accent" aria-hidden="true" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ─── MOBILE VIEW (< md): 1st Video, 2nd Gujarat (with Dropdown of all cities), then other categories ─── */}
            <div className="flex md:hidden items-center gap-4 py-0 pl-1 pr-3">
              {/* 1. Video Link */}
              <Link
                href="/videos"
                className={`relative flex shrink-0 h-10 items-center whitespace-nowrap text-[15.5px] font-extrabold tracking-tight transition-colors duration-150 ${
                  isVideosActive ? 'text-accent font-black' : 'text-foreground hover:text-accent'
                }`}
                style={{ fontWeight: 800 }}
                aria-current={isVideosActive ? 'page' : undefined}
              >
                <span>{getNavLabel(videoLink)}</span>
                {isVideosActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-accent" aria-hidden="true" />
                )}
              </Link>

              {/* 2. Gujarat Dropdown Trigger */}
              <button
                ref={gujaratButtonRef}
                type="button"
                onClick={toggleGujaratDropdown}
                className={`relative flex shrink-0 h-10 items-center gap-1 whitespace-nowrap text-[15.5px] font-extrabold tracking-tight transition-colors duration-150 cursor-pointer ${
                  isGujaratActive || gujaratDropdownOpen ? 'text-accent font-black' : 'text-foreground hover:text-accent'
                }`}
                style={{ fontWeight: 800 }}
                aria-expanded={gujaratDropdownOpen}
              >
                <span>{language === 'gu' ? 'ગુજરાત' : language === 'hi' ? 'ગુજરાત' : 'Gujarat'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${gujaratDropdownOpen ? 'rotate-180 text-accent' : 'text-muted-foreground'}`} />
                {isGujaratActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-accent" aria-hidden="true" />
                )}
              </button>

              {/* 3. All remaining categories (India, World, Politics, Crime, Health, etc.) */}
              {mobileOtherCategories.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={`mob-${link.href}-${language}`}
                    href={link.href}
                    className={`relative flex shrink-0 h-10 items-center whitespace-nowrap text-[15.5px] font-extrabold tracking-tight transition-colors duration-150 ${
                      active ? 'text-accent font-black' : 'text-foreground hover:text-accent'
                    }`}
                    style={{ fontWeight: 800 }}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span>{getNavLabel(link)}</span>
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-accent" aria-hidden="true" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ─── Right Scroll Arrow (mobile only, hides at end) ─── */}
          {showScrollArrow && (
            <button
              type="button"
              onClick={handleScrollRight}
              aria-label="Scroll right"
              className="md:hidden absolute right-0 top-0 bottom-0 flex items-center justify-end pr-1 z-10 cursor-pointer w-12"
              style={{
                background: 'linear-gradient(to right, transparent, var(--color-card, #fff) 40%)',
              }}
            >
              <ChevronRight className="w-5 h-5 text-foreground/70" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ─── MOBILE GUJARAT CITIES DROPDOWN POPUP (Directly below DistrictBar) ─── */}
      {gujaratDropdownOpen && (
        <>
          {/* Invisible Backdrop - allows tapping outside to close without dimming or dulling navbar */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setGujaratDropdownOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Card - Anchored directly to bottom edge of DistrictBar */}
          <div
            ref={dropdownRef}
            className="md:hidden absolute top-full z-50 mt-1.5 w-[280px] rounded-2xl border border-border/80 bg-card/98 dark:bg-zinc-900/98 backdrop-blur-2xl p-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ left: `${dropdownLeft}px` }}
          >
            {/* Pointer Caret pointing to Gujarat button */}
            <div
              className="absolute -top-1.5 w-3 h-3 rotate-45 bg-card dark:bg-zinc-900 border-t border-l border-border/80"
              style={{ left: `${caretLeft}px` }}
            />

            {/* 1. All Gujarat Primary Action Card */}
            <Link
              href="/category/gujarat"
              onClick={() => setGujaratDropdownOpen(false)}
              className={`group flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 ${
                pathname === '/category/gujarat'
                  ? 'bg-[#B3121B] text-white shadow-sm'
                  : 'bg-gradient-to-r from-[#B3121B] to-[#9a0f17] text-white shadow-sm hover:opacity-95 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shrink-0 shadow-xs">
                  <img
                    src="/assets/GujaratLogo.png"
                    alt="Gujarat"
                    width={20}
                    height={18}
                    style={{ height: '18px', width: '20px', maxHeight: '18px', maxWidth: '20px', objectFit: 'contain' }}
                    className="shrink-0 object-contain"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13.5px] font-black leading-tight text-white">
                    {language === 'gu' ? 'સમગ્ર ગુજરાત' : language === 'hi' ? 'पूरा गुजरात' : 'All Gujarat'}
                  </span>
                  <span className="text-[10.5px] font-semibold text-white/80 leading-none mt-0.5">
                    {language === 'gu' ? 'બધા સમાચાર જુઓ' : language === 'hi' ? 'सभी खबरें देखें' : 'View All News'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/90 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>

            {/* Section Header */}
            <div className="flex items-center gap-2 my-2 px-1">
              <span className="text-[10.5px] font-black tracking-wider text-muted-foreground uppercase select-none">
                {language === 'gu' ? 'શહેરો / જિલ્લા' : language === 'hi' ? 'शहर / जिले' : 'Cities / Districts'}
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* 2. 2-Column Grid of Cities (Ahmedabad to Other Cities) */}
            <div className="grid grid-cols-2 gap-1.5">
              {displayList.map((city) => {
                const active = pathname === `/category/${city.slug}`;
                return (
                  <Link
                    key={city.slug}
                    href={`/category/${city.slug}`}
                    onClick={() => setGujaratDropdownOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-bold transition-all border active:scale-95 ${
                      active
                        ? 'bg-[#B3121B]/10 text-[#B3121B] border-[#B3121B]/40 font-black shadow-2xs'
                        : 'bg-muted/40 hover:bg-muted text-foreground border-border/50 hover:border-accent/40 hover:text-accent'
                    }`}
                  >
                    <span>{city.label}</span>
                    {active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B3121B] shrink-0 ml-1" />
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 shrink-0 ml-1">›</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
