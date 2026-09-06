'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Download,
  Eye,
  Newspaper,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { getLocalized } from '@/data';
import { useApp } from '@/components/AppProvider';
import {
  EPaperEdition,
  CityItem,
  fetchPublicEPapers,
  fetchEPaperCities,
  getTodayDateStr,
  getDateOffsetStr,
  clearLegacyLocalStorage,
} from '@/lib/epaper';
import { formatEpaperPdfUrl, formatEpaperDownloadUrl } from '@/lib/media';
import { Page1Front } from '@/components/epaper/Page1Front';
import { Page2Gujarat } from '@/components/epaper/Page2Gujarat';
import { Page3Business } from '@/components/epaper/Page3Business';
import { Page4Sports } from '@/components/epaper/Page4Sports';

function isPdfUrl(url?: string): boolean {
  if (!url || url.startsWith('blob:')) return false;
  const clean = url.toLowerCase().split('?')[0];
  return clean.endsWith('.pdf') || url.startsWith('data:application/pdf');
}

function isImageUrl(url?: string): boolean {
  if (!url || url.startsWith('blob:')) return false;
  if (url.startsWith('data:image/')) return true;
  const clean = url.toLowerCase().split('?')[0];
  return /\.(jpg|jpeg|png|webp|gif|jfif|svg|avif)$/i.test(clean);
}

