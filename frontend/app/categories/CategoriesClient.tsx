'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Globe,
  TrendingUp,
  Trophy,
  Laptop,
  Film,
  HeartPulse,
  Sprout,
  BookOpen,
  ShieldAlert,
  CheckCircle,
  Video,
  Camera,
  Newspaper,
  Compass,
  MapPin,
  Sparkles,
  ChevronRight,
  Flame,
  ArrowRight,
  Layers,
  FileText,
  Activity,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  nameGu?: string;
  nameHi?: string;
  href: string;
  section: 'primary' | 'city' | 'multimedia';
  badge?: string;
}

const STATIC_PRIMARY_CATEGORIES: CategoryItem[] = [
  { id: 'gujarat', slug: 'gujarat', name: 'Gujarat', nameGu: 'ગુજરાત', nameHi: 'गुजरात', href: '/category/gujarat', section: 'primary', badge: 'મુખ્ય' },
  { id: 'national', slug: 'national', name: 'National', nameGu: 'ભારત', nameHi: 'भारत', href: '/category/national', section: 'primary' },
  { id: 'world', slug: 'world', name: 'World', nameGu: 'વિશ્વ', nameHi: 'विश्व', href: '/category/world', section: 'primary' },
  { id: 'politics', slug: 'politics', name: 'Politics', nameGu: 'રાજનીતિ', nameHi: 'राजनीति', href: '/category/politics', section: 'primary' },
  { id: 'business', slug: 'business', name: 'Business', nameGu: 'બિઝનેસ', nameHi: 'बिजनेस', href: '/category/business', section: 'primary' },
  { id: 'sports', slug: 'sports', name: 'Sports', nameGu: 'ક્રીડા & સ્પોર્ટ્સ', nameHi: 'खेल', href: '/category/sports', section: 'primary' },
  { id: 'entertainment', slug: 'entertainment', name: 'Entertainment', nameGu: 'મનોરંજન', nameHi: 'मनोरंजन', href: '/category/entertainment', section: 'primary' },
  { id: 'technology', slug: 'technology', name: 'Technology', nameGu: 'ટેકનોલોજી', nameHi: 'तकनीक', href: '/category/technology', section: 'primary' },
  { id: 'health', slug: 'health', name: 'Health', nameGu: 'હેલ્થ & ફિટનેસ', nameHi: 'स्वास्थ्य', href: '/category/health', section: 'primary' },
  { id: 'crime', slug: 'crime', name: 'Crime', nameGu: 'ક્રાઇમ', nameHi: 'क्राइम', href: '/category/crime', section: 'primary' },
  { id: 'agriculture', slug: 'agriculture', name: 'Agriculture', nameGu: 'કૃષિ & ખેતી', nameHi: 'कृषि', href: '/category/agriculture', section: 'primary' },
  { id: 'education', slug: 'education', name: 'Education', nameGu: 'શિક્ષણ & કારકિર્દી', nameHi: 'शिक्षा', href: '/category/education', section: 'primary' },
  { id: 'fact-check', slug: 'fact-check', name: 'Fact Check', nameGu: 'ફેક્ટ ચેક', nameHi: 'फैक्ट चेक', href: '/category/fact-check', section: 'primary' },
  { id: 'lifestyle', slug: 'lifestyle', name: 'Lifestyle', nameGu: 'લાઇફસ્ટાઇલ', nameHi: 'लाइफस्टाइल', href: '/category/lifestyle', section: 'primary' },
  { id: 'latest-news', slug: 'latest-news', name: 'Latest News', nameGu: 'તાજા સમાચાર', nameHi: 'ताज़ा समाचार', href: '/category/latest-news', section: 'primary' },
  { id: 'trending', slug: 'trending', name: 'Trending', nameGu: 'ટ્રેન્ડિંગ', nameHi: 'ट्रेंडिंग', href: '/category/trending', section: 'primary' },
];

const STATIC_CITY_CATEGORIES: CategoryItem[] = [
  { id: 'ahmedabad', slug: 'ahmedabad', name: 'Ahmedabad', nameGu: 'અમદાવાદ', nameHi: 'अहमदाबाद', href: '/category/ahmedabad', section: 'city' },
  { id: 'surat', slug: 'surat', name: 'Surat', nameGu: 'સુરત', nameHi: 'सूरत', href: '/category/surat', section: 'city' },
  { id: 'rajkot', slug: 'rajkot', name: 'Rajkot', nameGu: 'રાજકોટ', nameHi: 'राजकोट', href: '/category/rajkot', section: 'city' },
  { id: 'vadodara', slug: 'vadodara', name: 'Vadodara', nameGu: 'વડોદરા', nameHi: 'वडोदरा', href: '/category/vadodara', section: 'city' },
  { id: 'gandhinagar', slug: 'gandhinagar', name: 'Gandhinagar', nameGu: 'ગાંધીનગર', nameHi: 'गांधीनगर', href: '/category/gandhinagar', section: 'city' },
  { id: 'other-cities', slug: 'other-cities', name: 'Other Cities', nameGu: 'અન્ય શહેરો', nameHi: 'अन्य शहर', href: '/category/other-cities', section: 'city' },
];

