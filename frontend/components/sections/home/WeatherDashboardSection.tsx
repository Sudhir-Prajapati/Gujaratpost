'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
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

// Fallback data if API is loading or network is offline
const INITIAL_WEATHER: Record<string, WeatherCity> = {
  Ahmedabad: {
    temp: '29.6',
    tempMax: '33.7',
    tempMin: '21.6',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '34%',
    wind: '6 km/h',
  },
  Vadodara: {
    temp: '29.4',
    tempMax: '33.4',
    tempMin: '20.8',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '36%',
    wind: '5 km/h',
  },
  Surat: {
    temp: '30.9',
    tempMax: '34.6',
    tempMin: '20.8',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '34%',
    wind: '5 km/h',
  },
  Rajkot: {
    temp: '30.2',
    tempMax: '33.5',
    tempMin: '21.3',
    desc: 'Clear sky',
    descGu: 'સ્પષ્ટ આકાશ',
    icon: 'sun',
    humidity: '33%',
    wind: '5 km/h',
  },
};

const INITIAL_AQI: Record<string, AqiCity> = {
  Ahmedabad: {
    value: 83,
    label: 'Satisfactory',
    labelGu: 'સંતોષકારક',
    category: 'Satisfactory',
    categoryGu: 'સંતોષકારક',
    color: '#65a30d',
    lightColor: '#f7fee7',
    station: 'પીરાણા / મણિનગર - GPCB CAAQM સ્ટેશન, અમદાવાદ',
    stationEn: 'Pirana / Maninagar - GPCB CAAQM Station, Ahmedabad',
    pm25: 49.7,
    pm10: 59.1,
    no2: 17.1,
    so2: 14.6,
    co: 0.46,
    o3: 117,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ વધુ પડતો શ્રમ ટાળવો.',
  },
  Vadodara: {
    value: 84,
    label: 'Satisfactory',
    labelGu: 'સંતોષકારક',
    category: 'Satisfactory',
    categoryGu: 'સંતોષકારક',
    color: '#65a30d',
    lightColor: '#f7fee7',
    station: 'દાંડિયા બજાર / જીઆઇડીસી - GPCB CAAQM સ્ટેશન, વડોદરા',
    stationEn: 'Dandia Bazar / GIDC - GPCB CAAQM Station, Vadodara',
    pm25: 50.6,
    pm10: 61.0,
    no2: 12.8,
    so2: 9.2,
    co: 0.45,
    o3: 124,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ વધુ પડતો શ્રમ ટાળવો.',
  },
  Surat: {
    value: 95,
    label: 'Satisfactory',
    labelGu: 'સંતોષકારક',
    category: 'Satisfactory',
    categoryGu: 'સંતોષકારક',
    color: '#65a30d',
    lightColor: '#f7fee7',
    station: 'કતારગામ / વરાછા - GPCB CAAQM સ્ટેશન, સુરત',
    stationEn: 'Katargam / Varachha - GPCB CAAQM Station, Surat',
    pm25: 57.2,
    pm10: 64.5,
    no2: 41.8,
    so2: 90.0,
    co: 0.39,
    o3: 81,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ વધુ પડતો શ્રમ ટાળવો.',
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
    o3: 107,
    dominant: 'pm25',
    advisoryGu: 'હવાની ગુણવત્તા ઉત્તમ છે. સ્વાસ્થ્ય માટે કોઈ જોખમ નથી.',
  },
};

const CITIES = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'];

