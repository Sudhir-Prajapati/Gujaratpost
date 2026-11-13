'use client';

import React, { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  ChevronDown,
  ArrowUpRight,
  MapPin,
  Leaf,
  RotateCw,
  AlertCircle,
  Activity,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Language } from '@/types';

interface WeatherCity {
  temp: string;
  tempMax?: string;
  tempMin?: string;
  apparentTemp?: string;
  desc: string;
  descGu: string;
  icon: string;
  humidity: string;
  wind: string;
  weatherCode?: number;
  observationTime?: string;
}

interface AqiCity {
  value: number;
  label: string;
  labelGu: string;
  category?: string;
  categoryGu?: string;
  color?: string;
  lightColor?: string;
  dominant?: string;
  advisoryGu?: string;
  advisoryEn?: string;
  station?: string;
  stationEn?: string;
  pm25: number;
  pm10: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
  subIndices?: {
    pm25?: number | null;
    pm10?: number | null;
    no2?: number | null;
    so2?: number | null;
    co?: number | null;
    o3?: number | null;
  };
  observationTime?: string;
}

const INITIAL_WEATHER: Record<string, WeatherCity> = {
  Ahmedabad: {
    temp: '27.5',
    tempMax: '32.7',
    tempMin: '20.4',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '40%',
    wind: '12 km/h',
  },
  Vadodara: {
    temp: '27.5',
    tempMax: '33.4',
    tempMin: '20.8',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '42%',
    wind: '10 km/h',
  },
  Surat: {
    temp: '28.7',
    tempMax: '34.6',
    tempMin: '20.8',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '40%',
    wind: '11 km/h',
  },
  Rajkot: {
    temp: '28.3',
    tempMax: '33.5',
    tempMin: '21.3',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '39%',
    wind: '9 km/h',
  },
};

const INITIAL_AQI: Record<string, AqiCity> = {
  Ahmedabad: {
    value: 42,
    label: 'Good',
    labelGu: 'સારી',
    category: 'Good',
    categoryGu: 'સારી',
    color: '#16a34a',
    lightColor: '#f0fdf4',
    station: 'પીરાણા / મણિનગર - GPCB CAAQM સ્ટેશન, અમદાવાદ',
    stationEn: 'Pirana / Maninagar - GPCB CAAQM Station, Ahmedabad',
    pm25: 28.5,
    pm10: 42.0,
    no2: 15.2,
    so2: 12.1,
    co: 0.40,
    o3: 45.0,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા ઉત્તમ છે. સ્વાસ્થ્ય માટે કોઈ જોખમ નથી.',
  },
  Vadodara: {
    value: 65,
    label: 'Satisfactory',
    labelGu: 'સંતોષકારક',
    category: 'Satisfactory',
    categoryGu: 'સંતોષકારક',
    color: '#65a30d',
    lightColor: '#f7fee7',
    station: 'દાંડિયા બજાર / જીઆઇડીસી - GPCB CAAQM સ્ટેશન, વડોદરા',
    stationEn: 'Dandia Bazar / GIDC - GPCB CAAQM Station, Vadodara',
    pm25: 42.0,
    pm10: 55.0,
    no2: 14.8,
    so2: 10.2,
    co: 0.42,
    o3: 75.0,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ સાવચેતી રાખવી.',
  },
  Surat: {
    value: 85,
    label: 'Satisfactory',
    labelGu: 'સંતોષકારક',
    category: 'Satisfactory',
    categoryGu: 'સંતોષકારક',
    color: '#65a30d',
    lightColor: '#f7fee7',
    station: 'કતારગામ / વરાછા - GPCB CAAQM સ્ટેશન, સુરત',
    stationEn: 'Katargam / Varachha - GPCB CAAQM Station, Surat',
    pm25: 52.0,
    pm10: 62.0,
    no2: 38.0,
    so2: 70.0,
    co: 0.38,
    o3: 65.0,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ સાવચેતી રાખવી.',
  },
  Rajkot: {
    value: 45,
    label: 'Good',
    labelGu: 'સારી',
    category: 'Good',
    categoryGu: 'સારી',
    color: '#16a34a',
    lightColor: '#f0fdf4',
    station: 'કણકોટ / રેસકોર્સ - GPCB CAAQM સ્ટેશન, રાજકોટ',
    stationEn: 'Kankot / Race Course - GPCB CAAQM Station, Rajkot',
    pm25: 26.3,
    pm10: 35.2,
    no2: 6.7,
    so2: 7.4,
    co: 0.28,
    o3: 50.0,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા ઉત્તમ છે. સ્વાસ્થ્ય માટે કોઈ જોખમ નથી.',
  },
};