const STATIC_MULTIMEDIA_CATEGORIES: CategoryItem[] = [
  { id: 'videos', slug: 'videos', name: 'Videos', nameGu: 'વીડિયો', nameHi: 'वीडियो', href: '/videos', section: 'multimedia', badge: 'HD' },
  { id: 'photos', slug: 'photos', name: 'Photo Gallery', nameGu: 'ફોટો ગેલેરી', nameHi: 'फोटो गैलरी', href: '/photos', section: 'multimedia' },
  { id: 'shorts', slug: 'shorts', name: 'YouTube Shorts', nameGu: 'શોર્ટ્સ', nameHi: 'शॉर्ट्स', href: '/shorts', section: 'multimedia' },
  { id: 'instagram', slug: 'instagram', name: 'Instagram Reels', nameGu: 'ઇન્સ્ટાગ્રામ રીલ્સ', nameHi: 'इंस्टाग्राम', href: '/instagram', section: 'multimedia' },
  { id: 'epaper', slug: 'epaper', name: 'E-Paper', nameGu: 'ઇ-પેપર', nameHi: 'ई-पेपर', href: '/epaper', section: 'multimedia', badge: 'PDF' },
  { id: 'web-stories', slug: 'web-stories', name: 'Web Stories', nameGu: 'વેબ સ્ટોરીઝ', nameHi: 'वेब स्टोरीज़', href: '/web-stories', section: 'multimedia' },
  { id: 'aqi', slug: 'aqi', name: 'Weather & AQI', nameGu: 'હવામાન & AQI', nameHi: 'मौसम & AQI', href: '/aqi', section: 'multimedia' },
  { id: 'live-center', slug: 'live-center', name: 'Live Center', nameGu: 'લાઈવ સેન્ટર (ક્રિકેટ / બજાર)', nameHi: 'लाइव सेंटर', href: '/#live-center', section: 'multimedia', badge: 'LIVE' },
];

function getCategoryIcon(slug: string, name?: string) {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s === 'gujarat' || n.includes('ગુજરાત') || n.includes('gujarat')) {
    return <img src="/assets/GujaratLogo.png" alt="Gujarat" className="h-6 w-6 object-contain shrink-0" />;
  }
  if (s === 'national' || s === 'india' || s === 'bharat' || n.includes('ભારત') || n.includes('भारत')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-orange-500 shrink-0" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    );
  }
  if (s === 'world' || s === 'international' || n.includes('વિશ્વ') || n.includes('विश्व')) {
    return <Globe className="h-6 w-6 text-blue-500 shrink-0" />;
  }
  if (s === 'politics' || n.includes('રાજ') || n.includes('राजनीति')) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-700 shrink-0" fill="currentColor">
        <path d="M12 1 2 6v2h20V6L12 1zm-7 9v9h2v-9H5zm4 0v9h2v-9H9zm4 0v9h2v-9h-2zm4 0v9h2v-9h-2zm-15 11v2h20v-2H2z" />
      </svg>
    );
  }
  if (s === 'business' || s === 'bigness' || s === 'market' || n.includes('બિઝનેસ')) {
    return <TrendingUp className="h-6 w-6 text-emerald-600 shrink-0" />;
  }
  if (s === 'sports' || s === 'krida' || n.includes('ક્રીડા') || n.includes('સ્પોર્ટ્સ')) {
    return <Trophy className="h-6 w-6 text-yellow-500 shrink-0" />;
  }
  if (s === 'technology' || s === 'tech' || n.includes('ટેક')) {
    return <Laptop className="h-6 w-6 text-sky-500 shrink-0" />;
  }
  if (s === 'entertainment' || s === 'manoranjan' || n.includes('મનોરંજન')) {
    return <Film className="h-6 w-6 text-rose-500 shrink-0" />;
  }
  if (s === 'health' || n.includes('હેલ્થ') || n.includes('સ્વાસ્થ્ય')) {
    return <HeartPulse className="h-6 w-6 text-red-600 shrink-0" />;
  }
  if (s === 'agriculture' || s === 'krushi' || n.includes('કૃષિ') || n.includes('ખેતી')) {
    return <Sprout className="h-6 w-6 text-green-600 shrink-0" />;
  }
  if (s === 'education' || s === 'shikshan' || n.includes('શિક્ષણ')) {
    return <BookOpen className="h-6 w-6 text-indigo-600 shrink-0" />;
  }
  if (s === 'crime' || n.includes('ક્રાઇમ')) {
    return <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />;
  }
  if (s.includes('fact') || n.includes('ફેક્ટ')) {
    return <CheckCircle className="h-6 w-6 text-teal-600 shrink-0" />;
  }
  if (s === 'videos' || s === 'video') {
    return <Video className="h-6 w-6 text-red-600 shrink-0" />;
  }
  if (s === 'photos' || s === 'gallery') {
    return <Camera className="h-6 w-6 text-purple-600 shrink-0" />;
  }
  if (s === 'epaper') {
    return <Newspaper className="h-6 w-6 text-blue-600 shrink-0" />;
  }
  if (s === 'shorts' || s === 'reels' || s === 'instagram') {
    return <Flame className="h-6 w-6 text-pink-600 shrink-0" />;
  }
  if (s === 'aqi' || s === 'weather') {
    return <Activity className="h-6 w-6 text-emerald-500 shrink-0" />;
  }

  // City icons
  if (['ahmedabad', 'surat', 'rajkot', 'vadodara', 'gandhinagar', 'other-cities'].includes(s)) {
    return <MapPin className="h-6 w-6 text-red-600 shrink-0" />;
  }

  return <Compass className="h-6 w-6 text-zinc-500 shrink-0" />;
}

