'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Sun,
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
    <section className="mx-auto max-w-screen-xl px-2.5 sm:px-4 py-2 mt-2 select-none" aria-label="Gujarat Post Weather and AQI Dashboard">
      {/* ─── TOP TABS (Connected Directly to Main Card, Matching Reference Image 2) ─── */}
      <div className="flex items-end">
        <div className="inline-flex items-end relative z-10 -mb-[1px]">
          {/* Tab 1: Weather (Active: Solid Red #C8101E, Rounded Top, Seamless Shoulder) */}
          <button
            type="button"
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-6 sm:px-8 py-3 text-sm sm:text-[15px] font-black transition-all rounded-t-2xl tracking-wide select-none cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-[#C8101E] text-white shadow-md border-t-2 border-x-2 border-[#C8101E]'
                : 'bg-white dark:bg-[#1a1c29] text-[#171B2D] dark:text-slate-200 border-t border-x border-slate-300 dark:border-slate-800 hover:text-[#C8101E]'
            }`}
          >
            <Sun className={`h-4.5 w-4.5 ${activeTab === 'weather' ? 'text-white' : 'text-[#C8101E]'}`} />
            <span>{isGu ? 'હવામાન' : isHi ? 'मौसम' : 'WEATHER'}</span>
          </button>

          {/* Tab 2: AQI (Inactive: Clean White Surface, Dark Text) */}
          <button
            type="button"
            onClick={() => setActiveTab('aqi')}
            className={`flex items-center gap-2 px-6 sm:px-8 py-3 text-sm sm:text-[15px] font-black transition-all rounded-t-2xl tracking-wide select-none cursor-pointer ${
              activeTab === 'aqi'
                ? 'bg-[#C8101E] text-white shadow-md border-t-2 border-x-2 border-[#C8101E]'
                : 'bg-white dark:bg-[#1a1c29] text-[#171B2D] dark:text-slate-200 border-t border-x border-slate-300 dark:border-slate-800 hover:text-[#C8101E]'
            }`}
          >
            <Wind className={`h-4.5 w-4.5 ${activeTab === 'aqi' ? 'text-white' : 'text-[#C8101E]'}`} />
            <span>{isGu ? 'હવા ગુણવત્તા (AQI)' : isHi ? 'वायु गुणवत्ता (AQI)' : 'AIR QUALITY (AQI)'}</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN DASHBOARD CONTAINER (White Card with Thin Red Outline & Curved Red Accents) ─── */}
      <div className="relative overflow-hidden bg-white dark:bg-[#151722] rounded-[24px] sm:rounded-[28px] rounded-tl-none border-[1.5px] border-[#FCA5A5]/80 dark:border-white/10 shadow-[0_6px_30px_rgba(200,16,30,0.07)] dark:shadow-[0_6px_30px_rgba(0,0,0,0.5)] p-5 sm:p-7 md:p-8 transition-all">
        {/* ── Top-Right Curved Red Gradient Swoosh Banner (Exact Match to Reference Image 2) ── */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-80 sm:w-96 md:w-[460px] h-20 sm:h-24 bg-gradient-to-l from-[#C8101E] via-[#A80F19] to-transparent rounded-tr-[24px] sm:rounded-tr-[28px] opacity-95 select-none z-0"
          style={{ clipPath: 'ellipse(100% 100% at 100% 0%)' }}
          aria-hidden="true"
        />

        {/* ── City Selector Dropdown (Top Right, Framing the Red Header Banner) ── */}
        <div className="relative z-10 flex items-center justify-end mb-4 sm:mb-6">
          <div className="relative">
            <div className="flex items-center gap-2 bg-white dark:bg-[#1f2233] text-[#171B2D] dark:text-white border-[1.5px] border-slate-300/90 dark:border-slate-700 hover:border-[#C8101E] rounded-full px-4 sm:px-5 py-2 shadow-sm transition-all cursor-pointer">
              <MapPin className="h-4 w-4 text-[#C8101E] shrink-0" />
              <select
                id="weather-city-select"
                aria-label="Select City"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="appearance-none bg-transparent text-sm sm:text-[15px] font-black pr-6 focus:outline-none cursor-pointer"
              >
                <option value="Ahmedabad" className="text-slate-900 dark:text-slate-100">Ahmedabad</option>
                <option value="Vadodara" className="text-slate-900 dark:text-slate-100">Vadodara</option>
                <option value="Surat" className="text-slate-900 dark:text-slate-100">Surat</option>
                <option value="Rajkot" className="text-slate-900 dark:text-slate-100">Rajkot</option>
              </select>
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400 absolute right-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ─── TAB 1: WEATHER & AQI DUAL DASHBOARD (Exact Composition of Image 2) ─── */}
        {activeTab === 'weather' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* ── LEFT SIDE (~48% Width): LARGE PROMINENT WEATHER PRESENTATION ── */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 relative flex flex-col justify-between min-h-[320px] sm:min-h-[350px]">
              {/* Soft Pink Gujarat State Map Outline Watermark behind city header */}
              <div className="pointer-events-none absolute right-4 sm:right-10 top-0 w-36 sm:w-44 h-36 sm:h-44 opacity-25 select-none z-0">
                <img
                  src="/assets/GujaratLogo.png"
                  alt=""
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>

              {/* City Title and Gujarati Subtitle */}
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-[#C8101E] fill-[#C8101E] shrink-0" />
                  <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#171B2D] dark:text-white tracking-tight">
                    {selectedCity}
                  </h2>
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#64748B] dark:text-slate-400 mt-1 pl-8">
                  {isGu ? 'વર્તમાન હવામાનની સ્થિતિ' : isHi ? 'वर्तमान मौसम की स्थिति' : 'Current Weather Conditions'}
                </p>
              </div>

              {/* Center Row: Massive Temperature + Sun/Cloud Icon + 4 Vertical Metrics */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-6 items-center my-4 sm:my-6">
                {/* Left Part: 3D Sun Icon + Giant Temperature + Red Badge */}
                <div className="sm:col-span-7 flex items-center gap-4 sm:gap-5">
                  {/* Big Vibrant 3D Sun with Soft Overlapping Cloud */}
                  <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 flex items-center justify-center">
                    {mainWeather.icon === 'rain' ? (
                      <CloudRain className="w-full h-full text-[#0284c7] drop-shadow-lg" />
                    ) : mainWeather.icon === 'cloud' ? (
                      <Cloud className="w-full h-full text-slate-500 drop-shadow-lg" />
                    ) : (
                      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_4px_16px_rgba(245,158,11,0.45)]">
                        {/* Radiant Sun Rays */}
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
                        {/* Soft Fluffy 3D Cloud Overlapping Lower Sun */}
                        <path
                          d="M24 44h22a8 8 0 0 0 0-16 10 10 0 0 0-19-2 7 7 0 0 0-3 18z"
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                          strokeWidth="1.8"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Giant Temperature & Solid Red Pill Badge */}
                  <div className="flex flex-col">
                    <span className="text-5xl sm:text-6xl lg:text-[72px] font-black text-[#171B2D] dark:text-white leading-none tracking-tight">
                      {mainWeather.temp}°C
                    </span>
                    <span className="mt-2.5 self-start bg-[#C8101E] text-white text-xs sm:text-[13px] font-black px-4 sm:px-5 py-1.5 rounded-full uppercase leading-none shadow-sm">
                      {isGu ? mainWeather.descGu : mainWeather.desc}
                    </span>
                  </div>
                </div>

                {/* Right Part: 4 Large Supporting Weather Metrics */}
                <div className="sm:col-span-5 flex flex-col justify-center gap-2.5 sm:border-l border-slate-200/90 dark:border-slate-800 sm:pl-5">
                  {/* Metric 1: Max Temp */}
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="flex items-center gap-2 text-[#171B2D] dark:text-slate-300 font-bold">
                      <Thermometer className="h-4.5 w-4.5 text-[#C8101E] shrink-0" />
                      <span>{isGu ? 'મહત્તમ (Max)' : 'Max'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-base sm:text-lg">
                      {mainWeather.tempMax || '32.7'}°C
                    </span>
                  </div>

                  {/* Metric 2: Min Temp */}
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="flex items-center gap-2 text-[#171B2D] dark:text-slate-300 font-bold">
                      <Thermometer className="h-4.5 w-4.5 text-[#0284c7] shrink-0" />
                      <span>{isGu ? 'ન્યૂનતમ (Min)' : 'Min'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-base sm:text-lg">
                      {mainWeather.tempMin || '20.4'}°C
                    </span>
                  </div>

                  {/* Metric 3: Humidity */}
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="flex items-center gap-2 text-[#171B2D] dark:text-slate-300 font-bold">
                      <Droplets className="h-4.5 w-4.5 text-[#C8101E] shrink-0" />
                      <span>{isGu ? 'ભેજ (Humidity)' : 'Humidity'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-base sm:text-lg">
                      {mainWeather.humidity}
                    </span>
                  </div>

                  {/* Metric 4: Wind */}
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="flex items-center gap-2 text-[#171B2D] dark:text-slate-300 font-bold">
                      <Wind className="h-4.5 w-4.5 text-[#64748B] shrink-0" />
                      <span>{isGu ? 'પવન (Wind)' : 'Wind'}</span>
                    </span>
                    <span className="font-black text-[#171B2D] dark:text-white text-base sm:text-lg">
                      {mainWeather.wind}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Architectural Illustration & Sweeping Red/Gold Ribbon Wave */}
              <div className="relative mt-2 flex items-end justify-between overflow-visible">
                <div className="flex-1" />
                {/* Gujarat Heritage Architectural Monument (Positioned behind/above the wave) */}
                <div className="relative h-16 sm:h-20 lg:h-24 w-auto shrink-0 select-none pointer-events-none -mb-3 z-10">
                  <img
                    src="/assets/ahmedabad-weather-monument.png"
                    alt="Gujarat Monument"
                    className="h-full w-auto object-contain opacity-90 dark:opacity-75 filter contrast-125"
                  />
                </div>
              </div>

              {/* Lower-Left Elegant Curved Red and Gold Ribbon Wave (Matching Image 2) */}
              <div
                className="pointer-events-none absolute -bottom-5 sm:-bottom-7 -left-5 sm:-left-7 w-72 sm:w-96 md:w-[420px] h-10 sm:h-12 bg-gradient-to-r from-[#F59E0B] via-[#C8101E] to-[#A80F19] rounded-bl-[24px] sm:rounded-bl-[28px] opacity-95 select-none z-0"
                style={{ clipPath: 'ellipse(100% 100% at 0% 100%)' }}
                aria-hidden="true"
              />
            </div>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* ── RIGHT SIDE (~52% Width): PROMINENT AQI PANEL + 3 CITY CARDS ── */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-5 sm:gap-6">
              {/* ── Top Prominent AQI Panel Card ── */}
              <div className="relative bg-white dark:bg-[#1a1c29] rounded-[20px] border-[1.5px] border-slate-200/90 dark:border-white/10 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: AQI Heading + Category Pill Badge */}
                  <div className="flex flex-col gap-2">
                    <span className="flex items-center gap-2 font-black text-base sm:text-lg text-[#171B2D] dark:text-white">
                      <Leaf className="h-5 w-5 text-[#C8101E]" />
                      <span>{isGu ? 'હવા ગુણવત્તા (AQI)' : 'Air Quality (AQI)'}</span>
                    </span>

                    {/* Category Badge Pill with dynamic CPCB color */}
                    <span
                      style={{ backgroundColor: aqiColor }}
                      className="self-start flex items-center gap-1.5 text-white text-xs sm:text-[13px] font-black px-3.5 py-1 rounded-full shadow-xs uppercase tracking-wide"
                    >
                      <Leaf className="h-3.5 w-3.5 fill-white" />
                      <span>{aqiBadgeLabel}</span>
                    </span>
                  </div>

                  {/* Vertical Separator Divider */}
                  <span className="hidden sm:inline-block h-12 w-[1.5px] bg-slate-200 dark:bg-slate-700 select-none" aria-hidden="true" />

                  {/* Center: Large AQI Value */}
                  <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
                    <span className="text-4xl sm:text-5xl font-black text-[#171B2D] dark:text-white leading-none">
                      {mainAqi.value}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#171B2D] dark:text-white uppercase tracking-wider">
                      AQI
                    </span>
                  </div>

                  {/* Right: Horizontal Color Scale with Indicator Marker */}
                  <div className="w-full sm:w-44 md:w-52 lg:w-48 xl:w-56 flex flex-col justify-center">
                    <div className="relative w-full">
                      {/* Gradient Bar: Green -> Light Green -> Yellow -> Orange -> Red -> Purple */}
                      <div className="h-3 sm:h-3.5 w-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#84cc16] via-[#eab308] via-[#f97316] via-[#ef4444] to-[#a855f7] shadow-inner" />

                      {/* Triangle Pointer Marker pointing up into the bar */}
                      <div
                        className="absolute -bottom-3.5 transition-all duration-500 ease-out flex flex-col items-center"
                        style={{ left: `${aqiPercentage}%`, transform: 'translateX(-50%)' }}
                      >
                        <div
                          className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px]"
                          style={{ borderBottomColor: aqiColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Three Large Horizontal City Cards (Vadodara, Surat, Rajkot) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {otherCities.map((city) => {
                  const item = weatherData[city] || INITIAL_WEATHER[city];
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className="group text-left bg-white dark:bg-[#1a1c29] border-[1.5px] border-red-100/90 dark:border-slate-800 hover:border-[#C8101E] rounded-[20px] p-4 sm:p-4.5 shadow-sm hover:shadow-md transition-all cursor-pointer select-none"
                      title={isGu ? `${city} માટે હવામાન જુઓ` : `Select ${city}`}
                    >
                      {/* Card Header: City Name + Red Round Arrow */}
                      <div className="flex items-center justify-between">
                        <span className="text-base sm:text-[17px] font-black text-[#171B2D] dark:text-white group-hover:text-[#C8101E] transition-colors">
                          {city}
                        </span>
                        <span className="h-6 w-6 rounded-full bg-[#C8101E] text-white flex items-center justify-center text-xs group-hover:scale-110 transition-transform shadow-xs">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      {/* Card Body: Sun Icon + Temp & Humidity */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Weather Sun Icon in warm amber */}
                        <div className="text-amber-500 shrink-0">
                          <Sun className="h-8 w-8 sm:h-9 sm:w-9 stroke-[2.2] animate-[spin_20s_linear_infinite]" />
                        </div>

                        {/* Temp and Humidity Stack */}
                        <div className="flex flex-col items-end text-right gap-1">
                          <span className="text-sm sm:text-base font-black text-[#171B2D] dark:text-slate-100 flex items-center gap-1">
                            <Thermometer className="h-4 w-4 text-[#C8101E]" />
                            {item.temp}°C
                          </span>
                          <span className="text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Droplets className="h-3.5 w-3.5 text-[#C8101E]" />
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
          /* ─── TAB 2: DETAILED AIR QUALITY (AQI) VIEW ─── */
          <div className="flex flex-col gap-5 relative z-10">
            {/* Top Station & City Details */}
            <div className="bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[20px] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-xl bg-[#C8101E] text-white shadow-sm">
                  <Activity className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#171B2D] dark:text-white flex items-center gap-2 flex-wrap">
                    <span>{selectedCity} {isGu ? 'હવા ગુણવત્તા સૂચકાંક (NAQI)' : 'National Air Quality Index'}</span>
                    <span
                      style={{ backgroundColor: aqiColor }}
                      className="text-white text-xs font-black px-3 py-1 rounded-full uppercase"
                    >
                      {aqiBadgeLabel}
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                    <MapPin className="h-4 w-4 text-[#C8101E] shrink-0" />
                    <span>{mainAqi.station || `${selectedCity} Central CAAQM Station`}</span>
                  </p>
                </div>
              </div>

              {/* Big Score Box */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div
                  style={{ borderColor: aqiColor }}
                  className="px-5 py-2.5 rounded-2xl border-2 bg-white dark:bg-slate-900 flex items-baseline gap-2 shadow-xs"
                >
                  <span style={{ color: aqiColor }} className="text-4xl sm:text-5xl font-black">
                    {mainAqi.value}
                  </span>
                  <span className="text-sm font-black text-slate-500 uppercase">AQI</span>
                </div>
              </div>
            </div>

            {/* 6 Real CPCB Pollutants Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-[#C8101E] uppercase tracking-wider block">PM 2.5</span>
                  <span className="text-[11px] text-slate-400 font-medium block">{isGu ? 'અતિ સૂક્ષ્મ કણો' : 'Fine Particles'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-black text-[#171B2D] dark:text-white">
                    {mainAqi.pm25} <span className="text-xs font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-[#C8101E] uppercase tracking-wider block">PM 10</span>
                  <span className="text-[11px] text-slate-400 font-medium block">{isGu ? 'ધૂળ અને રજકણ' : 'Coarse Particles'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-black text-[#171B2D] dark:text-white">
                    {mainAqi.pm10} <span className="text-xs font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-[#C8101E] uppercase tracking-wider block">NO₂</span>
                  <span className="text-[11px] text-slate-400 font-medium block">{isGu ? 'નાઇટ્રોજન ડાયોક્સાઇડ' : 'Nitrogen Dioxide'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-black text-[#171B2D] dark:text-white">
                    {mainAqi.no2 || '15.2'} <span className="text-xs font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-[#C8101E] uppercase tracking-wider block">SO₂</span>
                  <span className="text-[11px] text-slate-400 font-medium block">{isGu ? 'સલ્ફર ડાયોક્સાઇડ' : 'Sulphur Dioxide'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-black text-[#171B2D] dark:text-white">
                    {mainAqi.so2 || '12.1'} <span className="text-xs font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-[#C8101E] uppercase tracking-wider block">CO</span>
                  <span className="text-[11px] text-slate-400 font-medium block">{isGu ? 'કાર્બન મોનોક્સાઇડ' : 'Carbon Monoxide'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-black text-[#171B2D] dark:text-white">
                    {mainAqi.co || '0.40'} <span className="text-xs font-semibold text-slate-400">mg/m³</span>
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1c29] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-[#C8101E] uppercase tracking-wider block">O₃</span>
                  <span className="text-[11px] text-slate-400 font-medium block">{isGu ? 'ઓઝોન વાયુ' : 'Ozone'}</span>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-black text-[#171B2D] dark:text-white">
                    {mainAqi.o3 || '45.0'} <span className="text-xs font-semibold text-slate-400">µg/m³</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Health Advisory Banner */}
            <div className="bg-[#FFF1F2] dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#C8101E] shrink-0 mt-0.5" />
              <div className="text-sm text-slate-800 dark:text-slate-200">
                <span className="font-black text-[#C8101E] mr-1.5">
                  {isGu ? 'આરોગ્ય સલાહ:' : 'Health Advisory:'}
                </span>
                <span>{mainAqi.advisoryGu || 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ સાવચેતી રાખવી.'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── BOTTOM INFORMATION BAR (Exact Match to Reference Image 2) ─── */}
        <div className="relative z-10 border-t border-slate-200/90 dark:border-white/10 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          {/* Left: Link to Full Details */}
          <Link
            href={`/aqi?city=${encodeURIComponent(selectedCity)}`}
            className="group flex items-center gap-1.5 text-sm sm:text-base font-black text-[#C8101E] hover:text-[#A80F19] transition-colors cursor-pointer"
            title={isGu ? `${selectedCity} માટે સંપૂર્ણ હવામાન અને AQI વિગતો જુઓ` : `View complete Weather & AQI details for ${selectedCity}`}
          >
            <span>{isGu ? 'સંપૂર્ણ હવામાન & AQI વિગતો જુઓ' : 'View Full Weather & AQI Details'}</span>
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          {/* Center Vertical Separator (Desktop) */}
          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700 font-light select-none">|</span>

          {/* Right: Refresh Icon + Last Updated Timestamp */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[#C8101E] font-black transition-colors cursor-pointer disabled:opacity-50"
              title={isGu ? 'તાજી માહિતી રિફ્રેશ કરો' : 'Refresh live data'}
            >
              <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (isGu ? 'અપડેટ થાય છે...' : 'Refreshing...') : isGu ? 'છેલ્લું અપડેટ:' : 'Last Update:'}</span>
            </button>
            <span className="font-bold text-[#171B2D] dark:text-white">
              {lastUpdateStr || '2026-11-13 10:22'}
            </span>
            <span className="text-xs text-slate-400 font-medium">(local time)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
