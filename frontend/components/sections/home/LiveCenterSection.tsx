'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Radio, Fuel, TrendingUp, TrendingDown, Trophy, Wind, ChevronDown, Shield, Megaphone } from 'lucide-react';
import type { Language } from '@/types';
import { getLiveCenterData } from '@/lib/api';

/* --- Live Center Section ─────────────────────────────────────────────────── */
function LivePanel({
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
    ? 'bg-gradient-to-b from-[#C21E26] via-[#A8141B] to-[#8C0B12] text-white border-red-600/40 hover:border-red-400/80 shadow-lg hover:shadow-[0_20px_35px_-10px_rgba(179,18,27,0.45)]'
    : 'bg-gradient-to-b from-[#161A20] via-[#101318] to-[#0A0C0F] text-white border-neutral-800 hover:border-neutral-600/90 shadow-lg hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.85)]';

  const borderLine = variant === 'red' ? 'border-white/20' : 'border-white/10';

  return (
    <div className={`group relative flex flex-col rounded-2xl border p-4.5 overflow-hidden min-h-[420px] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01] ${panelBg}`}>
      {/* Top glowing luxury highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Watermark in background with smooth hover scale */}
      <div className="transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-1 pointer-events-none">
        {watermark}
      </div>

      {/* Header */}
      <div className={`mb-4 flex items-center justify-between pb-2.5 border-b select-none ${borderLine} relative z-10`}>
        <div className="flex items-center gap-2">
          <div className="transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">
            {icon}
          </div>
          <h3 className="text-[16.5px] font-black tracking-tight leading-none text-white drop-shadow-xs">{title}</h3>
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
        <p className={`pt-3 text-[10.5px] font-extrabold select-none mt-4 leading-none transition-colors ${variant === 'red' ? 'text-white/70 group-hover:text-white' : 'text-neutral-400 group-hover:text-neutral-200'}`}>
          {sourceText}
        </p>
      </div>
    </div>
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

const FUEL_PRICE_CITY_MAP: Record<string, { petrol: string; diesel: string; cng: string }> = {
  Ahmedabad: { petrol: '96.42', diesel: '92.17', cng: '76.00' },
  Vadodara: { petrol: '96.08', diesel: '91.83', cng: '75.50' },
  Surat: { petrol: '96.31', diesel: '92.06', cng: '76.20' },
  Rajkot: { petrol: '96.15', diesel: '91.90', cng: '75.80' },
};

export default function LiveCenterSection({ language }: { language: Language }) {
  const [fuelCity, setFuelCity] = useState('Ahmedabad');
  const [fuelPrices, setFuelPrices] = useState(FUEL_PRICE_CITY_MAP);

  // Live Stock Market state
  const [stocks, setStocks] = useState([
    { name: 'Nifty 50', exchange: 'NSE', value: 23456.2, change: 188.4, changePercent: 0.93 },
    { name: 'BSE Sensex', exchange: 'BSE', value: 80309.1, change: 425.6, changePercent: 0.55 },
    { name: 'Nifty Bank', exchange: 'NSE', value: 49640.8, change: -124.1, changePercent: -0.23 }
  ]);

  // Live Exchange Rate
  const [usdRate, setUsdRate] = useState<{ rate: string; change: string }>({ rate: '83.92', change: '-0.12' });

  // Live Cricket state
  const [cricketMatches, setCricketMatches] = useState([
    { title: 'India vs England', statusType: 'live', statusText: 'LIVE', team1: 'India', team1Score: '168/8 (20)', team2: 'England', team2Score: '185/9 (19.2)' },
    { title: 'Ranji Trophy', statusType: 'day', statusText: 'Day 3', team1: 'Gujarat', team1Score: '284/6', team2: 'Mumbai', team2Score: '322/10' },
    { title: 'IPL', statusType: 'time', statusText: '22:00', team1: 'CSK', team1Score: '—', team2: 'MI', team2Score: '—' }
  ]);

  // Live Football state
  const [footballMatches, setFootballMatches] = useState([
    { league: 'ISL', statusType: 'live', statusText: "75'", homeTeam: 'Mumbai City FC', homeScore: '2', awayTeam: 'Mohun Bagan', awayScore: '1' },
    { league: 'EPL', statusType: 'time', statusText: '22:00', homeTeam: 'Man City', homeScore: '—', awayTeam: 'Arsenal', awayScore: '—' },
    { league: 'La Liga', statusType: 'time', statusText: '23:00', homeTeam: 'Real Madrid', homeScore: '—', awayTeam: 'Barcelona', awayScore: '—' }
  ]);

  // Fetch live center data from API
  useEffect(() => {
    getLiveCenterData().then((data) => {
      if (data) {
        if (data.fuelPrices) setFuelPrices(data.fuelPrices);
        if (data.stocks) setStocks(data.stocks);
        if (data.usdRate) setUsdRate(data.usdRate);
        if (data.cricketMatches) setCricketMatches(data.cricketMatches);
        if (data.footballMatches) setFootballMatches(data.footballMatches);
      }
    });

    // Live USD/INR Exchange Rate fetch
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates && data.rates.INR) {
          const inrVal = data.rates.INR.toFixed(2);
          setUsdRate({ rate: inrVal, change: '-0.12' });
        }
      })
      .catch(() => { });

    // Periodic live simulation timer for market and sports ticks every 15s
    const timer = setInterval(() => {
      setStocks((prev) =>
        prev.map((st) => {
          const delta = (Math.random() - 0.48) * 14;
          const newVal = Math.round((st.value + delta) * 10) / 10;
          const newChange = Math.round((st.change + delta) * 10) / 10;
          const newPct = Math.round((newChange / (newVal - newChange)) * 10000) / 100;
          return {
            ...st,
            value: newVal,
            change: newChange,
            changePercent: newPct
          };
        })
      );
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  const activeFuel = fuelPrices[fuelCity] || fuelPrices.Ahmedabad || FUEL_PRICE_CITY_MAP.Ahmedabad;

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-2.5 relative">
      {/* Blurred Red Ambient Glow Orbs in Background */}
      <div className="absolute -top-6 left-10 w-96 h-96 bg-[#B3121B]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-6 right-10 w-[420px] h-[420px] bg-red-600/12 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Container Box */}
      <div className="relative border-2 border-[#B3121B]/40 dark:border-[#B3121B]/30 bg-[#f8f9fa] dark:bg-slate-900/40 rounded-2xl p-6 shadow-md">

        {/* ── Header Row ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b-2 border-[#B3121B]/20 dark:border-[#B3121B]/15 select-none">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="section-heading-badge bg-[#B3121B] text-white text-[13.5px] md:text-[14.5px] font-black px-4.5 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm transition-transform duration-200 hover:scale-105 cursor-default">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              ((•)) Live Center
            </span>
            <span className="text-[12.5px] md:text-[13px] text-muted-foreground font-extrabold">
              Fuel Price · Stock Market · Sports — 2.5 min updates
            </span>
          </div>

          {/* Top Right Live Tag */}
          <span className="bg-red-50 dark:bg-red-950/40 text-[#B3121B] dark:text-red-400 text-[13px] md:text-[13.5px] font-black px-4 py-1.5 rounded-full border border-red-300/90 dark:border-red-800/60 flex items-center gap-2 shadow-2xs tracking-wide select-none transition-transform duration-200 hover:scale-105">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B3121B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B3121B]" />
            </span>
            <span>LIVE</span>
          </span>
        </div>

        {/* ── 4-Column Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-5">

          {/* Panel 1: Fuel Price */}
          <LivePanel
            title="Fuel Price"
            variant="red"
            watermark={FuelWatermark}
            sourceText="Source: IOC / HPCL"
            rightElement={
              <div className="flex items-center gap-1 text-[12px] font-extrabold text-white select-none">
                <div className="relative">
                  <select
                    value={fuelCity}
                    onChange={(e) => setFuelCity(e.target.value)}
                    className="appearance-none bg-red-800/80 text-white text-[11px] font-black px-3 py-1 pr-6 rounded-md border border-red-400/40 focus:outline-none cursor-pointer hover:bg-red-900 transition-all duration-200 hover:scale-105 shadow-2xs"
                  >
                    <option value="Ahmedabad" className="bg-slate-900 text-white">Ahmedabad</option>
                    <option value="Vadodara" className="bg-slate-900 text-white">Vadodara</option>
                    <option value="Surat" className="bg-slate-900 text-white">Surat</option>
                    <option value="Rajkot" className="bg-slate-900 text-white">Rajkot</option>
                  </select>
                  <ChevronDown className="h-3 w-3 text-white absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            }
            icon={<Fuel className="h-5 w-5 text-white" />}
          >
            {[
              { name: 'Petrol', sub: 'Per Litre', price: activeFuel.petrol, unit: '/ Litre', symbol: 'P' as const },
              { name: 'Diesel', sub: 'Per Litre', price: activeFuel.diesel, unit: '/ Litre', symbol: 'D' as const },
              { name: 'CNG', sub: 'Per Kg', price: activeFuel.cng, unit: '/ Kg', symbol: 'C' as const }
            ].map((item) => (
              <div
                key={item.symbol}
                className="flex-1 flex items-center justify-between rounded-xl bg-white px-4 py-3.5 shadow-sm border border-neutral-300/80 transition-all duration-200 hover:bg-rose-50 hover:border-[#B3121B]/50 hover:shadow-md cursor-pointer select-none group/item"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-[15px] shrink-0 transition-colors duration-300 shadow-2xs
                    ${item.symbol === 'P' ? 'bg-red-50 text-red-600 border border-red-200' : ''}
                    ${item.symbol === 'D' ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}
                    ${item.symbol === 'C' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ''}
                  `}>
                    {item.symbol}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[14px] text-neutral-900 leading-none group-hover/item:text-red-700 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[10.5px] font-bold text-neutral-500 mt-1.5 leading-none">
                      {item.sub}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[16.5px] font-black text-neutral-900 leading-none group-hover/item:text-red-700 transition-colors">₹{item.price}</p>
                  <p className="text-[9.5px] font-bold text-neutral-400 mt-1 leading-none">
                    {item.unit}
                  </p>
                </div>
              </div>
            ))}
          </LivePanel>

          {/* Panel 2: Stock Market */}
          <LivePanel
            title="Stock Market"
            variant="black"
            watermark={MarketWatermark}
            sourceText="Source: Yahoo Finance"
            rightElement={
              <span className="text-[11px] font-black text-neutral-300 leading-none whitespace-nowrap px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
                India ₹ INR
              </span>
            }
            icon={<TrendingUp className="h-5 w-5 text-white" />}
          >
            {stocks.map((item) => (
              <div
                key={item.name}
                className="rounded-xl bg-[#14181D] hover:bg-[#1A2027] p-3.5 border border-[#222933] hover:border-[#384353] hover:border-l-4 hover:border-l-emerald-500 shadow-sm transition-all duration-200 hover:scale-[1.025] hover:shadow-lg cursor-pointer select-none group/stock active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-[14px] text-white leading-none group-hover/stock:text-sky-400 transition-colors">{item.name}</p>
                    <p className="text-[10px] font-bold text-neutral-400 mt-1.5 leading-none">{item.exchange}</p>
                  </div>
                  <p className="text-[15.5px] font-black text-white leading-none group-hover/stock:text-white transition-colors">
                    ₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </p>
                </div>
                <div className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-black select-none leading-none
                  ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}
                `}>
                  <span className="text-[12px]">{item.change >= 0 ? '↗' : '↘'}</span>
                  <span>{item.change >= 0 ? '+' : ''}{item.change.toFixed(1)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            ))}
          </LivePanel>

          {/* Panel 3: Cricket */}
          <LivePanel
            title="Cricket"
            variant="red"
            watermark={CricketWatermark}
            sourceText="Source: ESPN"
            icon={<Trophy className="h-5 w-5 text-white" />}
          >
            {cricketMatches.map((match, i) => (
              <div
                key={i}
                className="rounded-xl bg-white p-3.5 shadow-sm border border-neutral-300/80 hover:border-red-400 hover:border-l-4 hover:border-l-red-600 transition-all duration-200 hover:scale-[1.025] hover:shadow-lg hover:bg-neutral-50/90 cursor-pointer select-none group/cricket active:scale-[0.99]"
              >
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-neutral-200">
                  <p className="font-black text-[13px] text-neutral-900 leading-none group-hover/cricket:text-red-700 transition-colors">{match.title}</p>
                  {match.statusType === 'live' ? (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[9px] font-black rounded flex items-center gap-1.5 border border-emerald-300 shadow-2xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
                      </span>
                      {match.statusText || 'LIVE'}
                    </span>
                  ) : match.statusType === 'result' || match.statusText === 'Result' ? (
                    <span className="bg-neutral-800 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-2xs">
                      Result
                    </span>
                  ) : (
                    <span className="text-neutral-500 text-[10px] font-extrabold select-none bg-neutral-100 px-2 py-0.5 rounded">
                      {match.statusText}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-700">
                    <span className="group-hover/cricket:text-neutral-900 transition-colors">{match.team1}</span>
                    <span className="font-black text-neutral-900">{match.team1Score}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-700">
                    <span className="group-hover/cricket:text-neutral-900 transition-colors">{match.team2}</span>
                    <span className="font-black text-neutral-900">{match.team2Score}</span>
                  </div>
                </div>
              </div>
            ))}
          </LivePanel>

          {/* Panel 4: Football */}
          <LivePanel
            title="Football"
            variant="black"
            watermark={FootballWatermark}
            sourceText="Source: ESPN"
            icon={<Shield className="h-5 w-5 text-white" />}
          >
            {footballMatches.map((match, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#14181D] hover:bg-[#1A2027] p-3.5 border border-[#222933] hover:border-[#384353] hover:border-l-4 hover:border-l-sky-500 shadow-sm transition-all duration-200 hover:scale-[1.025] hover:shadow-lg cursor-pointer select-none group/football active:scale-[0.99]"
              >
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-[#222933]">
                  <p className="font-black text-[13px] text-white leading-none group-hover/football:text-sky-400 transition-colors">{match.league}</p>
                  {match.statusType === 'live' ? (
                    <span className="bg-[#B3121B] text-white px-2 py-0.5 text-[9px] font-black rounded flex items-center gap-1.5 shadow-2xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                      {match.statusText || 'LIVE'}
                    </span>
                  ) : match.statusType === 'result' || match.statusText === 'FT' ? (
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[9px] font-black px-2 py-0.5 rounded shadow-2xs">
                      FT
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[10px] font-extrabold select-none bg-white/5 px-2 py-0.5 rounded">
                      {match.statusText}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-300">
                    <span className="group-hover/football:text-white transition-colors">{match.homeTeam}</span>
                    <span className="font-black text-white">{match.homeScore}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-neutral-300">
                    <span className="group-hover/football:text-white transition-colors">{match.awayTeam}</span>
                    <span className="font-black text-white">{match.awayScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </LivePanel>

        </div>

        {/* ── Bottom Live Highlights Ticker Bar ───────────────────── */}
        <div className="mt-6 pt-4 border-t-2 border-[#B3121B]/20 dark:border-[#B3121B]/15 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-[#B3121B] text-white text-[12px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs hover:scale-105 transition-transform duration-200 cursor-default">
              <Megaphone className="h-4 w-4 animate-bounce" />
              Live Highlights
            </span>
          </div>

          <div className="flex items-center gap-4 text-[12px] font-extrabold text-slate-700 dark:text-slate-300 overflow-x-auto scrollbar-hide py-1">
            <span>{stocks[0].name} ₹{stocks[0].value.toLocaleString('en-IN')} <span className={`font-black ${stocks[0].change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{stocks[0].change >= 0 ? '▲' : '▼'} {stocks[0].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>{stocks[1].name} ₹{stocks[1].value.toLocaleString('en-IN')} <span className={`font-black ${stocks[1].change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{stocks[1].change >= 0 ? '▲' : '▼'} {stocks[1].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>{stocks[2].name} ₹{stocks[2].value.toLocaleString('en-IN')} <span className={`font-black ${stocks[2].change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{stocks[2].change >= 0 ? '▲' : '▼'} {stocks[2].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Petrol ₹{activeFuel.petrol} /L</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>USD ₹{usdRate.rate} <span className="text-red-600 font-black">▼ {usdRate.change}</span></span>
          </div>

          <Link
            href="/live-updates"
            className="group/link relative overflow-hidden shrink-0 border-2 border-red-300 dark:border-red-800/80 bg-white dark:bg-slate-900 text-[#B3121B] dark:text-red-400 hover:text-white dark:hover:text-white font-black text-[14px] md:text-[15px] rounded-xl px-4.5 py-1.5 flex items-center gap-1.5 transition-all duration-300 hover:border-[#B3121B] hover:shadow-[0_8px_20px_-3px_rgba(179,18,27,0.45)] hover:-translate-y-0.5 active:scale-95 select-none"
          >
            {/* Sliding vibrant crimson background fill on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-[#C21E26] via-[#B3121B] to-[#8C0B12] transition-transform duration-300 ease-out -translate-x-full group-hover/link:translate-x-0" />

            {/* Sweep light shimmer flare */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover/link:translate-x-full" />

            {/* Content with smooth text color and arrow slide */}
            <span className="relative z-10 transition-colors duration-200">View More Updates</span>
            <span className="relative z-10 font-bold text-base transition-transform duration-300 ease-out group-hover/link:translate-x-1.5">→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

/* --- Weather Dashboard Section --------------------------------------------- */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Vadodara: { lat: 22.3072, lon: 73.1812 },
  Surat: { lat: 21.1702, lon: 72.8311 },
  Rajkot: { lat: 22.3039, lon: 70.8022 },
};

function parseWmoCode(code: number) {
  if (code === 0) return { desc: 'Sunny', descGu: 'તડકો', icon: 'sun' };
  if (code >= 1 && code <= 3) return { desc: 'Partly Cloudy', descGu: 'વાદળછાઈ', icon: 'cloud' };
  if (code === 45 || code === 48) return { desc: 'Mist', descGu: 'ધુમ્મસ', icon: 'cloud' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { desc: 'Rain', descGu: 'વરસાદ', icon: 'rain' };
  if (code >= 95) return { desc: 'Thunderstorm', descGu: 'ગાજવીજ', icon: 'rain' };
  return { desc: 'Clear', descGu: 'સ્વચ્છ', icon: 'sun' };
}

function parseAqi(val: number) {
  if (val <= 50) return { label: 'Good', labelGu: 'સારું' };
  if (val <= 100) return { label: 'Satisfactory', labelGu: 'સંતોષકારક' };
  if (val <= 200) return { label: 'Moderate', labelGu: 'સાધારણ' };
  if (val <= 300) return { label: 'Poor', labelGu: 'ખરાબ' };
  return { label: 'Very Poor', labelGu: 'અતિ ખરાબ' };
}

export { LiveCenterSection };