export default function CategoriesClient({ initialCategories = [] }: { initialCategories?: any[] }) {
  const { language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Merge database categories with static defaults to ensure 100% coverage
  const allCategories = useMemo(() => {
    const list: CategoryItem[] = [];
    const seenSlugs = new Set<string>();

    const add = (item: CategoryItem) => {
      const s = item.slug.toLowerCase().trim();
      if (!seenSlugs.has(s)) {
        seenSlugs.add(s);
        list.push(item);
      }
    };

    // 1. Primary categories first
    STATIC_PRIMARY_CATEGORIES.forEach(add);

    // 2. City categories
    STATIC_CITY_CATEGORIES.forEach(add);

    // 3. Multimedia & special
    STATIC_MULTIMEDIA_CATEGORIES.forEach(add);

    // 4. Any additional active categories from DB that aren't yet in the list
    if (Array.isArray(initialCategories)) {
      for (const cat of initialCategories) {
        if (!cat || !cat.slug || cat.isActive === false) continue;
        const slug = cat.slug.toLowerCase().trim();
        if (!seenSlugs.has(slug)) {
          seenSlugs.add(slug);
          list.push({
            id: cat.id || slug,
            slug: slug,
            name: cat.nameEn || cat.name || slug,
            nameGu: cat.nameGu || cat.name,
            nameHi: cat.nameHi || cat.name,
            href: `/category/${slug}`,
            section: cat.headerType === 'GUJARAT' ? 'city' : 'primary',
          });
        }
      }
    }

    return list;
  }, [initialCategories]);

  // Filter based on search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCategories;

    return allCategories.filter((cat) => {
      return (
        cat.name.toLowerCase().includes(q) ||
        (cat.nameGu && cat.nameGu.toLowerCase().includes(q)) ||
        (cat.nameHi && cat.nameHi.toLowerCase().includes(q)) ||
        cat.slug.toLowerCase().includes(q)
      );
    });
  }, [allCategories, searchQuery]);

  const primaryGroup = useMemo(() => filteredCategories.filter((c) => c.section === 'primary'), [filteredCategories]);
  const cityGroup = useMemo(() => filteredCategories.filter((c) => c.section === 'city'), [filteredCategories]);
  const multimediaGroup = useMemo(() => filteredCategories.filter((c) => c.section === 'multimedia'), [filteredCategories]);

  const getLabel = (cat: CategoryItem) => {
    if (language === 'hi') return cat.nameHi || cat.name;
    if (language === 'gu') return cat.nameGu || cat.name;
    return cat.name;
  };

  const getSecondaryLabel = (cat: CategoryItem) => {
    if (language === 'en') return cat.nameGu || '';
    return cat.name;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 pb-16">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-b from-red-600/10 via-background to-background border-b border-border/40 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4 select-none">
            <Link href="/" className="hover:text-red-600 transition-colors">
              {language === 'gu' ? 'હોમ' : language === 'hi' ? 'होम' : 'Home'}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-red-600 font-extrabold">
              {language === 'gu' ? 'બધા વર્ગો' : language === 'hi' ? 'सभी वर्ग' : 'All Categories'}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-1.5 rounded-full bg-red-600" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                  {language === 'gu' ? 'બધા સમાચાર વર્ગો' : language === 'hi' ? 'सभी समाचार वर्ग' : 'All News Categories'}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1.5 ml-4">
                {language === 'gu'
                  ? 'ગુજરાત, દેશ અને દુનિયાના તમામ ક્ષેત્રોના તાજા અને વિશ્વસનીય સમાચારો એક જ સ્થળે'
                  : language === 'hi'
                  ? 'गुजरात, देश और दुनिया के सभी क्षेत्रों के समाचार एक ही जगह'
                  : 'Complete directory of news categories, local cities and multimedia sections'}
              </p>
            </div>

            {/* Quick Live Search Filter */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'gu'
                    ? 'કેટેગરી શોધો (દા.ત. ગુજરાત, બિઝનેસ)...'
                    : language === 'hi'
                    ? 'श्रेणी खोजें...'
                    : 'Search categories...'
                }
                className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold rounded-xl border border-border bg-background text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600 transition-all placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* 1. PRIMARY NEWS CATEGORIES */}
        {primaryGroup.length > 0 && (
          <section>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-red-600" />
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  {language === 'gu' ? 'મુખ્ય સમાચાર વિભાગો' : language === 'hi' ? 'मुख्य समाचार वर्ग' : 'Primary News Categories'}
                </h2>
                <span className="text-xs font-bold bg-red-600/10 text-red-600 px-2 py-0.5 rounded-full">
                  {primaryGroup.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {primaryGroup.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:shadow-md hover:border-red-500/60 dark:hover:border-red-500/40 hover:-translate-y-0.5 transition-all select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(cat.slug, cat.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm sm:text-[15px] text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-600 transition-colors">
                          {getLabel(cat)}
                        </span>
                        {cat.badge && (
                          <span className="text-[9px] font-black uppercase bg-red-600 text-white px-1.5 py-0.2 rounded shrink-0">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate mt-0.5">
                        {getSecondaryLabel(cat)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 2. GUJARAT REGIONAL CITIES */}
        {cityGroup.length > 0 && (
          <section>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  {language === 'gu' ? 'ગુજરાતના શહેરો અને જિલ્લાઓ' : language === 'hi' ? 'गुजरात के शहर' : 'Gujarat Cities & Districts'}
                </h2>
                <span className="text-xs font-bold bg-red-600/10 text-red-600 px-2 py-0.5 rounded-full">
                  {cityGroup.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {cityGroup.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className="group relative flex flex-col items-center justify-center p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:shadow-md hover:border-red-500/60 dark:hover:border-red-500/40 hover:-translate-y-0.5 transition-all text-center select-none"
                >
                  <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="font-black text-sm sm:text-[14.5px] text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 transition-colors leading-tight">
                    {getLabel(cat)}
                  </span>
                  <span className="text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {getSecondaryLabel(cat)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 3. MULTIMEDIA & SPECIAL FEEDS */}
        {multimediaGroup.length > 0 && (
          <section>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-600" />
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  {language === 'gu' ? 'મલ્ટીમીડિયા અને વિશેષ વિભાગો' : language === 'hi' ? 'मल्टीमीडिया और विशेष' : 'Multimedia & Special Sections'}
                </h2>
                <span className="text-xs font-bold bg-red-600/10 text-red-600 px-2 py-0.5 rounded-full">
                  {multimediaGroup.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {multimediaGroup.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs hover:shadow-md hover:border-red-500/60 dark:hover:border-red-500/40 hover:-translate-y-0.5 transition-all select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(cat.slug, cat.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-sm sm:text-[14.5px] text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-600 transition-colors">
                          {getLabel(cat)}
                        </span>
                        {cat.badge && (
                          <span className="text-[9px] font-black uppercase bg-red-600 text-white px-1.5 py-0.2 rounded shrink-0">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate mt-0.5">
                        {getSecondaryLabel(cat)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty Search Fallback */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-black text-foreground">
              {language === 'gu' ? 'કોઈ વર્ગ મળ્યો નથી' : 'No categories found'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'gu'
                ? `"${searchQuery}" માટે કોઈ પરિણામ મળ્યું નથી. કૃપા કરીને અન્ય કીવર્ડ અજમાવો.`
                : `No results for "${searchQuery}". Please try another keyword.`}
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
            >
              {language === 'gu' ? 'બધા વર્ગો જુઓ' : 'Show All'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

