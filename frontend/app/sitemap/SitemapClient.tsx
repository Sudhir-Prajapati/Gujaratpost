'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Newspaper,
  Film,
  Video,
  ShieldCheck,
  Search,
  Sparkles,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Tv,
  ArrowUp,
  Scale,
  PhoneCall,
  Info,
  Radio,
  FileText,
  Image as ImageIcon,
  Compass,
  Flame,
  CloudRain,
  SunMedium,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { getPublicCategories } from '@/lib/api';

/* ── 1. Static Verified Website Categories List ── */
export const CORE_WEBSITE_SECTIONS = [
  {
    id: 'cities',
    icon: MapPin,
    titleGu: 'શહેરો અને પ્રદેશ (Gujarat Cities)',
    titleEn: 'Cities & Hyperlocal',
    badge: 'Hyperlocal',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    items: [
      { nameGu: 'અમદાવાદ', nameEn: 'Ahmedabad', slug: 'ahmedabad', href: '/category/ahmedabad' },
      { nameGu: 'સુરત', nameEn: 'Surat', slug: 'surat', href: '/category/surat' },
      { nameGu: 'રાજકોટ', nameEn: 'Rajkot', slug: 'rajkot', href: '/category/rajkot' },
      { nameGu: 'વડોદરા', nameEn: 'Vadodara', slug: 'vadodara', href: '/category/vadodara' },
      { nameGu: 'ગાંધીનગર', nameEn: 'Gandhinagar', slug: 'gandhinagar', href: '/category/gandhinagar' },
      { nameGu: 'અન્ય શહેરો', nameEn: 'Other Cities', slug: 'other-cities', href: '/category/other-cities' },
      { nameGu: 'ગુજરાત (સમગ્ર)', nameEn: 'Gujarat State', slug: 'gujarat', href: '/category/gujarat' },
    ],
  },
  {
    id: 'news-politics',
    icon: Newspaper,
    titleGu: 'મુખ્ય સમાચાર & રાજનીતિ (Main News & Politics)',
    titleEn: 'News & Politics',
    badge: 'Top Desk',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60',
    items: [
      { nameGu: 'ભારત (રાષ્ટ્રીય)', nameEn: 'National / India', slug: 'national', href: '/category/national' },
      { nameGu: 'વિશ્વ (આંતરરાષ્ટ્રીય)', nameEn: 'World News', slug: 'world', href: '/category/world' },
      { nameGu: 'રાજનીતિ & રાજકારણ', nameEn: 'Politics', slug: 'politics', href: '/category/politics' },
      { nameGu: 'ક્રાઇમ & ગુનાખોરી', nameEn: 'Crime & Law', slug: 'crime', href: '/category/crime' },
      { nameGu: 'ગુજરાત ચૂંટણી 2027', nameEn: 'Election 2027', slug: 'election-2027', href: '/category/election-2027' },
      { nameGu: 'મુખ્ય / તાજા સમાચાર', nameEn: 'Breaking News', slug: 'breaking-news', href: '/category/breaking-news' },
      { nameGu: 'ન્યૂઝ બ્રીફ (ટુંકા સમાચાર)', nameEn: 'News Brief', slug: 'news-brief', href: '/news-brief' },
      { nameGu: 'અભિપ્રાય & તંત્રીલેખ', nameEn: 'Editorial', slug: 'editorial', href: '/category/editorial' },
    ],
  },
  {
    id: 'business-markets',
    icon: Briefcase,
    titleGu: 'બિઝનેસ & બજારો (Business & Finance)',
    titleEn: 'Business & Finance',
    badge: 'Markets',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    items: [
      { nameGu: 'બિઝનેસ & વેપાર', nameEn: 'Business', slug: 'business', href: '/category/business' },
      { nameGu: 'સોનું - ચાંદી (ગોલ્ડ - સિલ્વર)', nameEn: 'Gold - Silver Rates', slug: 'gold-silver', href: '/category/gold-silver' },
      { nameGu: 'નોકરી & કારકિર્દી', nameEn: 'Jobs & Careers', slug: 'jobs', href: '/category/jobs' },
    ],
  },
  {
    id: 'life-entertainment',
    icon: Film,
    titleGu: 'લાઇફસ્ટાઇલ, ટેકનોલોજી & મનોરંજન (Life & Entertainment)',
    titleEn: 'Life, Tech & Entertainment',
    badge: 'Lifestyle',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
    items: [
      { nameGu: 'મનોરંજન & સિનેમા', nameEn: 'Entertainment', slug: 'entertainment', href: '/category/entertainment' },
      { nameGu: 'ટેકનોલોજી & ગેજેટ્સ', nameEn: 'Technology', slug: 'technology', href: '/category/technology' },
      { nameGu: 'આરોગ્ય & હેલ્થ', nameEn: 'Health & Wellness', slug: 'health', href: '/category/health' },
      { nameGu: 'સ્પોર્ટ્સ & ક્રિકેટ', nameEn: 'Sports', slug: 'sports', href: '/category/sports' },
      { nameGu: 'જીવનશૈલી (લાઇફસ્ટાઇલ)', nameEn: 'Lifestyle', slug: 'lifestyle', href: '/category/lifestyle' },
      { nameGu: 'શિક્ષણ & કરિયર', nameEn: 'Education', slug: 'education', href: '/category/education' },
      { nameGu: 'ફેક્ટ ચેક (સત્યશોધન)', nameEn: 'Fact Check', slug: 'fact-check', href: '/category/fact-check' },
      { nameGu: 'ટ્રેન્ડિંગ વાર્તાઓ', nameEn: 'Trending', slug: 'trending', href: '/category/trending' },
      { nameGu: 'વરસાદ & ચોમાસું', nameEn: 'Rainfall / Monsoon', slug: 'varsad', href: '/category/varsad' },
      { nameGu: 'હવામાન અપડેટ્સ', nameEn: 'Weather', slug: 'weather', href: '/category/weather' },
      { nameGu: 'એર ક્વોલિટી (AQI)', nameEn: 'Air Quality Index', slug: 'aqi', href: '/aqi' },
    ],
  },
  {
    id: 'digital-media',
    icon: Video,
    titleGu: 'ડિજિટલ મીડિયા & શો (Digital Shows & Verticals)',
    titleEn: 'Digital Media',
    badge: 'Multimedia',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    items: [
      { nameGu: 'વીડિયો ડેસ્ક', nameEn: 'Videos', slug: 'videos', href: '/videos' },
      { nameGu: 'શોર્ટ્સ & રીલ્સ', nameEn: 'Shorts & Reels', slug: 'shorts', href: '/shorts' },
      { nameGu: 'પોડકાસ્ટ સીરિઝ', nameEn: 'Podcasts', slug: 'podcasts', href: '/videos?tab=podcast' },
      { nameGu: 'ફોટો ગેલેરી', nameEn: 'Photo Gallery', slug: 'photos', href: '/photos' },
      { nameGu: 'ઈ-પેપર એડિશન', nameEn: 'E-Paper', slug: 'epaper', href: '/epaper' },
      { nameGu: 'વેબસ્ટોરી', nameEn: 'Web Stories', slug: 'webstory', href: '/category/webstory' },
      { nameGu: 'ઇન્સ્ટાગ્રામ હબ', nameEn: 'Instagram Desk', slug: 'instagram', href: '/category/instagram' },
    ],
  },
  {
    id: 'company-legal',
    icon: Scale,
    titleGu: 'કંપની & કાનૂની પાનાં (Company & Legal Info)',
    titleEn: 'Company & Legal',
    badge: 'Legal',
    color: 'text-neutral-700 dark:text-neutral-300',
    bg: 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60',
    items: [
      { nameGu: 'અમારા વિશે', nameEn: 'About Us', slug: 'about', href: '/about' },
      { nameGu: 'સંપર્ક કરો', nameEn: 'Contact Us', slug: 'contact', href: '/contact' },
      { nameGu: 'જાહેરાત આપો', nameEn: 'Advertise With Us', slug: 'advertise', href: '/advertise' },
      { nameGu: 'ગોપનીયતા નીતિ', nameEn: 'Privacy Policy', slug: 'privacy-policy', href: '/privacy-policy' },
      { nameGu: 'નિયમો અને શરતો', nameEn: 'Terms of Use', slug: 'terms', href: '/terms' },
      { nameGu: 'અસ્વીકરણ', nameEn: 'Disclaimer', slug: 'disclaimer', href: '/disclaimer' },
      { nameGu: 'વાચક પ્રતિસાદ', nameEn: 'Feedback', slug: 'feedback', href: '/feedback' },
      { nameGu: 'RSS સેવા શરતો', nameEn: 'RSS Terms of Service', slug: 'rss-terms-of-service', href: '/rss-terms-of-service' },
    ],
  },
];

