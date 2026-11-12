'use client';

import React, { useState, useEffect } from 'react';
import { Fuel, TrendingUp, Trophy, Zap, ChevronDown, MapPin, Info } from 'lucide-react';
import type { Language } from '@/types';
import { getLiveCenterData } from '@/lib/api';

const FUEL_PRICE_CITY_MAP: Record<string, { petrol: string; diesel: string; cng: string }> = {
  Ahmedabad: { petrol: '102.15', diesel: '98.27', cng: '100.77' },
  Vadodara: { petrol: '101.46', diesel: '97.57', cng: '98.95' },
  Surat: { petrol: '101.82', diesel: '97.95', cng: '88.76' },
  Rajkot: { petrol: '101.59', diesel: '97.72', cng: '88.76' },
};

/** Mini SVG Sparkline Component for Stock Market Trends */
function StockSparkline({
  data,
  isPositive,
}: {
  data?: number[];
  isPositive: boolean;
}) {
  const pointsData =
    data && data.length >= 4
      ? data
      : isPositive
      ? [25180, 25200, 25190, 25230, 25220, 25250, 25270]
      : [25280, 25260, 25270, 25230, 25240, 25210, 25190];

  const min = Math.min(...pointsData);
  const max = Math.max(...pointsData);
  const range = max - min || 1;
  const width = 68;
  const height = 24;

  const points = pointsData.map((val, i) => {
    const x = (i / (pointsData.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 2,${height} L ${points.join(' L ')} L ${width - 2},${height} Z`;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)';

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0 select-none">
      <defs>
        <linearGradient id={`grad-${isPositive ? 'pos' : 'neg'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${isPositive ? 'pos' : 'neg'})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LiveCenterSection({ language }: { language: Language }) {
  const [fuelCity, setFuelCity] = useState('Ahmedabad');
  const [fuelPrices, setFuelPrices] = useState(FUEL_PRICE_CITY_MAP);
  const [activeTab, setActiveTab] = useState<'fuel' | 'stocks' | 'cricket'>('fuel');

  // Real-time Stock Market state
  const [stocks, setStocks] = useState([
    { name: 'Nifty 50', exchange: 'NSE', value: 25266.8, change: 11.8, changePercent: 0.05, sparkline: [25220, 25240, 25230, 25260, 25255, 25266.8] },
    { name: 'BSE Sensex', exchange: 'BSE', value: 81811.0, change: -68.4, changePercent: -0.08, sparkline: [81890, 81860, 81840, 81820, 81830, 81811.0] },
    { name: 'Nifty Bank', exchange: 'NSE', value: 61475.9, change: 683.5, changePercent: 1.12, sparkline: [60850, 60990, 61120, 61300, 61410, 61475.9] },
  ]);

  // Live Exchange Rate
  const [usdRate, setUsdRate] = useState<{ rate: string; change: string }>({ rate: '84.05', change: '-0.12' });

  // Real-time Cricket Matches state
  const [cricketMatches, setCricketMatches] = useState([
    {
      title: 'Pakistan vs Sri Lanka',
      statusType: 'live',
      statusText: 'LIVE',
      team1: 'Pakistan',
      team1Score: '49/1 & 434/9 *',
      team2: 'Sri Lanka',
      team2Score: '446/10',
    },
    {
      title: 'New South Wales vs South Australia',
      statusType: 'live',
      statusText: 'LIVE',
      team1: 'New South Wales',
      team1Score: '191/2 & 204/10 *',
      team2: 'South Australia',
      team2Score: '325/10',
    },
    {
      title: 'Victoria vs Western Australia',
      statusType: 'live',
      statusText: 'LIVE',
      team1: 'Victoria',
      team1Score: '402/5',
      team2: 'Western Australia',
      team2Score: '185/3 *',
    },
  ]);

  // Fetch real-time live center data from Backend API with rapid auto-refresh
  useEffect(() => {
    let isMounted = true;

    const loadLiveCenterData = async () => {
      try {
        const data = await getLiveCenterData(false);
        if (data && isMounted) {
          if (data.fuelPrices) setFuelPrices(data.fuelPrices);
          if (Array.isArray(data.stocks) && data.stocks.length >= 3) {
            setStocks(data.stocks.slice(0, 3));
          }
          if (data.usdRate) setUsdRate(data.usdRate);
          if (Array.isArray(data.cricketMatches) && data.cricketMatches.length > 0) {
            setCricketMatches(data.cricketMatches.filter((m: any) => m.team1 !== 'Team 1' && m.title !== 'Cricket Match').slice(0, 3));
          }
        }
      } catch {}
    };

    loadLiveCenterData();

    // Auto-refresh every 60 seconds for true live rates & scores
    const intervalId = setInterval(loadLiveCenterData, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadLiveCenterData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const activeFuel =
    fuelPrices[fuelCity] ||
    Object.entries(fuelPrices).find(([k]) => k.toLowerCase() === fuelCity.toLowerCase())?.[1] ||
    FUEL_PRICE_CITY_MAP[fuelCity] ||
    FUEL_PRICE_CITY_MAP.Ahmedabad;

  /* ──────────────────────────────────────────────────────────
     1. FUEL PRICE CARD (Signature Red Gradient + Pump Art)
     ────────────────────────────────────────────────────────── */
  const renderFuelCard = () => (
    <div className="relative flex flex-col justify-between h-full rounded-2xl bg-gradient-to-br from-[#c91822] via-[#a81018] to-[#800a10] text-white p-3.5 sm:p-4 shadow-sm overflow-hidden min-h-[310px]">
      {/* Decorative Wave & Fuel Pump Glow Art */}
      <div className="pointer-events-none absolute -right-6 -top-6 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-2 top-8 opacity-15">
        <svg width="120" height="90" viewBox="0 0 100 80" fill="none">
          <path d="M10 70 C30 40, 70 80, 90 20" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <circle cx="90" cy="20" r="5" fill="#facc15" />
        </svg>
      </div>

      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/20 select-none">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/15 backdrop-blur-xs text-white">
                <Fuel className="h-5 w-5" />
              </span>
              <h4 className="text-[17px] font-black tracking-tight leading-none text-white">Fuel Price</h4>
            </div>
            <p className="text-[11.5px] font-medium text-white/80 mt-1 pl-0.5">Latest fuel rates in your city</p>
          </div>

          {/* City Selector */}
          <div className="relative shrink-0">
            <div className="flex items-center gap-1 bg-black/35 hover:bg-black/50 text-white text-[12px] font-bold px-2.5 py-1 rounded-lg border border-white/25 transition-colors cursor-pointer">
              <MapPin className="h-3 w-3 text-red-300 shrink-0" />
              <select
                value={fuelCity}
                onChange={(e) => setFuelCity(e.target.value)}
                className="appearance-none bg-transparent text-white text-[12px] font-bold pr-4 focus:outline-none cursor-pointer"
              >
                <option value="Ahmedabad" className="bg-slate-900 text-white">Ahmedabad</option>
                <option value="Vadodara" className="bg-slate-900 text-white">Vadodara</option>
                <option value="Surat" className="bg-slate-900 text-white">Surat</option>
                <option value="Rajkot" className="bg-slate-900 text-white">Rajkot</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-white absolute right-1.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3 Fuel Rows */}
        <div className="space-y-2.5 py-3">
          {[
            { name: 'Petrol', unitDesc: '₹ per Litre', price: activeFuel.petrol, unit: '/L', symbol: 'P', badgeBg: 'bg-red-50 text-red-600 border-red-200' },
            { name: 'Diesel', unitDesc: '₹ per Litre', price: activeFuel.diesel, unit: '/L', symbol: 'D', badgeBg: 'bg-blue-50 text-blue-600 border-blue-200' },
            { name: 'CNG', unitDesc: '₹ per Kg', price: activeFuel.cng, unit: '/Kg', symbol: 'C', badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
          ].map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between rounded-xl bg-white text-slate-900 px-3.5 py-2.5 shadow-sm transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[13.5px] border shadow-2xs shrink-0 ${item.badgeBg}`}>
                  {item.symbol}
                </span>
                <div>
                  <span className="font-black text-[15px] text-slate-900 block leading-tight">{item.name}</span>
                  <span className="text-[11px] font-semibold text-slate-500 block leading-tight mt-0.5">{item.unitDesc}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-[18px] text-slate-900 tracking-tight">₹{item.price}</span>
                <span className="text-[12px] font-bold text-slate-500 ml-0.5">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Footer */}
      <p className="text-[10.5px] font-bold text-white/80 select-none pt-1 flex items-center gap-1">
        <Info className="h-3 w-3" /> Source: API Mitra & IOCL
      </p>
    </div>
  );

  /* ──────────────────────────────────────────────────────────
     2. STOCK MARKET CARD (Deep Navy Dark + Candlesticks & Charts)
     ────────────────────────────────────────────────────────── */
  const renderStocksCard = () => (
    <div className="relative flex flex-col justify-between h-full rounded-2xl bg-gradient-to-br from-[#0c1a2e] via-[#081220] to-[#040810] text-white p-3.5 sm:p-4 border border-cyan-500/20 shadow-sm overflow-hidden min-h-[310px]">
      {/* Decorative Candlestick & Glowing Wave Background */}
      <div className="pointer-events-none absolute -right-6 -top-6 w-36 h-36 rounded-full bg-cyan-500/10 blur-2xl" />
      <div className="pointer-events-none absolute right-2 top-3 opacity-25">
        <svg width="110" height="70" viewBox="0 0 100 60" fill="none">
          {/* Candlesticks */}
          <line x1="20" y1="10" x2="20" y2="50" stroke="#10b981" strokeWidth="1.5" />
          <rect x="17" y="20" width="6" height="20" rx="1" fill="#10b981" />
          <line x1="40" y1="15" x2="40" y2="45" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="37" y="22" width="6" height="15" rx="1" fill="#f43f5e" />
          <line x1="60" y1="8" x2="60" y2="52" stroke="#10b981" strokeWidth="1.5" />
          <rect x="57" y="15" width="6" height="25" rx="1" fill="#10b981" />
          <line x1="80" y1="12" x2="80" y2="48" stroke="#10b981" strokeWidth="1.5" />
          <rect x="77" y="18" width="6" height="20" rx="1" fill="#10b981" />
        </svg>
      </div>

      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/10 select-none">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                <TrendingUp className="h-5 w-5" />
              </span>
              <h4 className="text-[17px] font-black tracking-tight leading-none text-white">Stock Market</h4>
            </div>
            <p className="text-[11.5px] font-medium text-slate-300 mt-1 pl-0.5">Live market updates & indices</p>
          </div>

          <span className="text-[11.5px] font-black text-slate-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 shrink-0">
            India ₹ INR
          </span>
        </div>

        {/* 3 Stock Rows */}
        <div className="space-y-2.5 py-3">
          {stocks.slice(0, 3).map((item) => {
            const isPositive = item.change >= 0;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl bg-[#0e1c2e]/90 hover:bg-[#12233a] border border-cyan-500/20 hover:border-cyan-400/40 px-3.5 py-2.5 shadow-sm transition-all hover:scale-[1.01]"
              >
                <div>
                  <span className="font-black text-[15px] text-white block leading-tight">{item.name}</span>
                  <span className="text-[11px] font-bold text-slate-400 block leading-tight mt-0.5">{item.exchange}</span>
                </div>

                {/* Center: Real SVG Sparkline Curve */}
                <div className="hidden sm:block px-2">
                  <StockSparkline data={(item as any).sparkline} isPositive={isPositive} />
                </div>

                {/* Right: Value & Change */}
                <div className="text-right">
                  <span className="font-black text-[16.5px] text-white block leading-tight tracking-tight">
                    ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </span>
                  <span
                    className={`inline-block text-[11.5px] font-black px-1.5 py-0.5 rounded-md mt-0.5 leading-tight ${
                      isPositive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isPositive ? '▲ +' : '▼ '}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Footer */}
      <p className="text-[10.5px] font-bold text-slate-400 select-none pt-1 flex items-center gap-1">
        <Info className="h-3 w-3" /> Source: BharatStock & Yahoo
      </p>
    </div>
  );

  /* ──────────────────────────────────────────────────────────
     3. CRICKET CARD (Royal Purple Gradient + Live Stadium Match Cards)
     ────────────────────────────────────────────────────────── */
  const renderCricketCard = () => (
    <div className="relative flex flex-col justify-between h-full rounded-2xl bg-gradient-to-br from-[#4a124e] via-[#350d38] to-[#1e0720] text-white p-3.5 sm:p-4 border border-purple-500/20 shadow-sm overflow-hidden min-h-[310px]">
      {/* Decorative Stadium Floodlights & Cricket Ball Art */}
      <div className="pointer-events-none absolute -right-6 -top-6 w-36 h-36 rounded-full bg-purple-500/15 blur-2xl" />
      <div className="pointer-events-none absolute right-3 top-4 opacity-25">
        <svg width="100" height="65" viewBox="0 0 100 65" fill="none">
          {/* Cricket Ball */}
          <circle cx="70" cy="30" r="22" fill="#e11d48" />
          <path d="M54 20 C66 30, 74 30, 86 40" stroke="white" strokeWidth="2" strokeDasharray="2 2" />
        </svg>
      </div>

      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/20 select-none">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-300">
                <Trophy className="h-5 w-5" />
              </span>
              <h4 className="text-[17px] font-black tracking-tight leading-none text-white">Cricket</h4>
            </div>
            <p className="text-[11.5px] font-medium text-white/80 mt-1 pl-0.5">Live scores, results & updates</p>
          </div>

          <span className="bg-emerald-500 text-white text-[10.5px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>

        {/* 3 Match Cards */}
        <div className="space-y-2 py-3">
          {cricketMatches.slice(0, 3).map((match, i) => (
            <div
              key={i}
              className="rounded-xl bg-white text-slate-900 p-2.5 sm:p-3 shadow-sm transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-[11px] font-black text-slate-600 pb-1 border-b border-slate-100">
                <span className="truncate max-w-[190px] sm:max-w-[220px] font-black text-slate-900">
                  {match.title}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-black shrink-0 ${
                    match.statusType === 'live'
                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {match.statusText}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12.5px] sm:text-[13px] font-bold text-slate-800 pt-1.5">
                <span className="truncate pr-1">
                  {match.team1}: <strong className="font-black text-slate-950">{match.team1Score}</strong>
                </span>
                <span className="truncate pl-1 text-right">
                  {match.team2}: <strong className="font-black text-slate-950">{match.team2Score}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Footer */}
      <p className="text-[10.5px] font-bold text-white/80 select-none pt-1 flex items-center gap-1">
        <Info className="h-3 w-3" /> Source: Cricket DB & Cricinfo
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-2.5 mb-2 sm:mb-2.5">
      {/* ── Main Elevated Container ── */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#12151c] p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">

        {/* ── MOBILE / SINGLE VIEW (< md) ── */}
        <div className="block md:hidden">
          {/* Top Live Center Bar with dynamic active theme */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/[0.06] select-none">
            <span
              className={`text-white text-[12px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs transition-colors ${
                activeTab === 'fuel'
                  ? 'bg-[#B3121B]'
                  : activeTab === 'stocks'
                  ? 'bg-[#0284c7]'
                  : 'bg-[#7c3aed]'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              ((•)) Live Center
            </span>

            <span className="bg-red-50 dark:bg-red-950/40 text-[#B3121B] dark:text-red-400 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/60 flex items-center gap-1.5 select-none">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B3121B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B3121B]" />
              </span>
              <span>LIVE</span>
            </span>
          </div>

          {/* 3 Interactive Category Tabs with exact active styling */}
          <div className="grid grid-cols-3 gap-2 pt-2.5 pb-2.5 select-none">
            <button
              type="button"
              onClick={() => setActiveTab('fuel')}
              className={`text-[12.5px] font-black py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'fuel'
                  ? 'bg-[#B3121B] text-white shadow-md'
                  : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>⛽</span> Fuel Price
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stocks')}
              className={`text-[12.5px] font-black py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'stocks'
                  ? 'bg-[#0284c7] text-white shadow-md'
                  : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>📈</span> Stocks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cricket')}
              className={`text-[12.5px] font-black py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'cricket'
                  ? 'bg-[#7c3aed] text-white shadow-md'
                  : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>🏏</span> Cricket
            </button>
          </div>

          {/* Content for active tab */}
          <div className="pt-1">
            {activeTab === 'fuel' && renderFuelCard()}
            {activeTab === 'stocks' && renderStocksCard()}
            {activeTab === 'cricket' && renderCricketCard()}
          </div>
        </div>

        {/* ── DESKTOP 3-CARD VIEW (>= md) Matching exact design ── */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {/* Card 1: Fuel Price */}
          <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center justify-between pb-1 select-none">
              <span className="bg-[#B3121B] text-white text-[12px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                ((•)) Live Center
              </span>
              <span className="bg-red-50 dark:bg-red-950/40 text-[#B3121B] text-[10.5px] font-black px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B3121B]" /> LIVE
              </span>
            </div>
            {/* Tabs Row */}
            <div className="grid grid-cols-3 gap-1.5 text-[11.5px] font-extrabold select-none">
              <span className="bg-[#B3121B] text-white py-1 px-2 rounded-lg text-center shadow-xs flex items-center justify-center gap-1">
                ⛽ Fuel Price
              </span>
              <span className="bg-white dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg text-center border border-slate-200/60 dark:border-transparent flex items-center justify-center gap-1">
                📈 Stocks
              </span>
              <span className="bg-white dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg text-center border border-slate-200/60 dark:border-transparent flex items-center justify-center gap-1">
                🏏 Cricket
              </span>
            </div>
            {/* Card Body */}
            {renderFuelCard()}
          </div>

          {/* Card 2: Stock Market */}
          <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center justify-between pb-1 select-none">
              <span className="bg-[#0284c7] text-white text-[12px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                ((•)) Live Center
              </span>
              <span className="bg-red-50 dark:bg-red-950/40 text-[#B3121B] text-[10.5px] font-black px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B3121B]" /> LIVE
              </span>
            </div>
            {/* Tabs Row */}
            <div className="grid grid-cols-3 gap-1.5 text-[11.5px] font-extrabold select-none">
              <span className="bg-white dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg text-center border border-slate-200/60 dark:border-transparent flex items-center justify-center gap-1">
                ⛽ Fuel Price
              </span>
              <span className="bg-[#0284c7] text-white py-1 px-2 rounded-lg text-center shadow-xs flex items-center justify-center gap-1">
                📈 Stocks
              </span>
              <span className="bg-white dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg text-center border border-slate-200/60 dark:border-transparent flex items-center justify-center gap-1">
                🏏 Cricket
              </span>
            </div>
            {/* Card Body */}
            {renderStocksCard()}
          </div>

          {/* Card 3: Cricket */}
          <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center justify-between pb-1 select-none">
              <span className="bg-[#7c3aed] text-white text-[12px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                ((•)) Live Center
              </span>
              <span className="bg-red-50 dark:bg-red-950/40 text-[#B3121B] text-[10.5px] font-black px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B3121B]" /> LIVE
              </span>
            </div>
            {/* Tabs Row */}
            <div className="grid grid-cols-3 gap-1.5 text-[11.5px] font-extrabold select-none">
              <span className="bg-white dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg text-center border border-slate-200/60 dark:border-transparent flex items-center justify-center gap-1">
                ⛽ Fuel Price
              </span>
              <span className="bg-white dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg text-center border border-slate-200/60 dark:border-transparent flex items-center justify-center gap-1">
                📈 Stocks
              </span>
              <span className="bg-[#7c3aed] text-white py-1 px-2 rounded-lg text-center shadow-xs flex items-center justify-center gap-1">
                🏏 Cricket
              </span>
            </div>
            {/* Card Body */}
            {renderCricketCard()}
          </div>
        </div>

        {/* ── Bottom Live Highlights Ticker Bar ── */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2.5 select-none w-full text-[12px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="bg-red-50 text-[#B3121B] border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400 text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs shrink-0">
              <Zap className="h-3.5 w-3.5 fill-[#B3121B] text-[#B3121B]" />
              Live Highlights
            </span>
          </div>

          <div className="flex-1 flex items-center gap-3.5 font-bold text-slate-700 dark:text-slate-300 overflow-x-auto scrollbar-hide py-0.5">
            <span className="whitespace-nowrap">
              {stocks[0].name} ₹{stocks[0].value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
              <span className={`font-black ${stocks[0].change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                {stocks[0].change >= 0 ? '▲ +' : '▼ '}
                {stocks[0].changePercent.toFixed(2)}%
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="whitespace-nowrap">
              {stocks[1].name} ₹{stocks[1].value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
              <span className={`font-black ${stocks[1].change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                {stocks[1].change >= 0 ? '▲ +' : '▼ '}
                {stocks[1].changePercent.toFixed(2)}%
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="whitespace-nowrap">
              {stocks[2].name} ₹{stocks[2].value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}{' '}
              <span className={`font-black ${stocks[2].change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                {stocks[2].change >= 0 ? '▲ +' : '▼ '}
                {stocks[2].changePercent.toFixed(2)}%
              </span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">Petrol ₹{activeFuel.petrol}/L</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">Diesel ₹{activeFuel.diesel}/L</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">CNG ₹{activeFuel.cng}/Kg</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">
              USD ₹{usdRate.rate} <span className="text-red-600 font-black">▼ {usdRate.change}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">Gold 24K ₹78,450/10g</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export { LiveCenterSection };
