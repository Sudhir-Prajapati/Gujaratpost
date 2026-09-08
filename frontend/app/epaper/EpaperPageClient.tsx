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
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
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
import { formatEpaperPdfUrl, formatEpaperDownloadUrl, sanitizeImageUrl } from '@/lib/media';
import { EpaperReadOnlyProvider } from '@/components/epaper/EpaperReadOnlyContext';
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

  // Reader Modal state (Sandesh E-Paper Reader UX)
  const [activeReaderEdition, setActiveReaderEdition] = useState<EPaperEdition | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(80);
  const [pageDropdownOpen, setPageDropdownOpen] = useState<boolean>(false);
  const [readerViewMode, setReaderViewMode] = useState<'TEMPLATE' | 'PDF'>('TEMPLATE');

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
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [activeReaderEdition]);

  const readerCanvasRef = useRef<HTMLDivElement>(null);

  const openReader = (ed: EPaperEdition) => {
    setActiveReaderEdition(ed);
    setCurrentPage(1);
    setPageDropdownOpen(false);
    setReaderViewMode(ed.templateData ? 'TEMPLATE' : 'PDF');

    // Smart default zoom: broadsheet standard width is 1224px
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      if (w >= 1600) setZoomLevel(90);
      else if (w >= 1300) setZoomLevel(80);
      else if (w >= 1050) setZoomLevel(70);
      else if (w >= 768) setZoomLevel(60);
      else setZoomLevel(Math.min(100, Math.max(25, Math.floor(((w - 16) / 1224) * 100))));
    } else {
      setZoomLevel(80);
    }
  };

  const closeReader = () => {
    setActiveReaderEdition(null);
    setPageDropdownOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    if (!activeReaderEdition) return;
    const totalPages = activeReaderEdition.pages || 4;
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(targetPage);

    if (readerCanvasRef.current) {
      readerCanvasRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard navigation inside reader
  useEffect(() => {
    if (!activeReaderEdition) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const totalPages = activeReaderEdition.pages || 4;
      if (e.key === 'ArrowLeft') {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      } else if (e.key === 'Escape') {
        closeReader();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(150, prev + 10));
      } else if (e.key === '-') {
        setZoomLevel((prev) => Math.max(40, prev - 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReaderEdition]);

  const handleSwitchCityInReader = async (cityKey: string) => {
    setSelectedCity(cityKey);
    // Find matching edition in loaded editions
    const match = editions.find(
      (e) =>
        e.city.toLowerCase() === cityKey.toLowerCase() ||
        (e.cityGu && e.cityGu.toLowerCase() === cityKey.toLowerCase())
    );
    if (match) {
      setActiveReaderEdition(match);
      setCurrentPage(1);
      setReaderViewMode(match.templateData ? 'TEMPLATE' : 'PDF');
    } else {
      const fetched = await fetchPublicEPapers({ city: cityKey, date: selectedDate });
      if (fetched.length > 0) {
        setEditions(fetched);
        setActiveReaderEdition(fetched[0]);
        setCurrentPage(1);
        setReaderViewMode(fetched[0].templateData ? 'TEMPLATE' : 'PDF');
      }
    }
  };

  const formatIsoToDdMmYyyy = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDate;
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
                                <img
                                  src={sanitizeImageUrl(edition.thumbnailUrl)}
                                  alt={displayTitle}
                                  onError={(e) => {
                                    let fallback = '';
                                    if (edition.templateData) {
                                      try {
                                        const p = typeof edition.templateData === 'string' ? JSON.parse(edition.templateData) : edition.templateData;
                                        fallback = p?.page1?.leadStory?.image || p?.page1?.mainHeadline?.image || '';
                                      } catch (_) {}
                                    }
                                    if (fallback && e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                              ) : isImageUrl(edition.fileUrl) ? (
                                <img
                                  src={sanitizeImageUrl(edition.fileUrl)}
                                  alt={displayTitle}
                                  onError={(e) => {
                                    let fallback = '';
                                    if (edition.templateData) {
                                      try {
                                        const p = typeof edition.templateData === 'string' ? JSON.parse(edition.templateData) : edition.templateData;
                                        fallback = p?.page1?.leadStory?.image || p?.page1?.mainHeadline?.image || '';
                                      } catch (_) {}
                                    }
                                    if (fallback && e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                                />
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

      {/* ─── SANDESH-STYLE INTERACTIVE E-PAPER READER MODAL ─── */}
      {activeReaderEdition && (() => {
        const parsedTemplate = (() => {
          if (!activeReaderEdition.templateData) return null;
          try {
            return typeof activeReaderEdition.templateData === 'string'
              ? JSON.parse(activeReaderEdition.templateData)
              : activeReaderEdition.templateData;
          } catch {
            return null;
          }
        })();

        const totalPages = activeReaderEdition.pages || (parsedTemplate ? 4 : 24);
        const activeCityName = activeReaderEdition.city || 'Ahmedabad';
        const activeCityGu = activeReaderEdition.cityGu || activeCityName;

        const readerCityTabs = [
          { key: 'Ahmedabad', labelEn: 'AHMEDABAD', labelGu: 'અમદાવાદ' },
          { key: 'Surat', labelEn: 'SURAT CITY', labelGu: 'સુરત' },
          { key: 'Rajkot', labelEn: 'RAJKOT CITY', labelGu: 'રાજકોટ' },
          { key: 'Vadodara', labelEn: 'VADODARA', labelGu: 'વડોદરા' },
          { key: 'Bhavnagar', labelEn: 'BHAVNAGAR', labelGu: 'ભાવનગર' },
          { key: 'Bhuj', labelEn: 'BHUJ', labelGu: 'ભુજ' },
          { key: 'Gandhinagar', labelEn: 'GANDHINAGAR', labelGu: 'ગાંધીનગર' },
          { key: 'Jamnagar', labelEn: 'JAMNAGAR', labelGu: 'જામનગર' },
        ];

        const pageTitles: Record<number, { en: string; gu: string }> = {
          1: { en: 'Front Page', gu: 'મુખ્ય પૃષ્ઠ' },
          2: { en: 'Gujarat News', gu: 'રાજ્ય સમાચાર' },
          3: { en: 'Business', gu: 'વેપાર & અર્થતંત્ર' },
          4: { en: 'Sports', gu: 'રમતગમત / સ્પોર્ટ્સ' },
        };

        return (
          <div className="fixed inset-0 z-[9999] flex flex-col bg-[#EAECF0] text-slate-900 select-none">

            {/* ── 1. Top Crimson Red Navigation Bar ── */}
            <header className="bg-[#B3121B] text-white flex items-center justify-between px-3 sm:px-6 py-2 shrink-0 shadow-md">
              {/* Left: Home & Current Opened E-Paper City Only */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeReader}
                  className="px-3 py-1 text-xs font-black uppercase tracking-wider text-white hover:bg-black/20 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                  title="Return to E-Paper Home"
                >
                  <Newspaper className="h-4 w-4" />
                  <span>HOME</span>
                </button>
                <span className="text-white/40">|</span>

                {/* Only Show the Opened E-Paper City */}
                <div className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-black/25 text-white rounded-lg shadow-xs border-b-2 border-white flex items-center gap-1.5">
                  <span>{activeCityName.toUpperCase()} {activeCityName.toLowerCase().endsWith('city') ? '' : 'CITY'}</span>
                </div>
              </div>

              {/* Right: Close button */}
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={closeReader}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition cursor-pointer flex items-center gap-1"
                  title="Close E-Paper (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* ── 2. Sub-Header Toolbar (Sandesh Controls Bar) ── */}
            <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0 z-30">
              
              {/* Left Group: Page Dropdown + City Title */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Red Page Dropdown Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
                    className="bg-[#B3121B] hover:bg-[#990e15] text-white px-3 sm:px-3.5 py-1.5 rounded font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>Page {currentPage}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${pageDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {pageDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-56 rounded-lg bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                        const isSelected = currentPage === pNum;
                        const label = pageTitles[pNum]
                          ? `${pageTitles[pNum].gu} (${pageTitles[pNum].en})`
                          : `પેજ ${pNum}`;
                        return (
                          <button
                            key={pNum}
                            type="button"
                            onClick={() => {
                              handlePageChange(pNum);
                              setPageDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between transition ${
                              isSelected ? 'bg-red-50 text-[#B3121B]' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>Page {pNum}: {label}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#B3121B]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Big Center Title: Ahmedabad City */}
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
                    {activeCityName} City
                  </h2>
                </div>
              </div>

              {/* Center / Right Controls: Pagination, Zoom, Date, PDF Download */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                
                {/* Pagination Pills: « 1 2 3 4 » */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`h-8 w-8 rounded text-xs font-black flex items-center justify-center border transition ${
                      currentPage > 1
                        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
                        : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                    title="Previous Page (પાછળ)"
                  >
                    «
                  </button>

                  {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => handlePageChange(pNum)}
                      className={`h-8 min-w-[32px] px-2 rounded text-xs font-black transition cursor-pointer ${
                        currentPage === pNum
                          ? 'bg-[#B3121B] text-white border border-[#B3121B] shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`h-8 w-8 rounded text-xs font-black flex items-center justify-center border transition ${
                      currentPage < totalPages
                        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
                        : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                    title="Next Page (આગળ)"
                  >
                    »
                  </button>
                </div>

                {/* Zoom Controls (Sandesh style ZOOM pill) */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-black text-slate-800 min-w-[42px] text-center select-none">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const w = window.innerWidth;
                        if (w >= 1600) setZoomLevel(90);
                        else if (w >= 1300) setZoomLevel(80);
                        else if (w >= 1050) setZoomLevel(70);
                        else setZoomLevel(55);
                      } else {
                        setZoomLevel(80);
                      }
                    }}
                    className="text-[10px] font-black text-[#B3121B] hover:underline pl-1.5 border-l border-slate-200 uppercase cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Date Display Pill: 08-09-2026 📅 */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded px-2.5 py-1.5 shadow-xs text-xs font-bold text-slate-700 select-none">
                  <span>{formatIsoToDdMmYyyy(activeReaderEdition.date)}</span>
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                </div>

                {/* Mode Indicator: Only E-Paper */}
                <div className="flex items-center bg-[#B3121B] text-white px-3 py-1.5 rounded font-black text-xs shadow-xs select-none">
                  <span>ઈ-પેપર</span>
                </div>

                {/* PDF Download Button */}
                {activeReaderEdition.fileUrl && (
                  <a
                    href={formatEpaperDownloadUrl(activeReaderEdition.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#B3121B] hover:bg-[#990e15] text-white px-3 py-1.5 rounded font-black text-xs flex items-center gap-1.5 shadow-sm transition"
                    title="Download Newspaper PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </a>
                )}

              </div>
            </div>

            {/* ── 3. Main Workspace (Left Thumbnails Rail + Center Broadsheet) ── */}
            <div className="flex-1 flex overflow-hidden relative bg-[#EAECF0]">

              {/* ── Left Sidebar: Vertical Page Thumbnails Rail (Sandesh Style) ── */}
              <aside className="hidden sm:flex w-32 sm:w-40 md:w-44 bg-white border-r border-slate-200 flex-col shrink-0 overflow-y-auto p-2.5 space-y-3.5 shadow-sm scrollbar-thin z-10">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-center border-b border-slate-100 pb-1.5">
                  તમામ પેજ ({totalPages})
                </div>

                {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((pNum) => (
                  <div
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    className={`cursor-pointer group flex flex-col items-center bg-white rounded border-2 transition-all duration-150 overflow-hidden shadow-xs hover:shadow-md shrink-0 ${
                      currentPage === pNum
                        ? 'border-[#B3121B] ring-2 ring-red-400/40 shadow-md scale-[1.01]'
                        : 'border-slate-200 hover:border-red-300 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Miniature Page Content Preview */}
                    <div className="relative w-28 sm:w-36 h-36 sm:h-44 bg-white overflow-hidden select-none pointer-events-none border-b border-slate-100">
                      {pNum === 1 && (activeReaderEdition.thumbnailUrl || (activeReaderEdition.fileUrl && activeReaderEdition.fileUrl.includes("res.cloudinary.com"))) ? (
                        <img
                          src={activeReaderEdition.thumbnailUrl || activeReaderEdition.fileUrl.replace(/\.pdf$/i, ".jpg")}
                          alt={`Page ${pNum}`}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : parsedTemplate ? (
                        <div
                          style={{
                            width: "1000px",
                            height: "1414px",
                            transform: "scale(0.14)",
                            transformOrigin: "top left",
                          }}
                          className="pointer-events-none select-none bg-white"
                        >
                          <EpaperReadOnlyProvider value={true}>
                            {pNum === 1 && <Page1Front data={parsedTemplate.page1} onChange={() => {}} readOnly={true} />}
                            {pNum === 2 && <Page2Gujarat data={parsedTemplate.page2} onChange={() => {}} readOnly={true} />}
                            {pNum === 3 && <Page3Business data={parsedTemplate.page3} onChange={() => {}} readOnly={true} />}
                            {pNum === 4 && <Page4Sports data={parsedTemplate.page4} onChange={() => {}} readOnly={true} />}
                          </EpaperReadOnlyProvider>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-slate-50 text-slate-400">
                          <FileText className="h-8 w-8 mb-1 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-500">પેજ {pNum}</span>
                        </div>
                      )}
                    </div>
                    {/* Red Bottom Badge: PAGE 1, PAGE 2, etc. */}
                    <div
                      className={`w-full py-1 text-center text-[10px] font-black uppercase tracking-wider transition ${
                        currentPage === pNum
                          ? 'bg-[#B3121B] text-white'
                          : 'bg-slate-700 text-white group-hover:bg-[#B3121B]'
                      }`}
                    >
                      PAGE {pNum}
                    </div>
                  </div>
                ))}
              </aside>

              {/* ── Center Canvas: Broadsheet Viewport flanked by floating nav arrows ── */}
              <div
                ref={readerCanvasRef}
                className="flex-1 overflow-auto touch-pan-x touch-pan-y flex items-start justify-center p-2 sm:p-8 relative scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Floating Left Arrow Button (<) */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  title="Previous Page (પાછળનું પેજ)"
                  className="sticky left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-16 w-8 sm:h-20 sm:w-10 rounded-r-lg sm:rounded-lg bg-[#B3121B] hover:bg-[#990e15] text-white flex items-center justify-center shadow-xl transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shrink-0 mr-2"
                >
                  <ChevronLeft className="h-6 w-6 stroke-[3]" />
                </button>

                {/* Scaled Broadsheet Paper (Full 1224px width, No Cutoff) */}
                <div
                  className="flex flex-col items-center mx-auto shrink-0 relative"
                  style={{
                    width: `${1224 * (zoomLevel / 100)}px`,
                    height: `${1815 * (zoomLevel / 100)}px`,
                  }}
                >
                  <div
                    className="bg-white shadow-2xl rounded border border-slate-300 overflow-hidden w-[1224px] min-w-[1224px] max-w-[1224px] select-text shrink-0"
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <EpaperReadOnlyProvider value={true}>
                      {readerViewMode === 'TEMPLATE' && parsedTemplate ? (
                        <>
                          {currentPage === 1 && <Page1Front data={parsedTemplate.page1} onChange={() => {}} readOnly={true} />}
                          {currentPage === 2 && <Page2Gujarat data={parsedTemplate.page2} onChange={() => {}} readOnly={true} />}
                          {currentPage === 3 && <Page3Business data={parsedTemplate.page3} onChange={() => {}} readOnly={true} />}
                          {currentPage === 4 && <Page4Sports data={parsedTemplate.page4} onChange={() => {}} readOnly={true} />}
                        </>
                      ) : activeReaderEdition.fileUrl && (isPdfUrl(activeReaderEdition.fileUrl) || activeReaderEdition.fileUrl.includes('/uploads/')) ? (
                        <iframe
                          key={`${activeReaderEdition.id}-p${currentPage}`}
                          src={formatEpaperPdfUrl(activeReaderEdition.fileUrl, currentPage)}
                          className="w-[1224px] bg-white border-0"
                          style={{ height: '1815px' }}
                          title={`Gujarat Post E-Paper Page ${currentPage}`}
                        />
                      ) : isImageUrl(activeReaderEdition.fileUrl) ? (
                        <img
                          src={activeReaderEdition.fileUrl}
                          alt={`Gujarat Post E-Paper`}
                          className="w-[1224px] h-auto shadow-2xl"
                        />
                      ) : isImageUrl(activeReaderEdition.thumbnailUrl) ? (
                        <img
                          src={activeReaderEdition.thumbnailUrl}
                          alt={`Gujarat Post E-Paper`}
                          className="w-[1224px] h-auto shadow-2xl"
                        />
                      ) : (
                        <div className="w-[1224px] min-h-[1815px] bg-white text-slate-900 p-12 flex flex-col justify-between">
                          <div className="border-b-4 border-slate-950 pb-4">
                            <h2 className="text-5xl font-black text-red-600 tracking-tight">ગુજરાત પોસ્ટ</h2>
                            <div className="flex justify-between text-xs font-bold text-slate-600 mt-2">
                              <span>{activeCityGu || activeCityName} આવૃત્તિ</span>
                              <span>તારીખ: {activeReaderEdition.date} • પેજ {currentPage}</span>
                            </div>
                          </div>
                          <div className="my-auto text-center py-20 space-y-4">
                            <h3 className="text-3xl font-black text-slate-800">
                              {activeReaderEdition.title || `${activeCityGu || activeCityName} આવૃત્તિ`}
                            </h3>
                            <p className="text-slate-500 font-medium">આ પેજ પર કોઈ સામગ્રી ઉપલબ્ધ નથી.</p>
                          </div>
                        </div>
                      )}
                    </EpaperReadOnlyProvider>
                  </div>
                </div>

                {/* Floating Right Arrow Button (>) */}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  title="Next Page (આગળનું પેજ)"
                  className="sticky right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-16 w-8 sm:h-20 sm:w-10 rounded-l-lg sm:rounded-lg bg-[#B3121B] hover:bg-[#990e15] text-white flex items-center justify-center shadow-xl transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shrink-0 ml-2"
                >
                  <ChevronRight className="h-6 w-6 stroke-[3]" />
                </button>
              </div>

            </div>

          </div>
        );
      })()}
    </main>
  );
}