const CITIES = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'];

const CITY_METADATA: Record<string, { gu: string; hi: string }> = {
  Ahmedabad: { gu: 'અમદાવાદ', hi: 'अहमदाबाद' },
  Vadodara: { gu: 'વડોદરા', hi: 'वडोदरा' },
  Surat: { gu: 'સુરત', hi: 'सूरत' },
  Rajkot: { gu: 'રાજકોટ', hi: 'રાજકોટ' },
};

export default function WeatherDashboardSection({ language }: { language: Language }) {
  const [activeTab, setActiveTab] = useState<'weather' | 'aqi'>('weather');
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherCity>>(INITIAL_WEATHER);
  const [aqiData, setAqiData] = useState<Record<string, AqiCity>>(INITIAL_AQI);
  const [lastUpdateStr, setLastUpdateStr] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  // Close custom dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const isGu = language === 'gu';
  const isHi = language === 'hi';

  const formatCurrentTimestamp = useCallback((dateInput?: Date | string | number) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '';
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(d);
      const getP = (type: string) => parts.find((p) => p.type === type)?.value || '';
      return `${getP('year')}-${getP('month')}-${getP('day')} ${getP('hour')}:${getP('minute')}`;
    } catch {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }, []);

  const fetchLiveData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      const url = forceRefresh ? '/api/weather-multi?refresh=1' : '/api/weather-multi';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          const { weatherData: wData, aqiData: aData, updatedAtFormatted, updatedAt } = json.data;
          startTransition(() => {
            if (wData && Object.keys(wData).length > 0) {
              setWeatherData((prev) => ({ ...prev, ...wData }));
            }
            if (aData && Object.keys(aData).length > 0) {
              setAqiData((prev) => ({ ...prev, ...aData }));
            }
            if (updatedAtFormatted) {
              setLastUpdateStr(updatedAtFormatted);
            } else if (updatedAt) {
              setLastUpdateStr(formatCurrentTimestamp(updatedAt));
            } else {
              setLastUpdateStr(formatCurrentTimestamp());
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Weather Dashboard] Fetch failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [formatCurrentTimestamp]);

  useEffect(() => {
    setLastUpdateStr(formatCurrentTimestamp());
    fetchLiveData(false);

    const interval = setInterval(() => {
      fetchLiveData(false);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchLiveData, formatCurrentTimestamp]);

  const mainWeather = weatherData[selectedCity] || weatherData.Ahmedabad || INITIAL_WEATHER.Ahmedabad;
  const mainAqi = aqiData[selectedCity] || aqiData.Ahmedabad || INITIAL_AQI.Ahmedabad;
  const otherCities = CITIES.filter((c) => c !== selectedCity);

  const aqiVal = typeof mainAqi.value === 'number' ? mainAqi.value : 42;
  const aqiPercentage = Math.min(97, Math.max(3, (aqiVal / 500) * 100));

  const aqiColor = mainAqi.color || (aqiVal <= 50 ? '#16a34a' : aqiVal <= 100 ? '#65a30d' : aqiVal <= 200 ? '#ca8a04' : aqiVal <= 300 ? '#ea580c' : '#dc2626');
  const aqiBadgeLabel = isGu
    ? `${mainAqi.labelGu || 'સારી'} (${mainAqi.label || 'Good'})`
    : isHi
      ? `${mainAqi.labelGu || 'अच्छा'} (${mainAqi.label || 'Good'})`
      : `${mainAqi.label || 'Good'}`;

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-2 mb-3 select-none" aria-label="Gujarat Post Weather and AQI Dashboard">
      {/* ─── TOP TABS (Connected Directly to Main Card) ─── */}
      <div className="flex items-end">
        <div className="inline-flex items-end relative z-10 -mb-[1px]">
          {/* Tab 1: Weather */}
          <button
            type="button"
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 text-xs sm:text-sm font-black transition-all rounded-t-xl tracking-wide select-none cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-[#C8101E] text-white shadow-xs border-t border-x border-[#C8101E]'
                : 'bg-white dark:bg-[#1a1c29] text-[#171B2D] dark:text-slate-200 border-t border-x border-slate-300 dark:border-slate-800 hover:text-[#C8101E]'
            }`}
          >
            <Sun className={`h-4 w-4 ${activeTab === 'weather' ? 'text-white' : 'text-[#C8101E]'}`} />
            <span>{isGu ? 'હવામાન' : isHi ? 'मौसम' : 'WEATHER'}</span>
          </button>

          {/* Tab 2: AQI */}
          <button
            type="button"
            onClick={() => setActiveTab('aqi')}
            className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 text-xs sm:text-sm font-black transition-all rounded-t-xl tracking-wide select-none cursor-pointer ${
              activeTab === 'aqi'
                ? 'bg-[#C8101E] text-white shadow-xs border-t border-x border-[#C8101E]'
                : 'bg-white dark:bg-[#1a1c29] text-[#171B2D] dark:text-slate-200 border-t border-x border-slate-300 dark:border-slate-800 hover:text-[#C8101E]'
            }`}
          >
            <Wind className={`h-4 w-4 ${activeTab === 'aqi' ? 'text-white' : 'text-[#C8101E]'}`} />
            <span>{isGu ? 'હવા ગુણવત્તા (AQI)' : isHi ? 'वायु गुणवत्ता (AQI)' : 'AIR QUALITY (AQI)'}</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN DASHBOARD CONTAINER (Compact, High-Density White Card) ─── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#151722] rounded-2xl rounded-tl-none border-[1.5px] border-[#FCA5A5]/80 dark:border-white/10 shadow-[0_4px_20px_rgba(200,16,30,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-4 sm:p-5 transition-all">
        {/* Subtle Top-Right Red Gradient Accent */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-64 sm:w-80 h-16 sm:h-20 bg-gradient-to-l from-[#C8101E]/15 via-[#C8101E]/5 to-transparent rounded-tr-2xl select-none z-0"
          aria-hidden="true"
        />

        {/* ── Header Row: City Name & Status (Left) + City Dropdown (Right) ── */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-5 w-5 text-[#C8101E] fill-[#C8101E] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-[#171B2D] dark:text-white tracking-tight">
                {selectedCity}
              </h2>
            </div>
            <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700 font-light select-none">|</span>
            <span className="text-xs sm:text-sm font-semibold text-[#64748B] dark:text-slate-400">
              {isGu ? 'વર્તમાન હવામાનની સ્થિતિ' : isHi ? 'वर्तमान मौसम की स्थिति' : 'Current Weather Conditions'}
            </span>
          </div>

          {/* Quick City Switcher Modern Custom Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="weather-city-select"
              aria-label="Select City"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={cn(
                "group flex items-center gap-2 bg-white dark:bg-[#1f2233] text-[#171B2D] dark:text-white border-[1.5px] rounded-full px-3.5 py-1.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer select-none",
                isDropdownOpen
                  ? "border-[#C8101E] ring-2 ring-[#C8101E]/20"
                  : "border-slate-300/90 dark:border-slate-700 hover:border-[#C8101E]"
              )}
            >
              <div className="w-5 h-5 rounded-full bg-[#C8101E]/10 dark:bg-[#C8101E]/20 flex items-center justify-center shrink-0">
                <MapPin className="h-3 w-3 text-[#C8101E]" />
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="font-black tracking-tight">{selectedCity}</span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  ({CITY_METADATA[selectedCity]?.gu || selectedCity})
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 group-hover:text-[#C8101E]",
                  isDropdownOpen && "rotate-180 text-[#C8101E]"
                )}
              />
            </button>

            {/* Custom Glassmorphism Dropdown Menu */}
            {isDropdownOpen && (
              <div
                role="listbox"
                className="absolute right-0 top-full mt-2 z-50 w-64 bg-white/95 dark:bg-[#1a1c29]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/90 rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right select-none"
              >
                {/* Header label */}
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
                  <span>{isGu ? 'શહેર પસંદ કરો' : isHi ? 'शहर चुनें' : 'Select City'}</span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                    {CITIES.length} {isGu ? 'શહેરો' : 'Cities'}
                  </span>
                </div>

                {/* Cities List */}
                <div className="space-y-1">
                  {CITIES.map((city) => {
                    const isSelected = city === selectedCity;
                    const cWeather = weatherData[city] || INITIAL_WEATHER[city];
                    const cAqi = aqiData[city] || INITIAL_AQI[city];
                    const meta = CITY_METADATA[city];

                    return (
                      <button
                        key={city}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedCity(city);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer",
                          isSelected
                            ? "bg-gradient-to-r from-[#C8101E]/10 via-[#C8101E]/5 to-transparent text-[#C8101E] dark:text-[#f87171] border-l-2 border-[#C8101E]"
                            : "hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                        )}
                      >
                        {/* City Details */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "bg-[#C8101E] text-white shadow-xs shadow-[#C8101E]/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {cWeather?.icon === 'rain' ? (
                              <CloudRain className="w-4 h-4" />
                            ) : (
                              <Sun className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 leading-tight">
                              <span
                                className={cn(
                                  "text-xs sm:text-sm truncate",
                                  isSelected ? "font-black" : "font-bold"
                                )}
                              >
                                {city}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                                {meta?.gu}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                              {isGu ? (cWeather?.descGu || 'સ્પષ્ટ આકાશ') : (cWeather?.desc || 'Clear sky')}
                            </span>
                          </div>
                        </div>

                        {/* Temp & AQI Pill + Checkmark */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end leading-none">
                            <span
                              className={cn(
                                "text-xs font-black",
                                isSelected ? "text-[#C8101E] dark:text-[#f87171]" : "text-slate-800 dark:text-white"
                              )}
                            >
                              {cWeather?.temp || '28'}°C
                            </span>
                            <span
                              style={{ color: cAqi?.color || '#16a34a' }}
                              className="text-[9px] font-black mt-0.5"
                            >
                              AQI {cAqi?.value || 42}
                            </span>
                          </div>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-[#C8101E] shrink-0 stroke-[2.5]" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── TAB 1: WEATHER & AQI DUAL DASHBOARD ─── */}
        {activeTab === 'weather' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch relative z-10">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* ── LEFT SIDE (lg:col-span-6): COMPACT WEATHER CARD ── */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 relative bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden">
              {/* Soft Watermark in Background */}
              <div className="pointer-events-none absolute right-2 bottom-1 w-28 h-28 opacity-10 select-none z-0">
                <img src="/assets/GujaratLogo.png" alt="" className="w-full h-full object-contain" />
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Left: Weather Icon + Temperature + Badge */}
                <div className="sm:col-span-7 flex items-center gap-3">
                  <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    {mainWeather.icon === 'rain' ? (
                      <CloudRain className="w-full h-full text-[#0284c7] drop-shadow-md" />
                    ) : mainWeather.icon === 'moon' ? (
                      <div className="w-full h-full flex items-center justify-center p-1">
                        <Moon className="w-full h-full text-indigo-500 fill-indigo-100 dark:fill-indigo-950/60 drop-shadow-[0_4px_12px_rgba(99,102,241,0.35)]" />
                      </div>
                    ) : mainWeather.icon === 'cloud' ? (
                      <Cloud className="w-full h-full text-slate-500 drop-shadow-md" />
                    ) : (
                      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
                        <circle cx="32" cy="28" r="14" fill="#F59E0B" />
                        <g stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round">
                          <line x1="32" y1="8" x2="32" y2="3" />
                          <line x1="32" y1="48" x2="32" y2="53" />
                          <line x1="12" y1="28" x2="7" y2="28" />
                          <line x1="52" y1="28" x2="57" y2="28" />
                          <line x1="18" y1="14" x2="14" y2="10" />
                          <line x1="46" y1="42" x2="50" y2="46" />
                          <line x1="18" y1="42" x2="14" y2="46" />
                          <line x1="46" y1="14" x2="50" y2="10" />
                        </g>
                        <path
                          d="M24 44h22a8 8 0 0 0 0-16 10 10 0 0 0-19-2 7 7 0 0 0-3 18z"
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                          strokeWidth="1.8"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-4xl sm:text-5xl font-black text-[#171B2D] dark:text-white leading-none tracking-tight">
                      {mainWeather.temp}°C
                    </span>
                    <span className="mt-1.5 self-start bg-[#C8101E] text-white text-[11px] sm:text-xs font-black px-3 py-1 rounded-full uppercase leading-none shadow-xs">
                      {isGu ? mainWeather.descGu : mainWeather.desc}
                    </span>
                  </div>
                </div>

                {/* Right: 4 Metrics in Compact 2x2 Grid */}
                <div className="sm:col-span-5 grid grid-cols-2 gap-2 sm:border-l border-slate-200 dark:border-slate-800 sm:pl-3">
                  <div className="flex flex-col bg-white dark:bg-[#1a1c29] p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Thermometer className="h-3 w-3 text-[#C8101E]" />
                      <span>{isGu ? 'મહત્તમ' : 'Max'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-xs sm:text-sm mt-0.5">
                      {mainWeather.tempMax || '32.7'}°C
                    </span>
                  </div>

                  <div className="flex flex-col bg-white dark:bg-[#1a1c29] p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Thermometer className="h-3 w-3 text-[#0284c7]" />
                      <span>{isGu ? 'ન્યૂનતમ' : 'Min'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-xs sm:text-sm mt-0.5">
                      {mainWeather.tempMin || '20.4'}°C
                    </span>
                  </div>

                  <div className="flex flex-col bg-white dark:bg-[#1a1c29] p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-[#C8101E]" />
                      <span>{isGu ? 'ભેજ' : 'Humidity'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-xs sm:text-sm mt-0.5">
                      {mainWeather.humidity}
                    </span>
                  </div>

                  <div className="flex flex-col bg-white dark:bg-[#1a1c29] p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Wind className="h-3 w-3 text-[#64748B]" />
                      <span>{isGu ? 'પવન' : 'Wind'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-xs sm:text-sm mt-0.5">
                      {mainWeather.wind}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* ── RIGHT SIDE (lg:col-span-6): AQI + 3 OTHER CITIES ── */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-2.5">
              {/* Top AQI Compact Card */}
              <div className="bg-white dark:bg-[#1a1c29] rounded-xl border border-slate-200/90 dark:border-white/10 p-3 sm:p-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Heading + Badge */}
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-[#171B2D] dark:text-white">
                      <Leaf className="h-4 w-4 text-[#C8101E]" />
                      <span>{isGu ? 'હવા ગુણવત્તા (AQI)' : 'Air Quality (AQI)'}</span>
                    </span>
                    <span
                      style={{ backgroundColor: aqiColor }}
                      className="self-start flex items-center gap-1 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase"
                    >
                      <Leaf className="h-2.5 w-2.5 fill-white" />
                      <span>{aqiBadgeLabel}</span>
                    </span>
                  </div>

                  {/* Center: AQI Number */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#171B2D] dark:text-white leading-none">
                      {mainAqi.value}
                    </span>
                    <span className="text-xs font-black text-slate-500 uppercase">AQI</span>
                  </div>

                  {/* Right: Color Scale */}
                  <div className="w-28 sm:w-36 md:w-44 flex flex-col justify-center">
                    <div className="relative w-full">
                      <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#84cc16] via-[#eab308] via-[#f97316] via-[#ef4444] to-[#a855f7]" />
                      <div
                        className="absolute -bottom-2.5 transition-all duration-500 ease-out flex flex-col items-center"
                        style={{ left: `${aqiPercentage}%`, transform: 'translateX(-50%)' }}
                      >
                        <div
                          className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px]"
                          style={{ borderBottomColor: aqiColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: 3 City Cards (Vadodara, Surat, Rajkot) */}
              <div className="grid grid-cols-3 gap-2">
                {otherCities.map((city) => {
                  const item = weatherData[city] || INITIAL_WEATHER[city];
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className="group text-left bg-white dark:bg-[#1a1c29] border border-slate-200/90 dark:border-slate-800 hover:border-[#C8101E] rounded-xl p-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
                      title={isGu ? `${city} માટે હવામાન જુઓ` : `Select ${city}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-[13px] font-black text-[#171B2D] dark:text-white group-hover:text-[#C8101E] transition-colors truncate">
                          {city}
                        </span>
                        <span className="h-4.5 w-4.5 rounded-full bg-[#C8101E] text-white flex items-center justify-center text-[10px] group-hover:scale-110 transition-transform shrink-0">
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <div className="shrink-0">
                          {item.icon === 'moon' ? (
                            <Moon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 fill-indigo-100 dark:fill-indigo-950/60 stroke-[2]" />
                          ) : item.icon === 'rain' ? (
                            <CloudRain className="h-5 w-5 sm:h-6 sm:w-6 text-sky-500 stroke-[2]" />
                          ) : item.icon === 'cloud' ? (
                            <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 stroke-[2]" />
                          ) : (
                            <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 stroke-[2] animate-[spin_20s_linear_infinite]" />
                          )}
                        </div>

                        <div className="flex flex-col items-end text-right">
                          <span className="text-xs sm:text-sm font-black text-[#171B2D] dark:text-slate-100">
                            {item.temp}°C
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            💧 {item.humidity}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ─── TAB 2: DETAILED AIR QUALITY (AQI) VIEW ─── */
          <div className="flex flex-col gap-3 relative z-10">
            {/* Top Station & City Details */}
            <div className="bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-[#C8101E] text-white shadow-xs">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#171B2D] dark:text-white flex items-center gap-2 flex-wrap">
                    <span>{selectedCity} {isGu ? 'હવા ગુણવત્તા સૂચકાંક (NAQI)' : 'National Air Quality Index'}</span>
                    <span
                      style={{ backgroundColor: aqiColor }}
                      className="text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase"
                    >
                      {aqiBadgeLabel}
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-[#C8101E] shrink-0" />
                    <span>{mainAqi.station || `${selectedCity} Central CAAQM Station`}</span>
                  </p>
                </div>
              </div>

              {/* Big Score Box */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <div
                  style={{ borderColor: aqiColor }}
                  className="px-4 py-1.5 rounded-xl border-2 bg-white dark:bg-slate-900 flex items-baseline gap-1.5 shadow-2xs"
                >
                  <span style={{ color: aqiColor }} className="text-3xl sm:text-4xl font-black">
                    {mainAqi.value}
                  </span>
                  <span className="text-xs font-black text-slate-500 uppercase">AQI</span>
                </div>
              </div>
            </div>

            {/* 6 Real CPCB Pollutants Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { key: 'pm25', name: 'PM 2.5', label: isGu ? 'અતિ સૂક્ષ્મ કણો' : 'Fine Particles', val: mainAqi.pm25, unit: 'µg/m³' },
                { key: 'pm10', name: 'PM 10', label: isGu ? 'ધૂળ અને રજકણ' : 'Coarse Particles', val: mainAqi.pm10, unit: 'µg/m³' },
                { key: 'no2', name: 'NO₂', label: isGu ? 'નાઇટ્રોજન ડાયોક્સાઇડ' : 'Nitrogen Dioxide', val: mainAqi.no2 || '15.2', unit: 'µg/m³' },
                { key: 'so2', name: 'SO₂', label: isGu ? 'સલ્ફર ડાયોક્સાઇડ' : 'Sulphur Dioxide', val: mainAqi.so2 || '12.1', unit: 'µg/m³' },
                { key: 'co', name: 'CO', label: isGu ? 'કાર્બન મોનોક્સાઇડ' : 'Carbon Monoxide', val: mainAqi.co || '0.40', unit: 'mg/m³' },
                { key: 'o3', name: 'O₃', label: isGu ? 'ઓઝોન વાયુ' : 'Ozone', val: mainAqi.o3 || '45.0', unit: 'µg/m³' },
              ].map((p) => (
                <div key={p.key} className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black text-[#C8101E] uppercase tracking-wider block">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium block truncate">{p.label}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-base sm:text-lg font-black text-[#171B2D] dark:text-white">
                      {p.val} <span className="text-[10px] font-semibold text-slate-400">{p.unit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Health Advisory Banner */}
            <div className="bg-[#FFF1F2] dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[#C8101E] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800 dark:text-slate-200">
                <span className="font-black text-[#C8101E] mr-1">
                  {isGu ? 'આરોગ્ય સલાહ:' : 'Health Advisory:'}
                </span>
                <span>{mainAqi.advisoryGu || 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ સાવચેતી રાખવી.'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── BOTTOM INFORMATION BAR (Compact, Single-Line) ─── */}
        <div className="relative z-10 border-t border-slate-100 dark:border-white/10 pt-2.5 mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs select-none">
          {/* Left: Link to Full Details */}
          <Link
            href={`/aqi?city=${encodeURIComponent(selectedCity)}`}
            className="group flex items-center gap-1 font-black text-[#C8101E] hover:text-[#A80F19] transition-colors cursor-pointer"
            title={isGu ? `${selectedCity} માટે સંપૂર્ણ હવામાન અને AQI વિગતો જુઓ` : `View complete Weather & AQI details for ${selectedCity}`}
          >
            <span>{isGu ? 'સંપૂર્ણ હવામાન & AQI વિગતો જુઓ' : 'View Full Weather & AQI Details'}</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          {/* Right: Refresh Icon + Last Updated Timestamp */}
          <div className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#C8101E] font-bold transition-colors cursor-pointer disabled:opacity-50"
              title={isGu ? 'તાજી માહિતી રિફ્રેશ કરો' : 'Refresh live data'}
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (isGu ? 'અપડેટ થાય છે...' : 'Refreshing...') : isGu ? 'છેલ્લું અપડેટ:' : 'Last Update:'}</span>
            </button>
            <span className="font-bold text-[#171B2D] dark:text-white">
              {lastUpdateStr || formatCurrentTimestamp()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">({isGu ? 'સ્થાનિક સમય IST' : 'IST'})</span>
          </div>
        </div>
      </div>
    </section>
  );
}