export default function WeatherDashboardSection({ language }: { language: Language }) {
  const [activeTab, setActiveTab] = useState<'weather' | 'aqi'>('weather');
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [weatherData, setWeatherData] = useState<Record<string, WeatherCity>>(INITIAL_WEATHER);
  const [aqiData, setAqiData] = useState<Record<string, AqiCity>>(INITIAL_AQI);
  const [lastUpdateStr, setLastUpdateStr] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  const isGu = language === 'gu';
  const isHi = language === 'hi';

  const formatCurrentTimestamp = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  const fetchLiveData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      const url = forceRefresh ? '/api/weather-multi?refresh=1' : '/api/weather-multi';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          const { weatherData: wData, aqiData: aData, updatedAtFormatted } = json.data;
          startTransition(() => {
            if (wData && Object.keys(wData).length > 0) {
              setWeatherData((prev) => ({ ...prev, ...wData }));
            }
            if (aData && Object.keys(aData).length > 0) {
              setAqiData((prev) => ({ ...prev, ...aData }));
            }
            if (updatedAtFormatted) {
              setLastUpdateStr(updatedAtFormatted);
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
    fetchLiveData(false);
    setLastUpdateStr(formatCurrentTimestamp());

    // Auto-refresh every 15 minutes as requested
    const interval = setInterval(() => {
      fetchLiveData(false);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchLiveData, formatCurrentTimestamp]);

  const mainWeather = weatherData[selectedCity] || weatherData.Ahmedabad || INITIAL_WEATHER.Ahmedabad;
  const mainAqi = aqiData[selectedCity] || aqiData.Ahmedabad || INITIAL_AQI.Ahmedabad;
  const otherCities = CITIES.filter((c) => c !== selectedCity);

  // Helper for dynamic AQI gauge indicator position (0 to 500 range, mapped 2% to 98%)
  const aqiVal = typeof mainAqi.value === 'number' ? mainAqi.value : 80;
  const aqiPercentage = Math.min(98, Math.max(2, (aqiVal / 500) * 100));

  // Determine category badge background and text
  const aqiColor = mainAqi.color || (aqiVal <= 50 ? '#16a34a' : aqiVal <= 100 ? '#65a30d' : aqiVal <= 200 ? '#ca8a04' : aqiVal <= 300 ? '#ea580c' : '#dc2626');
  const aqiBadgeLabel = isGu
    ? `${mainAqi.labelGu || 'સારું'} (${mainAqi.label || 'Good'})`
    : isHi
      ? `${mainAqi.labelGu || 'अच्छा'} (${mainAqi.label || 'Good'})`
      : `${mainAqi.label || 'Good'}`;

  return (
    <section className="mx-auto max-w-screen-xl px-3 sm:px-4 py-2 mt-2 select-none" aria-label="Gujarat Post Weather and AQI Dashboard">
      {/* ─── TOP TABS (Branded Gujarat Post Red #C8101E Active Tab) ─── */}
      <div className="flex items-end">
        <div className="inline-flex items-end gap-1.5 relative z-10 -mb-[1px]">
          {/* Tab 1: Weather */}
          <button
            type="button"
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black transition-all rounded-t-xl tracking-wide select-none cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-[#C8101E] text-white shadow-md border-t border-x border-[#C8101E]'
                : 'bg-white dark:bg-slate-900 text-[#171B2D] dark:text-slate-200 border-t border-x border-slate-300 dark:border-slate-800 hover:text-[#C8101E]'
            }`}
          >
            <Sun className={`h-4 w-4 ${activeTab === 'weather' ? 'text-white' : 'text-[#C8101E]'}`} />
            <span>{isGu ? 'હવામાન' : isHi ? 'मौसम' : 'WEATHER'}</span>
          </button>

          {/* Tab 2: AQI */}
          <button
            type="button"
            onClick={() => setActiveTab('aqi')}
            className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black transition-all rounded-t-xl tracking-wide select-none cursor-pointer ${
              activeTab === 'aqi'
                ? 'bg-[#C8101E] text-white shadow-md border-t border-x border-[#C8101E]'
                : 'bg-white dark:bg-slate-900 text-[#171B2D] dark:text-slate-200 border-t border-x border-slate-300 dark:border-slate-800 hover:text-[#C8101E]'
            }`}
          >
            <Wind className={`h-4 w-4 ${activeTab === 'aqi' ? 'text-white' : 'text-[#C8101E]'}`} />
            <span>{isGu ? 'હવા ગુણવત્તા (AQI)' : isHi ? 'वायु गुणवत्ता (AQI)' : 'AIR QUALITY (AQI)'}</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN DASHBOARD CONTAINER (White Card with Thin Red Accent Border & Header Wave) ─── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#151722] rounded-2xl rounded-tl-none border border-[#FCA5A5]/70 dark:border-white/10 shadow-[0_4px_22px_rgba(200,16,30,0.06)] dark:shadow-[0_4px_22px_rgba(0,0,0,0.5)] p-4 sm:p-5 md:p-6 transition-all">
        {/* Subtle Arched Red Header Accent (Top Right Curve as in Design Reference Image 2) */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-64 sm:w-80 md:w-96 h-14 sm:h-16 bg-gradient-to-l from-[#C8101E]/85 via-[#C8101E]/45 to-transparent rounded-tr-2xl opacity-90 select-none z-0"
          style={{ clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 0%)' }}
        />

        {/* ─── TOP HEADER BAR: City Selector Dropdown (Top-Right) ─── */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-4 sm:mb-5">
          {/* Active Tab Heading / Category Context */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C8101E] animate-pulse" />
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-[#C8101E]">
              {activeTab === 'weather'
                ? isGu
                  ? 'ગુજરાત લાઇવ હવામાન અપડેટ'
                  : 'Gujarat Live Weather Update'
                : isGu
                  ? 'CPCB અધિકૃત હવા ગુણવત્તા સૂચકાંક (AQI)'
                  : 'CPCB Official Air Quality Index (NAQI)'}
            </span>
          </div>

          {/* City Selection Dropdown (Top Right Pill Selector) */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#1f2233] text-[#171B2D] dark:text-white border border-slate-300 dark:border-slate-700 hover:border-[#C8101E] rounded-full px-3.5 py-1.5 shadow-xs transition-colors cursor-pointer">
              <MapPin className="h-3.5 w-3.5 text-[#C8101E] shrink-0" />
              <select
                id="weather-city-select"
                aria-label="Select City"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="appearance-none bg-transparent text-xs sm:text-sm font-black pr-5 focus:outline-none cursor-pointer"
              >
                <option value="Ahmedabad" className="text-slate-900 dark:text-slate-100">Ahmedabad (અમદાવાદ)</option>
                <option value="Vadodara" className="text-slate-900 dark:text-slate-100">Vadodara (વડોદરા)</option>
                <option value="Surat" className="text-slate-900 dark:text-slate-100">Surat (સુરત)</option>
                <option value="Rajkot" className="text-slate-900 dark:text-slate-100">Rajkot (રાજકોટ)</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ─── TAB 1: WEATHER VIEW (Dual Column Layout Matching Reference Image 2) ─── */}
        {activeTab === 'weather' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {/* ── LEFT COLUMN (Approx 48% Width): Selected City Weather Details ── */}
            <div className="lg:col-span-6 relative flex flex-col justify-between rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] p-4 sm:p-5 overflow-hidden">
              {/* Background Watermark: Gujarat Map Silhouette */}
              <div className="pointer-events-none absolute -right-2 top-2 w-32 sm:w-36 h-32 sm:h-36 opacity-15 select-none z-0">
                <img
                  src="/assets/GujaratLogo.png"
                  alt=""
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>

              {/* City Title and Gujarati Subtitle */}
              <div className="relative z-10">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-5 w-5 text-[#C8101E] fill-[#C8101E]/10 shrink-0" />
                  <h2 className="text-xl sm:text-2xl font-black text-[#171B2D] dark:text-white tracking-tight">
                    {selectedCity}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#64748B] dark:text-slate-400 mt-1 pl-6">
                  {isGu ? 'વર્તમાન હવામાનની સ્થિતિ' : isHi ? 'वर्तमान मौसम की स्थिति' : 'Current Weather Conditions'}
                </p>
              </div>

              {/* Middle Row: Big Temperature + Weather Icon + 4 Metrics */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-3 sm:my-4">
                {/* Left Part: 3D Sun Icon + Big Temp + Condition Badge */}
                <div className="sm:col-span-6 flex items-center gap-3 sm:gap-4">
                  {/* Rich Weather Graphic Icon */}
                  <div className="relative shrink-0">
                    {mainWeather.icon === 'rain' ? (
                      <CloudRain className="h-14 w-14 sm:h-16 sm:w-16 text-[#0284c7] drop-shadow-md" />
                    ) : mainWeather.icon === 'cloud' ? (
                      <Cloud className="h-14 w-14 sm:h-16 sm:w-16 text-slate-500 drop-shadow-md" />
                    ) : (
                      /* Radiant Sun with Soft Cloud (Matching Image 2 Reference) */
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                          {/* Sun Rays */}
                          <circle cx="32" cy="28" r="14" fill="#F59E0B" />
                          <g stroke="#F59E0B" strokeWidth="3" strokeLinecap="round">
                            <line x1="32" y1="8" x2="32" y2="4" />
                            <line x1="32" y1="48" x2="32" y2="52" />
                            <line x1="12" y1="28" x2="8" y2="28" />
                            <line x1="52" y1="28" x2="56" y2="28" />
                            <line x1="18" y1="14" x2="15" y2="11" />
                            <line x1="46" y1="42" x2="49" y2="45" />
                            <line x1="18" y1="42" x2="15" y2="45" />
                            <line x1="46" y1="14" x2="49" y2="11" />
                          </g>
                          {/* Soft 3D White Cloud Overlapping Lower Sun */}
                          <path
                            d="M24 44h22a8 8 0 0 0 0-16 10 10 0 0 0-19-2 7 7 0 0 0-3 18z"
                            fill="#FFFFFF"
                            stroke="#E2E8F0"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Temperature & Condition Pill */}
                  <div className="flex flex-col">
                    <span className="text-3xl sm:text-4xl md:text-[40px] font-black text-[#171B2D] dark:text-white leading-none tracking-tight">
                      {mainWeather.temp}°C
                    </span>
                    <span className="mt-2 self-start bg-[#C8101E] text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase leading-none shadow-xs">
                      {isGu ? mainWeather.descGu : mainWeather.desc}
                    </span>
                  </div>
                </div>

                {/* Right Part: 4 Compact Weather Metrics Stack */}
                <div className="sm:col-span-6 flex flex-col justify-center gap-1.5 sm:border-l border-slate-200 dark:border-slate-800 sm:pl-4">
                  {/* Metric 1: Max Temp */}
                  <div className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                      <Thermometer className="h-3.5 w-3.5 text-[#C8101E]" />
                      <span>{isGu ? 'મહત્તમ (Max)' : 'Max Temp'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white">
                      {mainWeather.tempMax || '32.7'}°C
                    </span>
                  </div>

                  {/* Metric 2: Min Temp */}
                  <div className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                      <Thermometer className="h-3.5 w-3.5 text-[#0284c7]" />
                      <span>{isGu ? 'ન્યૂનતમ (Min)' : 'Min Temp'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white">
                      {mainWeather.tempMin || '20.4'}°C
                    </span>
                  </div>

                  {/* Metric 3: Humidity */}
                  <div className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                      <Droplets className="h-3.5 w-3.5 text-[#C8101E]" />
                      <span>{isGu ? 'ભેજ (Humidity)' : 'Humidity'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white">
                      {mainWeather.humidity}
                    </span>
                  </div>

                  {/* Metric 4: Wind */}
                  <div className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                      <Wind className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      <span>{isGu ? 'પવન (Wind)' : 'Wind'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white">
                      {mainWeather.wind}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Architectural Monument Illustration + Bottom Wave Ribbon */}
              <div className="relative mt-2 pt-2 flex items-end justify-between overflow-hidden">
                {/* Left notice / App link */}
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>{isGu ? 'ગુજરાત પોસ્ટ હવામાન કેન્દ્ર' : 'Gujarat Post Weather Station'}</span>
                </div>

                {/* Ahmedabad Heritage Monument Silhouette (Right Corner) */}
                <div className="relative h-12 sm:h-14 w-auto shrink-0 select-none pointer-events-none">
                  <img
                    src="/assets/ahmedabad-weather-monument.png"
                    alt="Gujarat Monument"
                    className="h-full w-auto object-contain opacity-85 dark:opacity-70 filter contrast-125"
                  />
                </div>
              </div>

              {/* Bottom Red & Gold Wave Ribbon Line (Matching Reference Image 2) */}
              <div
                className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#F59E0B] via-[#C8101E] to-[#A80F19]"
                aria-hidden="true"
              />
            </div>

            {/* ── RIGHT COLUMN (Approx 52% Width): AQI Summary Card + 3 Other City Cards ── */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-3.5">
              {/* Top AQI Summary Box */}
              <div className="relative bg-white dark:bg-[#1a1c29] rounded-xl border border-slate-200/90 dark:border-white/10 p-3 sm:p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                  {/* AQI Title + Category Pill */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1 font-black text-sm sm:text-base text-[#171B2D] dark:text-white">
                      <Leaf className="h-4 w-4 text-[#C8101E]" />
                      <span>{isGu ? 'હવા ગુણવત્તા (AQI)' : 'Air Quality (AQI)'}</span>
                    </span>

                    {/* Category Badge Pill with dynamic color */}
                    <span
                      style={{ backgroundColor: aqiColor }}
                      className="flex items-center gap-1 text-white text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide"
                    >
                      <Leaf className="h-3 w-3 fill-white" />
                      <span>{aqiBadgeLabel}</span>
                    </span>
                  </div>

                  {/* Vertical Divider (Desktop) */}
                  <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700 font-light select-none">|</span>

                  {/* Big AQI Number */}
                  <div className="flex items-baseline gap-1 self-start sm:self-auto">
                    <span className="text-2xl sm:text-3xl font-black text-[#171B2D] dark:text-white leading-none">
                      {mainAqi.value}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      AQI
                    </span>
                  </div>
                </div>

                {/* Horizontal Color-Coded AQI Scale Bar with Dynamic Indicator Arrow */}
                <div className="mt-3 pt-1">
                  <div className="relative w-full">
                    {/* Continuous Gradient Bar: Green -> Yellow -> Orange -> Red -> Dark Red */}
                    <div className="h-2 sm:h-2.5 w-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#84cc16] via-[#eab308] via-[#f97316] via-[#ef4444] to-[#7f1d1d] shadow-inner" />

                    {/* Indicator Marker Pointer directly beneath the current AQI value */}
                    <div
                      className="absolute -top-1 transition-all duration-500 ease-out flex flex-col items-center"
                      style={{ left: `${aqiPercentage}%`, transform: 'translateX(-50%)' }}
                    >
                      {/* Triangle Pointer */}
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-[#171B2D] dark:border-b-white" />
                      <div className="w-2 h-2 rounded-full bg-[#171B2D] dark:bg-white shadow-xs" />
                    </div>
                  </div>

                  {/* Sub-labels under the scale */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-2 px-0.5">
                    <span>0 {isGu ? 'સારી' : 'Good'}</span>
                    <span>100 {isGu ? 'સંતોષકારક' : 'Satisfactory'}</span>
                    <span>200 {isGu ? 'સાધારણ' : 'Moderate'}</span>
                    <span>300 {isGu ? 'ખરાબ' : 'Poor'}</span>
                    <span>500 {isGu ? 'ગંભીર' : 'Severe'}</span>
                  </div>
                </div>
              </div>

              {/* 3 Other City Cards in a Horizontal Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {otherCities.map((city) => {
                  const item = weatherData[city] || INITIAL_WEATHER[city];
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className="group text-left bg-white dark:bg-[#1a1c29] border border-red-100/90 dark:border-slate-800 hover:border-[#C8101E] rounded-xl p-3 sm:p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer select-none"
                      title={isGu ? `${city} માટે હવામાન જુઓ` : `Select ${city}`}
                    >
                      {/* Card Header: City Name + Red Round Arrow */}
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] sm:text-sm font-black text-[#171B2D] dark:text-white group-hover:text-[#C8101E] transition-colors">
                          {city}
                        </span>
                        <span className="h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-full bg-[#C8101E] text-white flex items-center justify-center text-[10px] group-hover:scale-110 transition-transform shadow-xs">
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>

                      {/* Card Body: Sun Icon + Temp & Humidity */}
                      <div className="flex items-center justify-between mt-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Weather Icon in warm amber */}
                        <div className="text-amber-500 shrink-0">
                          <Sun className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.2] animate-[spin_20s_linear_infinite]" />
                        </div>

                        {/* Temp and Humidity Stack */}
                        <div className="flex flex-col items-end text-right">
                          <span className="text-xs sm:text-[13px] font-black text-[#171B2D] dark:text-slate-100 flex items-center gap-0.5">
                            <Thermometer className="h-3 w-3 text-[#C8101E]" />
                            {item.temp}°C
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5 mt-0.5">
                            <Droplets className="h-3 w-3 text-[#C8101E]" />
                            {item.humidity}
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
          /* ─── TAB 2: DETAILED AIR QUALITY (AQI) VIEW WITH REAL POLLUTANTS ─── */
          <div className="flex flex-col gap-4">
            {/* Top Station & City Details */}
            <div className="bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-[#C8101E] text-white">
                    <Activity className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-[#171B2D] dark:text-white flex items-center gap-2">
                      <span>{selectedCity} {isGu ? 'હવા ગુણવત્તા સૂચકાંક (NAQI)' : 'National Air Quality Index'}</span>
                      <span
                        style={{ backgroundColor: aqiColor }}
                        className="text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase"
                      >
                        {aqiBadgeLabel}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-[#C8101E] shrink-0" />
                      <span>{mainAqi.station || `${selectedCity} Central CAAQM Station`}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Big Score Box */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div
                  style={{ borderColor: aqiColor }}
                  className="px-4 py-2 rounded-xl border-2 bg-white dark:bg-slate-900 flex items-baseline gap-1.5 shadow-xs"
                >
                  <span style={{ color: aqiColor }} className="text-3xl sm:text-4xl font-black">
                    {mainAqi.value}
                  </span>
                  <span className="text-xs font-black text-slate-500 uppercase">AQI</span>
                </div>
              </div>
            </div>

            {/* 6 Real CPCB Pollutants Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Pollutant 1: PM2.5 */}
              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-[#C8101E] uppercase tracking-wider block">PM 2.5</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{isGu ? 'અતિ સૂક્ષ્મ કણો' : 'Fine Particles'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-black text-[#171B2D] dark:text-white">
                    {mainAqi.pm25} <span className="text-[10px] font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              {/* Pollutant 2: PM10 */}
              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-[#C8101E] uppercase tracking-wider block">PM 10</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{isGu ? 'ધૂળ અને રજકણ' : 'Coarse Particles'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-black text-[#171B2D] dark:text-white">
                    {mainAqi.pm10} <span className="text-[10px] font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              {/* Pollutant 3: NO2 */}
              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-[#C8101E] uppercase tracking-wider block">NO₂</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{isGu ? 'નાઇટ્રોજન ડાયોક્સાઇડ' : 'Nitrogen Dioxide'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-black text-[#171B2D] dark:text-white">
                    {mainAqi.no2 || '17.1'} <span className="text-[10px] font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              {/* Pollutant 4: SO2 */}
              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-[#C8101E] uppercase tracking-wider block">SO₂</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{isGu ? 'સલ્ફર ડાયોક્સાઇડ' : 'Sulphur Dioxide'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-black text-[#171B2D] dark:text-white">
                    {mainAqi.so2 || '14.6'} <span className="text-[10px] font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              {/* Pollutant 5: CO */}
              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-[#C8101E] uppercase tracking-wider block">CO</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{isGu ? 'કાર્બન મોનોક્સાઇડ' : 'Carbon Monoxide'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-black text-[#171B2D] dark:text-white">
                    {mainAqi.co || '0.46'} <span className="text-[10px] font-semibold text-slate-400">mg/m³</span>
                  </span>
                </div>
              </div>

              {/* Pollutant 6: O3 */}
              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-[#C8101E] uppercase tracking-wider block">O₃</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{isGu ? 'ઓઝોન વાયુ' : 'Ozone'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-black text-[#171B2D] dark:text-white">
                    {mainAqi.o3 || '117'} <span className="text-[10px] font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Health Advisory Banner */}
            <div className="bg-[#FFF1F2] dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3 sm:p-3.5 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-[#C8101E] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200">
                <span className="font-black text-[#C8101E] mr-1">
                  {isGu ? 'આરોગ્ય સલાહ:' : 'Health Advisory:'}
                </span>
                <span>{mainAqi.advisoryGu || 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ સાવચેતી રાખવી.'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── BOTTOM INFORMATION BAR (Links to Full AQI Page + Real-time Refresh) ─── */}
        <div className="relative z-10 border-t border-slate-200/80 dark:border-white/10 pt-3 mt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 select-none">
          {/* Left Link: Direct to Detailed /aqi page */}
          <Link
            href={`/aqi?city=${encodeURIComponent(selectedCity)}`}
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#C8101E] hover:text-[#A80F19] transition-colors cursor-pointer"
            title={isGu ? `${selectedCity} માટે સંપૂર્ણ હવામાન અને AQI વિગતો જુઓ` : `View complete Weather & AQI details for ${selectedCity}`}
          >
            <span>{isGu ? 'સંપૂર્ણ હવામાન & AQI વિગતો જુઓ' : 'View Full Weather & AQI Details'}</span>
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          {/* Right Info: Refresh Button + Real Timestamp */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[#C8101E] font-black transition-colors cursor-pointer disabled:opacity-50"
              title={isGu ? 'તાજી માહિતી રિફ્રેશ કરો' : 'Refresh live data'}
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (isGu ? 'અપડેટ થાય છે...' : 'Refreshing...') : isGu ? 'છેલ્લું અપડેટ:' : 'Last Update:'}</span>
            </button>
            <span className="text-slate-600 dark:text-slate-300 font-bold">
              {lastUpdateStr || '2026-11-13 10:22'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">(local time)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