export default function EpaperPageClient() {
  const { language } = useApp();

  const [editions, setEditions] = useState<EPaperEdition[]>([]);
  const [citiesList, setCitiesList] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [todayHasNoEditions, setTodayHasNoEditions] = useState(false);

  // Reader Modal state
  const [activeReaderEdition, setActiveReaderEdition] = useState<EPaperEdition | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Load editions & cities from backend API
  const todayStr = getTodayDateStr();
  const yesterdayStr = getDateOffsetStr(-1);
  const day2Str = getDateOffsetStr(-2);
  const day3Str = getDateOffsetStr(-3);
  const archiveDates = [todayStr, yesterdayStr, day2Str, day3Str];

  const loadData = async () => {
    setLoading(true);
    setTodayHasNoEditions(false);
    clearLegacyLocalStorage();

    const [fetchedEditions, fetchedCities] = await Promise.all([
      fetchPublicEPapers({
        city: selectedCity,
        date: selectedDate,
        search: searchQuery,
      }),
      fetchEPaperCities(),
    ]);

    // If today's date filter returns 0 results (no edition uploaded today yet),
    // automatically show the most recent editions from any date with a notice.
    if (fetchedEditions.length === 0 && selectedDate === todayStr && !searchQuery && selectedCity === 'ALL') {
      setTodayHasNoEditions(true);
      const fallbackEditions = await fetchPublicEPapers({ city: 'ALL' });
      setEditions(fallbackEditions);
    } else {
      setTodayHasNoEditions(false);
      setEditions(fetchedEditions);
    }

    setCitiesList(fetchedCities);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCity, selectedDate, searchQuery]);

  // Lock background scroll when reader modal is open
  useEffect(() => {
    if (activeReaderEdition) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [activeReaderEdition]);

  const readerCanvasRef = useRef<HTMLDivElement>(null);

  const openReader = (ed: EPaperEdition) => {
    setActiveReaderEdition(ed);
    setCurrentPage(1);
    setZoomLevel(100);
  };

  const closeReader = () => {
    setActiveReaderEdition(null);
  };

  const handlePageChange = (newPage: number) => {
    if (!activeReaderEdition) return;
    const totalPages = activeReaderEdition.pages || 24;
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(targetPage);

    if (readerCanvasRef.current) {
      const container = readerCanvasRef.current;
      const totalScrollHeight = container.scrollHeight - container.clientHeight;
      if (totalScrollHeight > 0 && totalPages > 1) {
        const targetScroll = ((targetPage - 1) / (totalPages - 1)) * totalScrollHeight;
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="bg-background min-h-screen pb-16">
      {/* ─── HERO HEADER SECTION ─── */}
      <section className="border-b border-border bg-gradient-to-b from-card via-card to-background py-8 sm:py-12">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-600/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                <Newspaper className="h-4 w-4" />
                Gujarat Post E-Paper (ઈ-પેપર)
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-5xl">
                {getLocalized(language, {
                  en: 'City-Wise & Daily E-Paper',
                  gu: 'દૈનિક અને વિભિન્ન શહેર ઈ-પેપર',
                  hi: 'दैनिक एवं शहर वार ई-पेपर',
                })}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
                {getLocalized(language, {
                  en: 'Read today’s newspaper editions date-wise for Ahmedabad, Surat, Rajkot, Vadodara & all cities of Gujarat.',
                  gu: 'અમદાવાદ, સુરત, રાજકોટ, વડોદરા અને ગુજરાતના તમામ શહેરોની તારીખવાર ઈ-પેપર આવૃત્તિઓ વાંચો.',
                  hi: 'अहमदाबाद, सूरत, राजकोट, वडोदरा और गुजरात के सभी शहरों के तारीखवार समाचार पत्र पढ़ें.',
                })}
              </p>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-border bg-muted/60 pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition focus:border-red-600 focus:bg-background"
                placeholder={getLocalized(language, {
                  en: 'Search city or date (e.g. Surat, 2026-08-06)...',
                  gu: 'શહેર અથવા તારીખ શોધો (દા.ત. સુરત)...',
                  hi: 'शहर या तारीख खोजें (उदा. सूरत)...',
                })}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DATE & CITY FILTER TOOLBAR ─── */}
      <section className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4 py-4 space-y-3">
          
          {/* Row 1: Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-red-600 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {getLocalized(language, { en: 'Select Date:', gu: 'તારીખ પસંદ કરો:', hi: 'तारीख चुनें:' })}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-red-600 cursor-pointer"
              />
            </div>

            {/* Quick Date Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                  selectedDate === todayStr
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                }`}
              >
                {getLocalized(language, { en: 'Today', gu: 'આજે', hi: 'आज' })}
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                  selectedDate === yesterdayStr
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                }`}
              >
                {getLocalized(language, { en: 'Yesterday', gu: 'ગઈકાલે', hi: 'कल' })}
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                  !selectedDate
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                }`}
              >
                {getLocalized(language, { en: 'All Dates', gu: 'તમામ તારીખો', hi: 'सभी तारीखें' })}
              </button>
            </div>
          </div>

          {/* Row 2: City Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-border/50">
            <span className="text-xs font-black uppercase text-muted-foreground shrink-0 flex items-center gap-1 mr-1">
              <MapPin className="h-4 w-4 text-red-600" />
              {getLocalized(language, { en: 'City:', gu: 'શહેર:', hi: 'शहर:' })}
            </span>

            <button
              type="button"
              onClick={() => setSelectedCity('ALL')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black shrink-0 transition ${
                selectedCity === 'ALL'
                  ? 'bg-foreground text-background shadow'
                  : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
              }`}
            >
              {getLocalized(language, { en: 'All Cities', gu: 'બધા જ શહેરો', hi: 'सभी शहर' })}
            </button>

            {citiesList.map((c) => {
              const label = c.cityGu || c.city;
              const isSelected = selectedCity === c.city;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCity(c.city)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-black shrink-0 transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-muted text-foreground hover:border-red-600/50 border border-border'
                  }`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── NEWSPAPER EDITIONS GROUPED BY CITY ─── */}
      <section className="mx-auto max-w-screen-xl px-4 py-8">

        {/* Today's edition not available banner */}
        {todayHasNoEditions && editions.length > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <span className="text-xl shrink-0">📅</span>
            <div>
              <p className="text-sm font-black text-amber-700 dark:text-amber-400">
                {getLocalized(language, {
                  en: `Today's edition (${formatDateDisplay(todayStr)}) is not uploaded yet.`,
                  gu: `આજનો અંક (${formatDateDisplay(todayStr)}) હજી અપલોડ થયો નથી.`,
                  hi: `आज का संस्करण (${formatDateDisplay(todayStr)}) अभी अपलोड नहीं हुआ है।`,
                })}
              </p>
              <p className="text-xs font-semibold text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                {getLocalized(language, {
                  en: 'Showing the most recent available editions below.',
                  gu: 'સૌથી તાજી ઉપલબ્ધ આવૃત્તિઓ નીચે દર્શાવવામાં આવી છે.',
                  hi: 'नीचे सबसे हाल के उपलब्ध संस्करण दिखाए जा रहे हैं।',
                })}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2.5">
              <Newspaper className="h-6 w-6 text-red-600" />
              {todayHasNoEditions ? (
                getLocalized(language, { en: 'Latest Available Editions', gu: 'સૌથી તાજી ઉપલબ્ધ ઈ-પેપર', hi: 'नवीनतम उपलब्ध ई-पेपर' })
              ) : selectedDate ? (
                <>
                  {formatDateDisplay(selectedDate)} —{' '}
                  {selectedCity === 'ALL'
                    ? getLocalized(language, { en: 'All City Editions', gu: 'તમામ શહેર આવૃત્તિઓ', hi: 'सभी शहर संस्करण' })
                    : getLocalized(language, { en: `${selectedCity} Edition`, gu: `${citiesList.find(c => c.city === selectedCity)?.cityGu || selectedCity} આવૃત્તિ`, hi: `${selectedCity} संस्करण` })}
                </>
              ) : (
                getLocalized(language, { en: 'All Available Editions', gu: 'ઉપલબ્ધ તમામ ઈ-પેપર', hi: 'सभी उपलब्ध ई-पेपर' })
              )}
            </h2>
            {editions.length > 0 && (
              <p className="text-xs font-bold text-muted-foreground mt-0.5">
                {editions.length}{' '}
                {getLocalized(language, { en: 'editions available to read', gu: 'આવૃત્તિઓ વાંચવા માટે ઉપલબ્ધ છે', hi: 'संस्करण पढ़ने के लिए उपलब्ध हैं' })}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
          </div>
        ) : editions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center my-8">
            <Newspaper className="mx-auto h-14 w-14 text-muted-foreground/25 mb-4" />

            {/* Dynamic message based on active filters */}
            <h3 className="text-xl font-black text-foreground">
              {getLocalized(language, {
                en: 'No E-Paper Available',
                gu: 'ઈ-પેપર ઉપલબ્ધ નથી',
                hi: 'ई-पेपर उपलब्ध नहीं',
              })}
            </h3>

            <div className="mt-3 space-y-1.5">
              {selectedDate && (
                <p className="text-sm font-semibold text-muted-foreground">
                  📅{' '}
                  {getLocalized(language, { en: 'Date:', gu: 'તારીખ:', hi: 'तारीख:' })}{' '}
                  <span className="text-foreground font-black">{formatDateDisplay(selectedDate)}</span>
                  {getLocalized(language, { en: ' — No edition uploaded for this date.', gu: ' — આ તારીખ માટે ઈ-પેપર અપલોડ થયું નથી.', hi: ' — इस तारीख के लिए संस्करण अपलोड नहीं हुआ.' })}
                </p>
              )}
              {selectedCity !== 'ALL' && (
                <p className="text-sm font-semibold text-muted-foreground">
                  📍{' '}
                  {getLocalized(language, { en: 'City:', gu: 'શહેર:', hi: 'शहर:' })}{' '}
                  <span className="text-foreground font-black">
                    {citiesList.find(c => c.city === selectedCity)?.cityGu || selectedCity}
                  </span>
                  {getLocalized(language, { en: ' — No edition available for this city.', gu: ' — આ શહેર માટે ઈ-પેપર ઉપલબ્ધ નથી.', hi: ' — इस शहर के लिए संस्करण उपलब्ध नहीं.' })}
                </p>
              )}
              {searchQuery && (
                <p className="text-sm font-semibold text-muted-foreground">
                  🔍{' '}
                  {getLocalized(language, { en: 'Search:', gu: 'શોધ:', hi: 'खोज:' })}{' '}
                  <span className="text-foreground font-black">"{searchQuery}"</span>
                  {getLocalized(language, { en: ' — No results found.', gu: ' — કોઈ પરિણામ મળ્યું નથી.', hi: ' — कोई परिणाम नहीं मिला.' })}
                </p>
              )}
              {!selectedDate && selectedCity === 'ALL' && !searchQuery && (
                <p className="text-sm font-semibold text-muted-foreground">
                  {getLocalized(language, {
                    en: 'No editions have been uploaded yet. Please check back later.',
                    gu: 'હજી સુધી કોઈ ઈ-પેપર અપલોડ થયું નથી. કૃપા કરી પછીથી ચેક કરો.',
                    hi: 'अभी तक कोई संस्करण अपलोड नहीं हुआ। कृपया बाद में जांचें.',
                  })}
                </p>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {selectedDate !== todayStr && (
                <button
                  onClick={() => { setSelectedDate(todayStr); setSelectedCity('ALL'); setSearchQuery(''); }}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700 transition shadow"
                >
                  {getLocalized(language, { en: "View Today's E-Papers", gu: 'આજના ઈ-પેપર જુઓ', hi: 'आज के ई-पेपर देखें' })}
                </button>
              )}
              {(selectedCity !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => { setSelectedCity('ALL'); setSearchQuery(''); }}
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-black text-foreground hover:bg-muted/80 transition"
                >
                  {getLocalized(language, { en: 'Clear Filters', gu: 'ફિલ્ટર હટાવો', hi: 'फ़िल्टर हटाएं' })}
                </button>
              )}
              {selectedDate && selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-black text-foreground hover:bg-muted/80 transition"
                >
                  {getLocalized(language, { en: 'All Dates', gu: 'તમામ તારીખો', hi: 'सभी तारीखें' })}
                </button>
              )}
            </div>
          </div>
        ) : (() => {
          const CITY_PRIORITY = ['ahmedabad', 'surat', 'rajkot', 'vadodara', 'jamnagar'];
          const cityMap = new Map<string, { cityLabel: string; cityLabelGu: string; items: EPaperEdition[] }>();
          editions.forEach((ed) => {
            const key = ed.city.trim().toLowerCase();
            if (!cityMap.has(key)) {
              const found = citiesList.find(c => c.city.trim().toLowerCase() === key);
              cityMap.set(key, { cityLabel: ed.city, cityLabelGu: found?.cityGu || ed.cityGu || ed.city, items: [] });
            }
            cityMap.get(key)!.items.push(ed);
          });
          const sortedKeys = Array.from(cityMap.keys()).sort((a, b) => {
            const ai = CITY_PRIORITY.indexOf(a), bi = CITY_PRIORITY.indexOf(b);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1; if (bi !== -1) return 1;
            return a.localeCompare(b);
          });
          return (
            <div className="space-y-10">
              {sortedKeys.map((cityKey) => {
                const { cityLabel, cityLabelGu, items } = cityMap.get(cityKey)!;
                const displayCityName = (language === 'gu' ? cityLabelGu : cityLabel).toUpperCase();
                return (
                  <div key={cityKey}>
                    {/* ── City Header Bar ── */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setSelectedCity(cityLabel)}
                        className="inline-flex items-center gap-2 bg-[#B3121B] hover:bg-[#8f0e15] text-white px-4 py-2 text-sm font-black uppercase tracking-wider transition"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)' }}
                      >
                        {displayCityName}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* ── Edition Cards: smaller, more columns ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {items.map((edition) => {
                        const rawTitle = edition.title || `${edition.city} ${getLocalized(language, { en: 'Edition', gu: 'આવૃત્તિ', hi: 'संस्करण' })}`;
                        const displayTitle = rawTitle.toUpperCase();
                        return (
                          <article
                            key={edition.id}
                            onClick={() => openReader(edition)}
                            className="group flex flex-col overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                          >
                            {/* Newspaper front page — portrait aspect */}
                            <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-zinc-950" style={{ aspectRatio: '3/4' }}>
                              {isImageUrl(edition.thumbnailUrl) ? (
                                <img src={edition.thumbnailUrl} alt={displayTitle} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                              ) : isImageUrl(edition.fileUrl) ? (
                                <img src={edition.fileUrl} alt={displayTitle} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                              ) : edition.fileUrl && edition.fileUrl.includes('res.cloudinary.com') ? (
                                <img src={edition.fileUrl.replace(/\.pdf$/i, '.jpg')} alt={displayTitle} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                              ) : edition.fileUrl && (isPdfUrl(edition.fileUrl) || edition.fileUrl.includes('/uploads/')) ? (
                                <div className="h-full w-full overflow-hidden pointer-events-none">
                                  <iframe src={formatEpaperPdfUrl(edition.fileUrl, 1)} className="w-full h-full border-0 pointer-events-none" title={displayTitle} />
                                </div>
                              ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-slate-50 to-slate-200 dark:from-zinc-900 dark:to-zinc-950 p-4">
                                  <Newspaper className="h-12 w-12 text-[#B3121B] opacity-70" />
                                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase text-center leading-tight">{rawTitle}</span>
                                  <span className="text-[10px] text-slate-400">{edition.date}</span>
                                </div>
                              )}
                              {/* Subtle hover overlay */}
                              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-all duration-300" />
                            </div>

                            {/* Red footer label with edition name + >> */}
                            <div className="flex items-center justify-between bg-[#B3121B] px-3 py-2 text-white">
                              <span className="text-[11px] font-black uppercase tracking-wide truncate leading-tight">{displayTitle}</span>
                              <span className="text-[11px] font-black shrink-0 ml-2 opacity-80">{'>>'}</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>


      {/* ─── INTERACTIVE E-PAPER READER MODAL ─── */}
      {activeReaderEdition && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950">

          {/* ── Reader Header ── */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-white shrink-0">
            {/* Left: Logo + title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                <Newspaper className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black leading-tight truncate">
                  Gujarat Post — {activeReaderEdition.cityGu || activeReaderEdition.city}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-tight">
                  {formatDateDisplay(activeReaderEdition.date)} • {activeReaderEdition.pages || 24} {getLocalized(language, { en: 'Pages', gu: 'પેજ', hi: 'पेज' })}
                </p>
              </div>
            </div>

            {/* Right: Download + Close */}
            <div className="flex items-center gap-2 shrink-0">
              {activeReaderEdition.fileUrl && (
                <a
                  href={formatEpaperDownloadUrl(activeReaderEdition.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black text-white hover:bg-red-700 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </a>
              )}
              <button
                onClick={closeReader}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Reader Canvas (full remaining height) ── */}
          <div
            ref={readerCanvasRef}
            className="flex-1 overflow-auto bg-slate-950"
            onScroll={(e) => {
              const target = e.currentTarget;
              const scrollPosition = target.scrollTop;
              const totalScrollHeight = target.scrollHeight - target.clientHeight;
              const totalPages = activeReaderEdition?.pages || 24;
              if (totalScrollHeight > 0 && totalPages > 1) {
                const calculatedPage = Math.min(
                  totalPages,
                  Math.max(1, Math.round((scrollPosition / totalScrollHeight) * (totalPages - 1)) + 1)
                );
                if (calculatedPage !== currentPage) setCurrentPage(calculatedPage);
              }
            }}
          >
            <div
              className="min-h-full flex items-start justify-center py-4"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              {activeReaderEdition.templateData ? (() => {
                let parsed: any = null;
                try {
                  parsed = typeof activeReaderEdition.templateData === 'string'
                    ? JSON.parse(activeReaderEdition.templateData)
                    : activeReaderEdition.templateData;
                } catch (_) {}

                if (parsed) {
                  return (
                    <div className="bg-white shadow-2xl overflow-hidden rounded">
                      {currentPage === 1 && <Page1Front data={parsed.page1} onChange={() => {}} />}
                      {currentPage === 2 && <Page2Gujarat data={parsed.page2} onChange={() => {}} />}
                      {currentPage === 3 && <Page3Business data={parsed.page3} onChange={() => {}} />}
                      {currentPage === 4 && <Page4Sports data={parsed.page4} onChange={() => {}} />}
                    </div>
                  );
                }

                return null;
              })() : null}

              {!activeReaderEdition.templateData && (isPdfUrl(activeReaderEdition.fileUrl) || activeReaderEdition.fileUrl?.includes('/uploads/')) ? (
                <iframe
                  key={`${activeReaderEdition.id}-p${currentPage}`}
                  src={formatEpaperPdfUrl(activeReaderEdition.fileUrl, currentPage)}
                  className="w-[calc(100vw-2rem)] max-w-[900px] bg-white border-0 shadow-2xl"
                  style={{ height: 'calc((100vw - 2rem) * 1.414)', maxHeight: '90vh' }}
                  title={`Gujarat Post E-Paper Page ${currentPage}`}
                />
              ) : !activeReaderEdition.templateData && isImageUrl(activeReaderEdition.fileUrl) ? (
                <img
                  src={activeReaderEdition.fileUrl}
                  alt={`Gujarat Post E-Paper`}
                  className="w-full max-w-[900px] h-auto shadow-2xl"
                />
              ) : !activeReaderEdition.templateData && isImageUrl(activeReaderEdition.thumbnailUrl) ? (
                <img
                  src={activeReaderEdition.thumbnailUrl}
                  alt={`Gujarat Post E-Paper`}
                  className="w-full max-w-[900px] h-auto shadow-2xl"
                />
              ) : !activeReaderEdition.templateData && (
                /* Fallback: newspaper mock layout */
                <div className="w-full max-w-[750px] bg-white text-slate-900 shadow-2xl p-8 rounded-lg">
                  <div className="flex items-center justify-between border-b-4 border-slate-950 pb-3 mb-6">
                    <h2 className="text-4xl font-black tracking-tighter text-red-600">GUJARAT POST</h2>
                    <div className="text-right text-xs font-black uppercase text-slate-700">
                      <div>{activeReaderEdition.cityGu || activeReaderEdition.city} Edition</div>
                      <div className="text-[10px] text-slate-500">{activeReaderEdition.date} • Page {currentPage}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <span className="inline-block bg-red-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded">
                      PAGE {currentPage} • {getLocalized(language, { en: 'MAIN EDITION', gu: 'મુખ્ય અંક', hi: 'मुख्य संस्करण' })}
                    </span>
                    <h3 className="text-2xl font-black text-slate-950 leading-tight">
                      {activeReaderEdition.title || `${activeReaderEdition.cityGu || activeReaderEdition.city} Edition`}
                    </h3>
                    <p className="text-slate-500 text-sm">{activeReaderEdition.date}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Navigation Bar ── */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-2.5 text-white shrink-0">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-black hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              {getLocalized(language, { en: 'Previous', gu: 'પાછળ', hi: 'पिछला' })}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">{getLocalized(language, { en: 'Page', gu: 'પેજ', hi: 'पेज' })}</span>
              <select
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="bg-slate-800 text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: activeReaderEdition.pages || 24 }, (_, i) => i + 1).map((pNum) => (
                  <option key={pNum} value={pNum}>{pNum}</option>
                ))}
              </select>
              <span className="text-xs font-bold text-slate-400">
                {getLocalized(language, { en: 'of', gu: 'માંથી', hi: 'का' })} {activeReaderEdition.pages || 24}
              </span>
            </div>

            <button
              disabled={currentPage >= (activeReaderEdition.pages || 24)}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-40 transition"
            >
              {getLocalized(language, { en: 'Next', gu: 'આગળ', hi: 'अगला' })}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}
    </main>
  );
}