interface SitemapClientProps {
  initialCategories?: any[];
}

export default function SitemapClient({ initialCategories = [] }: SitemapClientProps) {
  const [dbCategories, setDbCategories] = useState<any[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories client-side if not preloaded
  useEffect(() => {
    if (!dbCategories || dbCategories.length === 0) {
      getPublicCategories()
        .then((cats) => {
          if (Array.isArray(cats) && cats.length > 0) {
            setDbCategories(cats);
          }
        })
        .catch(() => {});
    }
  }, [dbCategories]);

  // Collect all known slugs from the static list
  const knownSlugs = useMemo(() => {
    const slugs = new Set<string>();
    CORE_WEBSITE_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        slugs.add(item.slug.toLowerCase());
      });
    });
    return slugs;
  }, []);

  // Detect any dynamic categories created in Admin DB that are not yet in known list
  const additionalAdminCategories = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) return [];
    
    // Test/junk slugs to ignore
    const ignoredSlugs = new Set(['testcategorues', 'poll', 'polls']);

    return dbCategories.filter((cat) => {
      if (!cat.isActive) return false;
      const s = (cat.slug || '').toLowerCase().trim();
      if (!s || ignoredSlugs.has(s) || knownSlugs.has(s)) return false;
      return true;
    });
  }, [dbCategories, knownSlugs]);

  // Build the complete sections list
  const allSections = useMemo(() => {
    const list = [...CORE_WEBSITE_SECTIONS];

    if (additionalAdminCategories.length > 0) {
      list.splice(4, 0, {
        id: 'additional-categories',
        icon: FolderOpen,
        titleGu: 'અન્ય કેટેગરીઝ (Additional Categories)',
        titleEn: 'More Categories',
        badge: 'Admin Added',
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
        items: additionalAdminCategories.map((c) => ({
          nameGu: c.nameGu || c.name || c.slug,
          nameEn: c.name || c.slug,
          slug: c.slug,
          href: `/category/${c.slug}`,
        })),
      });
    }

    return list;
  }, [additionalAdminCategories]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allSections;

    return allSections
      .map((sec) => {
        const matchesSection =
          sec.titleGu.toLowerCase().includes(q) ||
          sec.titleEn.toLowerCase().includes(q);

        const matchedItems = sec.items.filter(
          (item) =>
            item.nameGu.toLowerCase().includes(q) ||
            item.nameEn.toLowerCase().includes(q) ||
            item.slug.toLowerCase().includes(q)
        );

        if (matchesSection) {
          return sec;
        }

        if (matchedItems.length > 0) {
          return {
            ...sec,
            items: matchedItems,
          };
        }

        return null;
      })
      .filter(Boolean) as typeof allSections;
  }, [allSections, searchQuery]);

  // Total count of categories and links
  const totalCount = useMemo(() => {
    return allSections.reduce((acc, sec) => acc + sec.items.length, 0);
  }, [allSections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -70;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 pb-20">
      {/* ── Top Header Bar ── */}
      <section className="bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            <Link href="/" className="hover:text-red-600 transition">
              મુખ્ય પાનું (Home)
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-neutral-900 dark:text-white">સાઇટમેપ (Site Map)</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-300 mb-2">
                <Compass className="h-3.5 w-3.5" />
                <span>સંપૂર્ણ વેબસાઇટ ડિરેક્ટરી</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                સાઇટમેપ - ગુજરાત પોસ્ટ
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                ગુજરાત પોસ્ટ પર ઉપલબ્ધ તમામ સક્રિય સમાચાર કેટેગરીઝ, શહેરી ડેસ્ક અને ડિજિટલ સેવાઓનું સત્તાવાર નેવિગેશન.
              </p>
            </div>

            {/* Total categories badge & Search Input */}
            <div className="w-full md:w-80 shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>કુલ શ્રેણીઓ:</span>
                <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/60">
                  {totalCount} Categories
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="કેટેગરી કે શહેર શોધો (Search)..."
                  className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-zinc-800/80 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:bg-white dark:focus:bg-zinc-800 transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Mobile & Desktop Quick-Jump Pills Bar ── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 py-2.5 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {allSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-zinc-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{sec.titleGu.split(' ')[0]}</span>
              <span className="text-[10px] opacity-60">({sec.items.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Site Map Content (Only Real Categories in Website) ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {filteredSections.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-2xs space-y-3">
            <Search className="h-10 w-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              કોઈ પરિણામ મળ્યું નથી
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              "{searchQuery}" સાથે મેળ ખાતી કોઈ કેટેગરી કે શહેર ઉપલબ્ધ નથી. કૃપા કરીને અન્ય શબ્દ અજમાવો.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer"
            >
              બધી કેટેગરીઝ જુઓ (View All)
            </button>
          </div>
        ) : (
          filteredSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <section
                key={sec.id}
                id={sec.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 shadow-2xs space-y-4 transition hover:border-neutral-300 dark:hover:border-neutral-700"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl ${sec.bg} ${sec.color} border flex items-center justify-center font-bold shrink-0`}>
                      <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-tight">
                        {sec.titleGu}
                      </h2>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium">
                        {sec.titleEn}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300">
                    {sec.items.length} {sec.items.length === 1 ? 'Link' : 'Links'}
                  </span>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {sec.items.map((item) => (
                    <Link
                      key={`${sec.id}-${item.slug}`}
                      href={item.href}
                      className="group flex flex-col justify-between p-3 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-zinc-800/40 hover:bg-red-50/60 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-900/60 transition duration-150 active:scale-98"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition leading-snug truncate">
                            {item.nameGu}
                          </h3>
                          <ChevronRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition shrink-0" />
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {item.nameEn}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-between text-[10px] text-neutral-400 group-hover:text-red-600 transition">
                        <span>ઓપન કરો</span>
                        <ArrowRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* ── Bottom Quick Back to Top Bar ── */}
        <div className="pt-4 pb-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>© {new Date().getFullYear()} Gujarat Post. All Rights Reserved.</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>ટોચ પર જાઓ (Back to Top)</span>
          </button>
        </div>
      </main>
    </div>
  );
}
