'use client';

import React, { useState, useEffect } from 'react';
import { Fuel, TrendingUp, Trophy, Shield, Megaphone, ChevronDown } from 'lucide-react';
import type { Language } from '@/types';
import { getLiveCenterData } from '@/lib/api';

const FUEL_PRICE_CITY_MAP: Record<string, { petrol: string; diesel: string; cng: string }> = {
  Ahmedabad: { petrol: '101.83', diesel: '97.92', cng: '98.47' },
  Vadodara: { petrol: '101.46', diesel: '97.57', cng: '96.55' },
  Surat: { petrol: '101.82', diesel: '97.95', cng: '88.76' },
  Rajkot: { petrol: '101.85', diesel: '97.99', cng: '88.76' },
};

export default function LiveCenterSection({ language }: { language: Language }) {
  const [fuelCity, setFuelCity] = useState('Ahmedabad');
  const [fuelPrices, setFuelPrices] = useState(FUEL_PRICE_CITY_MAP);
  const [mobileTab, setMobileTab] = useState<'fuel' | 'stocks' | 'cricket' | 'football'>('fuel');

  // Live Stock Market state
  const [stocks, setStocks] = useState([
    { name: 'Nifty 50', exchange: 'NSE', value: 25255.1, change: 210.4, changePercent: 0.84 },
    { name: 'BSE Sensex', exchange: 'BSE', value: 81879.4, change: 772.8, changePercent: 0.95 },
    { name: 'Nifty Bank', exchange: 'NSE', value: 60792.4, change: 1051.2, changePercent: 1.76 },
  ]);

  // Live Exchange Rate
  const [usdRate, setUsdRate] = useState<{ rate: string; change: string }>({ rate: '83.92', change: '-0.12' });

  // Live Cricket state
  const [cricketMatches, setCricketMatches] = useState([
    { title: 'Pakistan v Sri Lanka', statusType: 'live', statusText: 'LIVE', team1: 'PAK', team1Score: '434/9d', team2: 'SL', team2Score: '404/4 (102 ov)' },
    { title: 'Pakistan v Sri Lanka', statusType: 'result', statusText: 'Result', team1: 'PAK', team1Score: '181 (42.5 ov)', team2: 'SL', team2Score: '296/9' },
    { title: 'DC v KKR', statusType: 'result', statusText: 'Result', team1: 'DC', team1Score: '135/5', team2: 'KKR', team2Score: '136/7 (19.5 ov)' },
  ]);

  // Live Football state
  const [footballMatches, setFootballMatches] = useState([
    { league: 'ISL', statusType: 'live', statusText: "75'", homeTeam: 'Mumbai City FC', homeScore: '2', awayTeam: 'Mohun Bagan', awayScore: '1' },
    { league: 'EPL', statusType: 'time', statusText: '22:00', homeTeam: 'Man City', homeScore: '—', awayTeam: 'Arsenal', awayScore: '—' },
    { league: 'La Liga', statusType: 'time', statusText: '23:00', homeTeam: 'Real Madrid', homeScore: '—', awayTeam: 'Barcelona', awayScore: '—' },
  ]);

  // Fetch live center data from API with periodic refresh every 2.5 minutes
  useEffect(() => {
    let isMounted = true;

    const loadLiveCenterData = async () => {
      try {
        const data = await getLiveCenterData();
        if (data && isMounted) {
          if (data.fuelPrices) setFuelPrices(data.fuelPrices);
          if (data.stocks) setStocks(data.stocks);
          if (data.usdRate) setUsdRate(data.usdRate);
          if (Array.isArray(data.cricketMatches) && data.cricketMatches.length > 0) {
            setCricketMatches(data.cricketMatches.filter((m: any) => m.team1 !== 'Team 1' && m.title !== 'Cricket Match'));
          }
          if (Array.isArray(data.footballMatches) && data.footballMatches.length > 0) {
            setFootballMatches(data.footballMatches);
          }
        }
      } catch {}
    };

    loadLiveCenterData();

    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && data.rates && data.rates.INR) {
          const inrVal = Number(data.rates.INR).toFixed(2);
          setUsdRate({ rate: inrVal, change: '-0.12' });
        }
      })
      .catch(() => {});

    const intervalId = setInterval(loadLiveCenterData, 150000);
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

  /* ── 1. Compact Fuel Card Content ── */
  const renderFuelPanel = () => (
    <div className="flex flex-col justify-between h-full rounded-xl bg-gradient-to-b from-[#b8171f] to-[#910d14] text-white p-2.5 sm:p-3 shadow-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/20 select-none">
        <div className="flex items-center gap-1.5">
          <Fuel className="h-4 w-4 text-white shrink-0" />
          <h4 className="text-[13px] font-black tracking-tight leading-none text-white">Fuel Price</h4>
        </div>
        <div className="relative">
          <select
            value={fuelCity}
            onChange={(e) => setFuelCity(e.target.value)}
            className="appearance-none bg-black/35 hover:bg-black/50 text-white text-[11px] font-bold px-2 py-0.5 pr-5 rounded border border-white/25 focus:outline-none cursor-pointer"
          >
            <option value="Ahmedabad" className="bg-slate-900 text-white">Ahmedabad</option>
            <option value="Vadodara" className="bg-slate-900 text-white">Vadodara</option>
            <option value="Surat" className="bg-slate-900 text-white">Surat</option>
            <option value="Rajkot" className="bg-slate-900 text-white">Rajkot</option>
          </select>
          <ChevronDown className="h-3 w-3 text-white absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-1.5 py-1.5">
        {[
          { name: 'Petrol', price: activeFuel.petrol, unit: '/L', symbol: 'P', symBg: 'bg-white text-red-700' },
          { name: 'Diesel', price: activeFuel.diesel, unit: '/L', symbol: 'D', symBg: 'bg-white text-blue-700' },
          { name: 'CNG', price: activeFuel.cng, unit: '/Kg', symbol: 'C', symBg: 'bg-white text-emerald-700' },
        ].map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between rounded-lg bg-white/95 text-slate-900 px-2.5 py-1 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shadow-2xs shrink-0 ${item.symBg}`}>
                {item.symbol}
              </span>
              <span className="font-bold text-[12px]">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="font-black text-[13px] text-slate-900">₹{item.price}</span>
              <span className="text-[9.5px] font-semibold text-slate-500 ml-0.5">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] font-bold text-white/70 select-none pt-0.5 leading-none">
        Source: API Mitra & IOCL
      </p>
    </div>
  );

  /* ── 2. Compact Stock Market Content ── */
  const renderStocksPanel = () => (
    <div className="flex flex-col justify-between h-full rounded-xl bg-gradient-to-b from-[#181c24] to-[#0e1117] text-white p-2.5 sm:p-3 border border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 select-none">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-sky-400 shrink-0" />
          <h4 className="text-[13px] font-black tracking-tight leading-none text-white">Stock Market</h4>
        </div>
        <span className="text-[9.5px] font-black text-slate-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
          India ₹ INR
        </span>
      </div>

      <div className="space-y-1.5 py-1.5">
        {stocks.slice(0, 3).map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-lg bg-[#12151b] border border-white/[0.06] px-2.5 py-1 hover:border-white/20 transition-colors"
          >
            <div>
              <span className="font-extrabold text-[12px] text-white block leading-none">{item.name}</span>
              <span className="text-[9px] font-bold text-slate-400 leading-none">{item.exchange}</span>
            </div>
            <div className="text-right">
              <span className="font-black text-[12.5px] text-white block leading-none">
                ₹{item.value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
              <span className={`text-[9.5px] font-extrabold leading-none ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] font-bold text-slate-400 select-none pt-0.5 leading-none">
        Source: BharatStock & Yahoo
      </p>
    </div>
  );

  /* ── 3. Compact Cricket Content ── */
  const renderCricketPanel = () => (
    <div className="flex flex-col justify-between h-full rounded-xl bg-gradient-to-b from-[#b8171f] to-[#910d14] text-white p-2.5 sm:p-3 shadow-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/20 select-none">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-300 shrink-0" />
          <h4 className="text-[13px] font-black tracking-tight leading-none text-white">Cricket</h4>
        </div>
        <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="space-y-1.5 py-1.5">
        {cricketMatches.slice(0, 3).map((match, i) => (
          <div
            key={i}
            className="rounded-lg bg-white/95 text-slate-900 px-2.5 py-1 shadow-2xs"
          >
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 pb-0.5 border-b border-slate-200">
              <span className="truncate max-w-[120px] font-black text-slate-800">{match.title}</span>
              <span className={`px-1 rounded text-[8.5px] font-black ${
                match.statusType === 'live'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {match.statusText}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-800 pt-0.5">
              <span>{match.team1}: <strong className="font-black text-slate-950">{match.team1Score}</strong></span>
              <span>{match.team2}: <strong className="font-black text-slate-950">{match.team2Score}</strong></span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] font-bold text-white/70 select-none pt-0.5 leading-none">
        Source: Cricket DB & ESPN
      </p>
    </div>
  );

  /* ── 4. Compact Football Content ── */
  const renderFootballPanel = () => (
    <div className="flex flex-col justify-between h-full rounded-xl bg-gradient-to-b from-[#181c24] to-[#0e1117] text-white p-2.5 sm:p-3 border border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 select-none">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-sky-400 shrink-0" />
          <h4 className="text-[13px] font-black tracking-tight leading-none text-white">Football</h4>
        </div>
        <span className="text-[9.5px] font-black text-slate-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
          Scores
        </span>
      </div>

      <div className="space-y-1.5 py-1.5">
        {footballMatches.slice(0, 3).map((match, i) => (
          <div
            key={i}
            className="rounded-lg bg-[#12151b] border border-white/[0.06] px-2.5 py-1"
          >
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 pb-0.5 border-b border-white/[0.06]">
              <span className="truncate max-w-[120px] font-black text-slate-200">{match.league}</span>
              <span className={`px-1 rounded text-[8.5px] font-black ${
                match.statusType === 'live'
                  ? 'bg-red-900/60 text-red-200'
                  : 'bg-white/10 text-slate-300'
              }`}>
                {match.statusText}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 pt-0.5">
              <span className="truncate max-w-[110px]">{match.homeTeam} <strong className="text-white font-black">{match.homeScore}</strong></span>
              <span className="truncate max-w-[110px] text-right"><strong className="text-white font-black">{match.awayScore}</strong> {match.awayTeam}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] font-bold text-slate-400 select-none pt-0.5 leading-none">
        Source: API-Sports & ESPN
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-2.5 mb-2 sm:mb-2.5">
      {/* ── Compact Elevated Container ── */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#12151c] p-2.5 sm:p-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">

        {/* ── Header Bar ── */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/[0.06] select-none">
          <div className="flex items-center gap-2">
            <span className="bg-[#B3121B] text-white text-[12px] sm:text-[12.5px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              ((•)) Live Center
            </span>
            <span className="hidden sm:inline text-[11.5px] text-muted-foreground font-bold">
              Fuel · Stocks · Sports — 2.5m live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-red-50 dark:bg-red-950/40 text-[#B3121B] dark:text-red-400 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/60 flex items-center gap-1.5 select-none">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B3121B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B3121B]" />
              </span>
              <span>LIVE</span>
            </span>
          </div>
        </div>

        {/* ── MOBILE TABS (< md): Allows switching with 1 tap, reducing mobile height by 85% ── */}
        <div className="flex md:hidden items-center gap-1.5 pt-2 pb-1 overflow-x-auto scrollbar-hide select-none">
          {[
            { id: 'fuel' as const, label: '⛽ Fuel Price' },
            { id: 'stocks' as const, label: '📈 Stocks' },
            { id: 'cricket' as const, label: '🏏 Cricket' },
            { id: 'football' as const, label: '⚽ Football' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={`text-[11.5px] font-black px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                mobileTab === tab.id
                  ? 'bg-[#B3121B] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MOBILE CONTENT (< md): Shows only the selected tab in a compact card ── */}
        <div className="block md:hidden pt-1.5">
          {mobileTab === 'fuel' && renderFuelPanel()}
          {mobileTab === 'stocks' && renderStocksPanel()}
          {mobileTab === 'cricket' && renderCricketPanel()}
          {mobileTab === 'football' && renderFootballPanel()}
        </div>

        {/* ── DESKTOP CONTENT (>= md): Sleek 4-Column Compact Grid (<200px height) ── */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-2.5">
          {renderFuelPanel()}
          {renderStocksPanel()}
          {renderCricketPanel()}
          {renderFootballPanel()}
        </div>

        {/* ── Bottom Live Highlights Ticker Bar ── */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 select-none w-full text-[11px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="bg-[#B3121B] text-white text-[10.5px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-xs shrink-0">
              <Megaphone className="h-3 w-3" />
              Live Highlights
            </span>
          </div>

          <div className="flex-1 flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300 overflow-x-auto scrollbar-hide py-0.5">
            <span className="whitespace-nowrap">{stocks[0].name} ₹{stocks[0].value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className={`font-black ${stocks[0].change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>{stocks[0].change >= 0 ? '▲' : '▼'} {stocks[0].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="whitespace-nowrap">{stocks[1].name} ₹{stocks[1].value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className={`font-black ${stocks[1].change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>{stocks[1].change >= 0 ? '▲' : '▼'} {stocks[1].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="whitespace-nowrap">{stocks[2].name} ₹{stocks[2].value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} <span className={`font-black ${stocks[2].change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>{stocks[2].change >= 0 ? '▲' : '▼'} {stocks[2].change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">Petrol ₹{activeFuel.petrol}/L</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">Diesel ₹{activeFuel.diesel}/L</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">USD ₹{usdRate.rate} <span className="text-red-600 font-black">▼ {usdRate.change}</span></span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="whitespace-nowrap">Gold 24K ₹78,450/10g</span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* --- Weather Dashboard Section (Preserved) --------------------------------- */
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
