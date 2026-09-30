'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Trophy, Fuel, MapPin, Shield } from 'lucide-react';
import Image from 'next/image';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

interface FuelItem {
  name: string;
  nameEng: string;
  price: string;
  unit: string;
  symbol: 'P' | 'D' | 'C';
}

interface MarketItem {
  symbol: string;
  name: string;
  exchange: string;
  value: number;
  change: number;
  changePercent: number;
  marketState: string;
  observedAt: string | null;
}

interface CricketMatchItem {
  title: string;
  statusType: 'live' | 'day' | 'time';
  statusText: string;
  team1: string;
  team1Score: string;
  team2: string;
  team2Score: string;
}

interface FootballMatchItem {
  league: string;
  statusType: 'live' | 'time';
  statusText: string;
  homeTeam: string;
  homeScore: string;
  awayTeam: string;
  awayScore: string;
}

function Panel({
  title,
  rightElement,
  icon,
  variant,
  watermark,
  sourceText,
  children
}: {
  title: string;
  rightElement?: React.ReactNode;
  icon?: React.ReactNode;
  variant: 'red' | 'black';
  watermark?: React.ReactNode;
  sourceText: string;
  children: React.ReactNode;
}) {
  const panelBg = variant === 'red'
    ? 'bg-gradient-to-b from-[#C21E26] to-[#990D14] text-white border-red-700/20'
    : 'bg-gradient-to-b from-[#0F1115] to-[#050608] text-white border-neutral-900';

  const borderLine = variant === 'red' ? 'border-white/20' : 'border-white/10';

  return (
    <section className={`relative flex flex-col rounded-2xl border p-4 shadow-md overflow-hidden min-h-[420px] ${panelBg}`}>
      {/* Watermark in background */}
      {watermark}

      {/* Header */}
      <div className={`mb-4 flex items-center justify-between pb-2.5 border-b select-none ${borderLine} relative z-10`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[16px] font-extrabold tracking-tight leading-none text-white">{title}</h3>
        </div>
        <div className="flex items-center">
          {rightElement}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between relative z-10">
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          {children}
        </div>
        
        {/* Source Footer */}
        <p className={`pt-3 text-[10px] font-bold select-none mt-4 leading-none ${variant === 'red' ? 'text-white/60' : 'text-neutral-400'}`}>
          {sourceText}
        </p>
      </div>
    </section>
  );
}

// Custom SVGs for card watermarks (matching the screenshots exactly)
const FuelWatermark = (
  <div className="absolute bottom-[-15px] right-[-10px] w-[220px] h-[160px] opacity-[0.16] pointer-events-none z-0 select-none text-black">
    <svg viewBox="0 0 200 150" fill="currentColor" className="w-full h-full">
      {/* Fuel nozzle Spout pointing up-left */}
      <path d="M125 78 L95 48 C90 43 82 43 77 48 L48 77 C43 82 43 90 48 95 L58 105 L35 128 C32 131 32 136 35 139 C38 142 43 142 46 139 L69 116 L79 126 C84 131 92 131 97 126 L126 97 C131 92 131 84 126 79 Z M65 92 C62 89 62 84 65 81 C68 78 73 78 76 81 C79 84 79 89 76 92 C73 95 68 95 65 92 Z" />
      <path d="M120 73 L155 38 C160 33 168 33 173 38 L195 60 C200 65 200 73 195 78 L160 113" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      {/* Fuel droplet on the left */}
      <path d="M85 85 C85 93 79 100 72 100 C65 100 59 93 59 85 C59 75 72 60 72 60 C72 60 85 75 85 85 Z" />
      {/* Background waves */}
      <path d="M -20 80 Q 40 55 100 70 T 220 50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" fill="none" opacity="0.3" />
      <path d="M -20 90 Q 40 65 100 80 T 220 60" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" fill="none" opacity="0.3" />
    </svg>
  </div>
);

const MarketWatermark = (
  <div className="absolute bottom-[-10px] right-[-10px] w-[220px] h-[120px] opacity-[0.07] pointer-events-none z-0 select-none text-white">
    <svg viewBox="0 0 200 100" fill="currentColor" className="w-full h-full">
      {/* Histogram bars */}
      <rect x="20" y="70" width="6" height="20" rx="1" />
      <rect x="32" y="55" width="6" height="35" rx="1" />
      <rect x="44" y="65" width="6" height="25" rx="1" />
      <rect x="56" y="45" width="6" height="45" rx="1" />
      <rect x="68" y="50" width="6" height="40" rx="1" />
      <rect x="80" y="30" width="6" height="60" rx="1" />
      <rect x="92" y="40" width="6" height="50" rx="1" />
      <rect x="104" y="35" width="6" height="55" rx="1" />
      <rect x="116" y="20" width="6" height="70" rx="1" />
      <rect x="128" y="45" width="6" height="45" rx="1" />
      <rect x="140" y="30" width="6" height="60" rx="1" />
      <rect x="152" y="25" width="6" height="65" rx="1" />
      <rect x="164" y="15" width="6" height="75" rx="1" />
      {/* Connecting line on top */}
      <path d="M 23 68 L 35 52 L 47 62 L 59 42 L 71 47 L 83 27 L 95 37 L 107 32 L 119 17 L 131 42 L 143 27 L 155 22 L 167 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      <circle cx="23" cy="68" r="2.5" />
      <circle cx="35" cy="52" r="2.5" />
      <circle cx="47" cy="62" r="2.5" />
      <circle cx="59" cy="42" r="2.5" />
      <circle cx="71" cy="47" r="2.5" />
      <circle cx="83" cy="27" r="2.5" />
      <circle cx="95" cy="37" r="2.5" />
      <circle cx="107" cy="32" r="2.5" />
      <circle cx="119" cy="17" r="2.5" />
      <circle cx="131" cy="42" r="2.5" />
      <circle cx="143" cy="27" r="2.5" />
      <circle cx="155" cy="22" r="2.5" />
      <circle cx="167" cy="12" r="2.5" />
    </svg>
  </div>
);

const CricketWatermark = (
  <div className="absolute bottom-[-5px] right-[-10px] w-[240px] h-[140px] opacity-[0.14] pointer-events-none z-0 select-none text-black">
    <svg viewBox="0 0 200 120" fill="currentColor" className="w-full h-full">
      {/* Stadium Stands */}
      <path d="M 0 100 Q 100 115 200 100 L 200 120 L 0 120 Z" opacity="0.6" />
      <path d="M 0 88 Q 100 103 200 88 L 200 100 Q 100 115 0 100 Z" opacity="0.4" />
      <path d="M 0 76 Q 100 91 200 76 L 200 88 Q 100 103 0 88 Z" opacity="0.3" />
      <path d="M 0 64 Q 100 79 200 64 L 200 76 Q 100 91 0 76 Z" opacity="0.2" />
      {/* Floodlights left */}
      <g transform="translate(20, 25)" className="text-white">
        <rect x="-12" y="-6" width="24" height="12" rx="1.5" fill="currentColor" />
        <line x1="0" y1="6" x2="-2" y2="45" stroke="currentColor" strokeWidth="2.5" />
        <polygon points="-8,6 -45,85 35,85" fill="currentColor" opacity="0.15" />
        <circle cx="-8" cy="-2" r="1.5" fill="white" />
        <circle cx="-3" cy="-2" r="1.5" fill="white" />
        <circle cx="3" cy="-2" r="1.5" fill="white" />
        <circle cx="8" cy="-2" r="1.5" fill="white" />
        <circle cx="-8" cy="2" r="1.5" fill="white" />
        <circle cx="-3" cy="2" r="1.5" fill="white" />
        <circle cx="3" cy="2" r="1.5" fill="white" />
        <circle cx="8" cy="2" r="1.5" fill="white" />
      </g>
      {/* Floodlights right */}
      <g transform="translate(180, 30)" className="text-white">
        <rect x="-12" y="-6" width="24" height="12" rx="1.5" fill="currentColor" />
        <line x1="0" y1="6" x2="2" y2="40" stroke="currentColor" strokeWidth="2.5" />
        <polygon points="8,6 -35,80 45,80" fill="currentColor" opacity="0.15" />
        <circle cx="-8" cy="-2" r="1.5" fill="white" />
        <circle cx="-3" cy="-2" r="1.5" fill="white" />
        <circle cx="3" cy="-2" r="1.5" fill="white" />
        <circle cx="8" cy="-2" r="1.5" fill="white" />
        <circle cx="-8" cy="2" r="1.5" fill="white" />
        <circle cx="-3" cy="2" r="1.5" fill="white" />
        <circle cx="3" cy="2" r="1.5" fill="white" />
        <circle cx="8" cy="2" r="1.5" fill="white" />
      </g>
      <path d="M -20 80 Q 40 55 100 70 T 220 50" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.2" />
    </svg>
  </div>
);

const FootballWatermark = (
  <div className="absolute bottom-[-10px] right-[-10px] w-[220px] h-[120px] opacity-[0.08] pointer-events-none z-0 select-none text-white">
    <svg viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
      <path d="M0 90 Q 50 65 100 80 T 200 50" opacity="0.3" />
      <path d="M0 80 Q 50 55 100 70 T 200 40" opacity="0.35" />
      <path d="M0 70 Q 50 45 100 60 T 200 30" opacity="0.4" />
      <path d="M0 60 Q 50 35 100 50 T 200 20" opacity="0.35" />
      <path d="M0 50 Q 50 25 100 40 T 200 10" opacity="0.3" />
      <path d="M 20 100 Q 50 60 80 10" opacity="0.3" />
      <path d="M 50 100 Q 80 60 110 10" opacity="0.35" />
      <path d="M 80 100 Q 110 60 140 10" opacity="0.4" />
      <path d="M 110 100 Q 140 60 170 10" opacity="0.35" />
      <path d="M 140 100 Q 170 60 200 10" opacity="0.3" />
      <path d="M 100 90 A 50 50 0 0 1 200 40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.25" />
      <path d="M 120 90 A 40 40 0 0 1 200 50" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.25" />
    </svg>
  </div>
);

// Fallback / Initial Mock Data
const FALLBACK_FUEL: FuelItem[] = [
  { name: 'પેટ્રોલ', nameEng: 'Petrol', price: '96.42', unit: 'લીટર', symbol: 'P' },
  { name: 'ડીઝલ', nameEng: 'Diesel', price: '92.17', unit: 'લીટર', symbol: 'D' },
  { name: 'CNG', nameEng: 'CNG', price: '76.00', unit: 'કિલો', symbol: 'C' }
];

const FALLBACK_MARKETS: MarketItem[] = [
  { symbol: 'NIFTY 50', name: 'Nifty 50', exchange: 'NSE', value: 23456.2, change: 188.4, changePercent: 0.93, marketState: 'OPEN', observedAt: new Date().toISOString() },
  { symbol: 'SENSEX', name: 'BSE Sensex', exchange: 'BSE', value: 80309.1, change: 425.6, changePercent: 0.55, marketState: 'OPEN', observedAt: new Date().toISOString() },
  { symbol: 'NIFTY BANK', name: 'Nifty Bank', exchange: 'NSE', value: 49640.8, change: -124.1, changePercent: -0.23, marketState: 'OPEN', observedAt: new Date().toISOString() }
];

const FALLBACK_CRICKET: CricketMatchItem[] = [
  { title: 'India vs England', statusType: 'live', statusText: 'LIVE', team1: 'India', team1Score: '168/8 (20)', team2: 'England', team2Score: '185/9 (19.2)' },
  { title: 'Ranji Trophy', statusType: 'day', statusText: 'Day 3', team1: 'Gujarat', team1Score: '284/6', team2: 'Mumbai', team2Score: '322/10' },
  { title: 'IPL', statusType: 'time', statusText: '22:00', team1: 'CSK', team1Score: '—', team2: 'MI', team2Score: '—' }
];

const FALLBACK_FOOTBALL: FootballMatchItem[] = [
  { league: 'ISL', statusType: 'live', statusText: "75'", homeTeam: 'Mumbai City FC', homeScore: '2', awayTeam: 'Mohun Bagan', awayScore: '1' },
  { league: 'EPL', statusType: 'time', statusText: '22:00', homeTeam: 'Man City', homeScore: '—', awayTeam: 'Arsenal', awayScore: '—' },
  { league: 'La Liga', statusType: 'time', statusText: '23:00', homeTeam: 'Real Madrid', homeScore: '—', awayTeam: 'Barcelona', awayScore: '—' }
];

export default function LiveDashboard() {
  const { language } = useApp();
  const [fuel, setFuel] = useState<FuelItem[]>([]);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [cricket, setCricket] = useState<CricketMatchItem[]>([]);
  const [football, setFootball] = useState<FootballMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    if (manual) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setFuel(FALLBACK_FUEL);
    setMarkets(FALLBACK_MARKETS);
    setCricket(FALLBACK_CRICKET);
    setFootball(FALLBACK_FOOTBALL);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-[#B3121B] animate-spin" />
          <p className="text-sm font-bold text-neutral-500">Loading Live Center...</p>
        </div>
      </div>
    );
  }

  return (
    <section id="live-dashboard" className="py-6 bg-background">
      <div className="mx-auto max-w-screen-xl px-4">
        {/* Main Card Container */}
        <div className="bg-[#f8f9fa] dark:bg-slate-900/40 border border-neutral-400/85 dark:border-neutral-800/65 rounded-2xl p-6 shadow-sm shadow-neutral-100/20">

          {/* Header Row */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-neutral-400/40 dark:border-neutral-800/60 select-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* Red speed arrow logo */}
                <div className="relative w-8 h-4 shrink-0">
                  <Image
                    src="/rightSide.png"
                    alt="NEWS BRIEF"
                    fill
                    className="object-contain"
                  />
                </div>
                {/* Skewed Red Banner */}
                <div className="bg-[#B3121B] text-white px-5 py-1.5 transform -skew-x-[20deg] font-black rounded-sm shadow-sm select-none">
                  <span className="block transform skew-x-[20deg] text-[15px] md:text-[16.5px] tracking-wider uppercase leading-none">
                    {getLocalized(language, { en: 'Live Center', gu: 'લાઇવ સેન્ટર', hi: 'लाइव सेंटर' })}
                  </span>
                </div>
                {/* Skewed red lines */}
                <div className="flex gap-1 transform -skew-x-[20deg] select-none ml-0.5">
                  <span className="w-1 bg-[#B3121B] h-4.5 block" />
                  <span className="w-1 bg-[#B3121B] h-4.5 block" />
                </div>
              </div>

              {/* Header categories with dots */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-black text-neutral-500 uppercase tracking-wide mt-1">
                <span>{getLocalized(language, { en: 'Fuel Price', gu: 'ઈંધણ ભાવ', hi: 'ईंधन भाव' })}</span>
                <span className="text-[#B3121B] font-extrabold">•</span>
                <span>{getLocalized(language, { en: 'Stock Market', gu: 'શેરબજાર', hi: 'શેરબજાર' })}</span>
                <span className="text-[#B3121B] font-extrabold">•</span>
                <span>{getLocalized(language, { en: 'Sports', gu: 'રમતગમત', hi: 'खेल' })}</span>
                <span className="text-[#B3121B] font-extrabold">•</span>
                <span>{getLocalized(language, { en: 'Sports Updates', gu: 'સ્પોર્ટ્સ અપડેટ', hi: 'સ્પોર્ટ્સ અપડેટ' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-neutral-400 dark:border-neutral-800 bg-white hover:bg-[#B3121B] text-neutral-700 hover:text-white dark:bg-slate-900/50 px-4 text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{getLocalized(language, { en: 'Refresh Data', gu: 'તાજું કરો', hi: 'रिफ्रेश करें' })}</span>
              </button>

              {/* Live Badge Capsule */}
              <div className="flex items-center gap-1.5 bg-white border border-[#B3121B] text-[#B3121B] rounded-full px-3 py-1 text-xs font-black select-none w-fit leading-none shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B3121B] animate-pulse" />
                <span>{getLocalized(language, { en: 'Live', gu: 'લાઇવ', hi: 'लाइव' })}</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

            {/* Panel 1: Fuel Price */}
            <Panel
              title={getLocalized(language, { en: 'Fuel Price', gu: 'ઈંધણ ભાવ', hi: 'ईंधन भाव' })}
              variant="red"
              watermark={FuelWatermark}
              sourceText={getLocalized(language, { en: 'Source: IOC / HPCL', gu: 'સ્ત્રોત: IOC / HPCL', hi: 'स्रोत: IOC / HPCL' })}
              rightElement={
                <div className="flex items-center gap-1 text-[12px] font-extrabold text-white select-none">
                  <span>{getLocalized(language, { en: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' })}</span>
                  <MapPin className="h-3.5 w-3.5 text-white" />
                </div>
              }
              icon={<Fuel className="h-5 w-5 text-white" />}
            >
              {fuel.map((item) => (
                <div key={item.symbol} className="flex-1 flex items-center justify-between rounded-xl bg-white px-4 py-3.5 shadow-sm border border-neutral-400 hover:shadow transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-[16px] shrink-0
                      ${item.symbol === 'P' ? 'bg-red-50 text-red-600 border border-red-300' : ''}
                      ${item.symbol === 'D' ? 'bg-blue-50 text-blue-600 border border-blue-300' : ''}
                      ${item.symbol === 'C' ? 'bg-emerald-50 text-emerald-600 border border-emerald-300' : ''}
                    `}>
                      {item.symbol}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[13.5px] text-neutral-900 leading-none">
                        {language === 'gu' ? `${item.name} (${item.nameEng})` : `${item.nameEng} (${item.nameEng})`}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 mt-2 leading-none">
                        {language === 'gu' ? `પ્રતિ ${item.unit}` : `per ${item.unit === 'લીટર' ? 'liter' : 'kg'}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-black text-neutral-900 leading-none">₹{item.price}</p>
                    <p className="text-[9px] font-bold text-neutral-400 mt-1.5 leading-none">
                      / {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </Panel>

            {/* Panel 2: Stock Market */}
            <Panel
              title={getLocalized(language, { en: 'Stock Market', gu: 'શેરબજાર', hi: 'શેરબજાર' })}
              variant="black"
              watermark={MarketWatermark}
              sourceText={getLocalized(language, { en: 'Source: Yahoo Finance', gu: 'સ્ત્રોત: Yahoo Finance', hi: 'स्रोत: Yahoo Finance' })}
              rightElement={
                <span className="text-[10px] font-bold text-neutral-400 leading-none whitespace-nowrap">
                  {getLocalized(language, { en: 'India ₹ INR', gu: 'ભારત ₹ INR', hi: 'भारत ₹ INR' })}
                </span>
              }
              icon={<TrendingUp className="h-5 w-5 text-white" />}
            >
              {markets.map((item) => (
                <div key={item.symbol} className="rounded-xl bg-[#121518] p-3 border border-[#1F252C] shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-[13.5px] text-white leading-none">{item.name}</p>
                      <p className="text-[10px] font-bold text-neutral-400 mt-2 leading-none">{item.exchange}</p>
                    </div>
                    <p className="text-[15px] font-black text-white leading-none">
                      ₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </p>
                  </div>
                  <div className={`mt-2.5 flex items-center gap-1 text-[11px] font-black select-none leading-none
                    ${item.change >= 0 ? 'text-emerald-500' : 'text-red-500'}
                  `}>
                    {item.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span>{item.change >= 0 ? '+' : ''}{item.change.toFixed(1)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
              ))}
            </Panel>

            {/* Panel 3: Cricket */}
            <Panel
              title={getLocalized(language, { en: 'Cricket', gu: 'ક્રિકેટ', hi: 'क्रिकेट' })}
              variant="red"
              watermark={CricketWatermark}
              sourceText={getLocalized(language, { en: 'Source: ESPN', gu: 'સ્ત્રોત: ESPN', hi: 'स्रोत: ESPN' })}
              rightElement={
                <span className="text-[12px] font-extrabold text-white leading-none hover:text-white/80 transition-colors select-none whitespace-nowrap cursor-pointer">
                  {language === 'gu' ? '+ વધુ' : language === 'hi' ? '+ और' : '+ More'}
                </span>
              }
              icon={<Trophy className="h-5 w-5 text-white" />}
            >
              {cricket.map((match, i) => (
                <div key={i} className="rounded-xl bg-white p-3 shadow-sm border border-neutral-400">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-neutral-400">
                    <p className="font-extrabold text-[12.5px] text-neutral-900 leading-none">{match.title}</p>
                    {match.statusType === 'live' ? (
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[8.5px] font-black rounded leading-none select-none border border-emerald-300">
                        {match.statusText}
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[9.5px] font-bold select-none">
                        {match.statusText}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-700">
                      <span>{match.team1}</span>
                      <span className="font-black text-neutral-900">{match.team1Score}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-700">
                      <span>{match.team2}</span>
                      <span className="font-black text-neutral-900">{match.team2Score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Panel>

            {/* Panel 4: Football */}
            <Panel
              title={getLocalized(language, { en: 'Football', gu: 'ફૂટબોલ', hi: 'फ़ुटबॉल' })}
              variant="black"
              watermark={FootballWatermark}
              sourceText={getLocalized(language, { en: 'Source: ESPN', gu: 'સ્ત્રોત: ESPN', hi: 'स्रोत: ESPN' })}
              rightElement={
                <span className="text-[12px] font-extrabold text-white leading-none hover:text-white/80 transition-colors select-none whitespace-nowrap cursor-pointer">
                  {language === 'gu' ? '+ વધુ' : language === 'hi' ? '+ और' : '+ More'}
                </span>
              }
              icon={<Shield className="h-5 w-5 text-white" />}
            >
              {football.map((match, i) => (
                <div key={i} className="rounded-xl bg-[#121518] p-3 border border-[#1F252C] shadow-sm">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#1F252C]">
                    <p className="font-extrabold text-[12.5px] text-white leading-none">{match.league}</p>
                    {match.statusType === 'live' ? (
                      <span className="bg-[#B3121B] text-white px-2 py-0.5 text-[8.5px] font-black rounded leading-none select-none">
                        {match.statusText}
                      </span>
                    ) : (
                      <span className="text-neutral-450 text-[9.5px] font-bold select-none">
                        {match.statusText}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-350">
                      <span>{match.homeTeam}</span>
                      <span className="font-black text-white">{match.homeScore}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-355">
                      <span>{match.awayTeam}</span>
                      <span className="font-black text-white">{match.awayScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Panel>

          </div>

          {/* Bottom Black Bar with skewed Red accent */}
          <div className="w-full h-8 bg-black mt-6 -mx-6 -mb-6 relative overflow-hidden rounded-b-2xl select-none shrink-0">
            <div
              className="absolute right-0 top-0 bottom-0 w-36 bg-[#B3121B] transform skew-x-[35deg] translate-x-12"
            />
          </div>

        </div>
      </div>
    </section>
  );
}