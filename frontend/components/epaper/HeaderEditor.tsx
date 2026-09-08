'use client';

import React, { useState, useEffect } from 'react';
import {
  Type,
  Quote,
  CloudSun,
  Layers,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  Globe,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Page1Data } from './types';
import {
  fetchLiveCityWeather,
  GUJARAT_CITIES_COORDS,
  getIconFromConditionText,
  toGujaratiDigits,
} from '@/lib/weather';

interface HeaderEditorProps {
  data: Page1Data;
  onChange: (updatedData: Partial<Page1Data>) => void;
  selectedSubfield?: string;
  onSelectSubfield?: (field: string) => void;
  defaultCity?: string;
  defaultDate?: string;
}

const WEATHER_ICONS = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '🌦️', '❄️', '🌫️'];

const QUOTE_PRESETS = [
  {
    quote: '“મહેનતનું ફળ હંમેશા મીઠું હોય છે.”',
    author: '— સ્વામી વિવેકાનંદ',
  },
  {
    quote: '“સત્ય અને અહિંસા એ જ માનવ જીવનનો સાચો માર્ગ છે.”',
    author: '— મહાત્મા ગાંધી',
  },
  {
    quote: '“ઉઠો, જાગો અને ધ્યેય પ્રાપ્તિ સુધી મંડ્યા રહો.”',
    author: '— સ્વામી વિવેકાનંદ',
  },
  {
    quote: '“એકતામાં જ અખંડ ભારતની સાચી તાકાત છે.”',
    author: '— સરદાર વલ્લભભાઈ પટેલ',
  },
  {
    quote: '“શિક્ષણ એ જીવનનું સૌથી શક્તિશાળી હથિયાર છે.”',
    author: '— ડૉ. એ.પી.જે. અબ્દુલ કલામ',
  },
  {
    quote: '“સમય અને સંજોગો ગમે તેવા હોય, સકારાત્મક વિચાર જ વિજય અપાવે છે.”',
    author: '— ગુજરાતી સુવિચાર',
  },
];

const MASTHEAD_PRESETS = [
  'ગુજરાત પોસ્ટ',
  'ગુજરાત સમાચાર',
  'સંદેશ',
  'દિવ્ય ભાસ્કર',
];

const TAGLINE_PRESETS = [
  'ગુજરાતનું અગ્રણી દૈનિક વર્તમાનપત્ર',
  'ગુજરાતનું વિશ્વસનીય દૈનિક સમાચારપત્ર',
  'સત્ય, સાહસ અને સમર્પણ',
  'વાચકોનો અવાજ, ગુજરાતની ઓળખ',
];

const WEATHER_CONDITION_PRESETS = [
  'વાદળછાયું વાતાવરણ',
  'આંશિક વાદળછાયું',
  'સાફ આકાશ / તડકો',
  'ભારે વરસાદ',
  'હળવા વરસાદી ઝાપટાં',
  'ઠંડો પવન',
];

const PRICE_PRESETS = ['₹ 3.00', '₹ 4.00', '₹ 5.00', '₹ 6.00'];

export const HeaderEditor: React.FC<HeaderEditorProps> = ({
  data,
  onChange,
  selectedSubfield,
  onSelectSubfield,
  defaultCity,
  defaultDate,
}) => {
  // Current values with robust fallbacks
  const mastheadTitle = data.mastheadTitle || 'ગુજરાત પોસ્ટ';
  const mastheadTagline = data.mastheadTagline || 'ગુજરાતનું અગ્રણી દૈનિક વર્તમાનપત્ર';

  const quoteText = data.quote?.text || '“મહેનતનું ફળ હંમેશા મીઠું હોય છે.”';
  const quoteAuthor = data.quote?.author || '— સ્વામી વિવેકાનંદ';

  const weatherCity = data.weather?.city || data.city || defaultCity || 'અમદાવાદ';
  const weatherHigh = data.weather?.high || '૩૪°C';
  const weatherLow = data.weather?.low || '૨૬°C';
  const weatherCondition = data.weather?.condition || 'વાદળછાયું વાતાવરણ';
  const weatherIcon = data.weather?.icon || '⛅';

  const editionRni = data.editionBar?.rniNo || 'RNI No. GUJGUJ/2011/40000';
  const editionDayDate = data.editionBar?.dayDate || data.date || defaultDate || '2026-09-08';
  const editionYearIssue = data.editionBar?.yearIssue || data.editionInfo || 'વર્ષ ૨૬ • અંક ૧૮૨';
  const editionCity = data.editionBar?.city || data.city || defaultCity || 'અમદાવાદ';
  const editionWebsite = data.editionBar?.website || 'www.gujaratpost.com';
  const editionPrice = data.editionBar?.price || data.price || '₹ 5.00';

  // Section accordion expansion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    masthead: true,
    quote: true,
    weather: true,
    editionBar: true,
  });

  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedCityKey, setSelectedCityKey] = useState<string>('ahmedabad');

  // Auto-expand section based on selectedSubfield from canvas click
  useEffect(() => {
    if (!selectedSubfield) return;
    if (selectedSubfield.startsWith('masthead')) {
      setOpenSections((prev) => ({ ...prev, masthead: true }));
    } else if (selectedSubfield.startsWith('quote')) {
      setOpenSections((prev) => ({ ...prev, quote: true }));
    } else if (selectedSubfield.startsWith('weather')) {
      setOpenSections((prev) => ({ ...prev, weather: true }));
    } else if (selectedSubfield.startsWith('editionBar')) {
      setOpenSections((prev) => ({ ...prev, editionBar: true }));
    }
  }, [selectedSubfield]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Updaters
  const updateMasthead = (title?: string, tagline?: string) => {
    onChange({
      mastheadTitle: title !== undefined ? title : mastheadTitle,
      mastheadTagline: tagline !== undefined ? tagline : mastheadTagline,
    });
  };

  const updateQuote = (text?: string, author?: string) => {
    onChange({
      quote: {
        text: text !== undefined ? text : quoteText,
        author: author !== undefined ? author : quoteAuthor,
      },
    });
  };

  const updateWeather = (partial: Partial<NonNullable<Page1Data['weather']>>) => {
    const updated = {
      city: partial.city !== undefined ? partial.city : weatherCity,
      high: partial.high !== undefined ? partial.high : weatherHigh,
      low: partial.low !== undefined ? partial.low : weatherLow,
      condition: partial.condition !== undefined ? partial.condition : weatherCondition,
      icon: partial.icon !== undefined ? partial.icon : weatherIcon,
    };
    if (partial.condition && !partial.icon) {
      updated.icon = getIconFromConditionText(partial.condition);
    }
    onChange({ weather: updated });
  };

  const updateEditionBar = (partial: Partial<NonNullable<Page1Data['editionBar']>>) => {
    const updated = {
      rniNo: partial.rniNo !== undefined ? partial.rniNo : editionRni,
      dayDate: partial.dayDate !== undefined ? partial.dayDate : editionDayDate,
      yearIssue: partial.yearIssue !== undefined ? partial.yearIssue : editionYearIssue,
      city: partial.city !== undefined ? partial.city : editionCity,
      website: partial.website !== undefined ? partial.website : editionWebsite,
      price: partial.price !== undefined ? partial.price : editionPrice,
    };
    onChange({
      editionBar: updated,
      // Keep top-level mirrors synchronized
      city: updated.city,
      date: updated.dayDate,
      editionInfo: updated.yearIssue,
      price: updated.price,
    });
  };

  const handleFetchLiveWeather = async (targetCityKey?: string) => {
    setWeatherLoading(true);
    try {
      const cityToFetch =
        (targetCityKey && GUJARAT_CITIES_COORDS[targetCityKey]?.nameGu) ||
        weatherCity ||
        'અમદાવાદ';
      const live = await fetchLiveCityWeather(cityToFetch);
      updateWeather({
        city: live.city,
        high: live.high,
        low: live.low,
        condition: live.condition,
        icon: live.icon,
      });
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSetTodayDate = () => {
    const today = new Date();
    const gujaratiDays = [
      'રવિવાર',
      'સોમવાર',
      'મંગળવાર',
      'બુધવાર',
      'ગુરુવાર',
      'શુક્રવાર',
      'શનિવાર',
    ];
    const gujaratiMonths = [
      'જાન્યુઆરી',
      'ફેબ્રુઆરી',
      'માર્ચ',
      'એપ્રિલ',
      'મે',
      'જૂન',
      'જુલાઈ',
      'ઓગસ્ટ',
      'સપ્ટેમ્બર',
      'ઓક્ટોબર',
      'નવેમ્બર',
      'ડિસેમ્બર',
    ];

    const dayName = gujaratiDays[today.getDay()];
    const dateNum = toGujaratiDigits(today.getDate());
    const monthName = gujaratiMonths[today.getMonth()];
    const yearNum = toGujaratiDigits(today.getFullYear());

    const formattedGujaratiDate = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
    updateEditionBar({ dayDate: formattedGujaratiDate });
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* ─── Studio Header Badge ─── */}
      <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border border-red-900/40 rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <span>અખબાર હેડર સ્ટુડિયો</span>
                <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono uppercase">
                  Full Header
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                માસ્ટહેડ, સુકૃતિવચન, હવામાન અને એડિશન બાર
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* 1. MASTHEAD TITLE & TAGLINE SECTION                       */}
      {/* ───────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border transition-all ${
          selectedSubfield?.startsWith('masthead')
            ? 'bg-slate-900 border-red-500/60 shadow-lg ring-1 ring-red-500/30'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div
          onClick={() => toggleSection('masthead')}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800/60"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🏛️</span>
            <div>
              <h4 className="text-xs font-black text-white">માસ્ટહેડ શિર્ષક & ટૅગલાઇન</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                અખબારનું મુખ્ય નામ અને સ્લોગન
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-red-400 font-serif">
              {mastheadTitle}
            </span>
            {openSections.masthead ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {openSections.masthead && (
          <div className="p-4 space-y-4">
            {/* Masthead Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-red-400" />
                  <span>અખબાર શીર્ષક (Masthead Title) *</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {mastheadTitle.length} chars
                </span>
              </div>
              <input
                type="text"
                value={mastheadTitle}
                onChange={(e) => updateMasthead(e.target.value, undefined)}
                placeholder="દા.ત. ગુજરાત પોસ્ટ"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-red-500 font-black font-serif tracking-tight outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {MASTHEAD_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateMasthead(p, undefined)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                      mastheadTitle === p
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Masthead Tagline */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ટૅગલાઇન / સ્લોગન (Masthead Tagline)</span>
              </label>
              <input
                type="text"
                value={mastheadTagline}
                onChange={(e) => updateMasthead(undefined, e.target.value)}
                placeholder="દા.ત. ગુજરાતનું અગ્રણી દૈનિક વર્તમાનપત્ર"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {TAGLINE_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateMasthead(undefined, t)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition cursor-pointer truncate max-w-full ${
                      mastheadTagline === t
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* 2. SUKRUTIVACHAN (QUOTE BOX - TOP LEFT)                   */}
      {/* ───────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border transition-all ${
          selectedSubfield?.startsWith('quote')
            ? 'bg-slate-900 border-red-500/60 shadow-lg ring-1 ring-red-500/30'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div
          onClick={() => toggleSection('quote')}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800/60"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">💬</span>
            <div>
              <h4 className="text-xs font-black text-white">આજનું સુકૃતિવચન (Quote Box)</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                ડાબી બાજુનો પ્રેરણાદાયી સુવિચાર & લેખક
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 max-w-[120px] truncate">
              {quoteAuthor}
            </span>
            {openSections.quote ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {openSections.quote && (
          <div className="p-4 space-y-4">
            {/* Quick Inspiration Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>પ્રેરણાદાયી સુવિચાર પસંદ કરો:</span>
              </label>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {QUOTE_PRESETS.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => updateQuote(qp.quote, qp.author)}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition cursor-pointer group"
                  >
                    <p className="text-[11px] text-slate-200 font-serif italic group-hover:text-amber-200">
                      {qp.quote}
                    </p>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      {qp.author}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quote Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Quote className="w-3.5 h-3.5 text-amber-400" />
                <span>સુવિચાર લખાણ (Quote Text) *</span>
              </label>
              <textarea
                rows={3}
                value={quoteText}
                onChange={(e) => updateQuote(e.target.value, undefined)}
                placeholder="દા.ત. “મહેનતનું ફળ હંમેશા મીઠું હોય છે.”"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-serif italic leading-relaxed outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 resize-none"
              />
            </div>

            {/* Quote Author */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                વિચારક / લેખકનું નામ (Author):
              </label>
              <input
                type="text"
                value={quoteAuthor}
                onChange={(e) => updateQuote(undefined, e.target.value)}
                placeholder="દા.ત. — સ્વામી વિવેકાનંદ"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* 3. WEATHER BOX (TOP RIGHT)                                */}
      {/* ───────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border transition-all ${
          selectedSubfield?.startsWith('weather')
            ? 'bg-slate-900 border-red-500/60 shadow-lg ring-1 ring-red-500/30'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div
          onClick={() => toggleSection('weather')}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800/60"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">⛅</span>
            <div>
              <h4 className="text-xs font-black text-white">આજનું હવામાન (Live Weather)</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                ઓપન-મેટિયો લાઈવ હવામાન & તાપમાન
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
              <span>{weatherIcon}</span>
              <span>{weatherCity}</span>
              <span>{weatherHigh}</span>
            </span>
            {openSections.weather ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {openSections.weather && (
          <div className="p-4 space-y-4">
            {/* Live Fetch Toolbar */}
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white">લાઈવ હવામાન ડેટા</span>
              </div>
              <button
                type="button"
                onClick={() => handleFetchLiveWeather(selectedCityKey)}
                disabled={weatherLoading}
                className="flex items-center gap-1 text-[11px] font-black bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                title="Open-Meteo API પરથી લાઈવ ડેટા મેળવો"
              >
                <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                <span>{weatherLoading ? 'ફેચ...' : '🔄 લાઈવ મેળવો'}</span>
              </button>
            </div>

            {/* City Selection from Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>ગુજરાત શહેર પસંદ કરો:</span>
              </label>
              <select
                value={selectedCityKey}
                onChange={(e) => {
                  const newKey = e.target.value;
                  setSelectedCityKey(newKey);
                  const info = GUJARAT_CITIES_COORDS[newKey];
                  if (info) {
                    updateWeather({ city: info.nameGu });
                    handleFetchLiveWeather(newKey);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.entries(GUJARAT_CITIES_COORDS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.nameGu} ({info.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Weather Icon Palette */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                હવામાન આઇકન (Weather Emoji Icon):
              </label>
              <div className="grid grid-cols-8 gap-1 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                {WEATHER_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => updateWeather({ icon: ic })}
                    className={`text-lg p-1 rounded-lg transition flex items-center justify-center cursor-pointer ${
                      weatherIcon === ic
                        ? 'bg-blue-600/30 border border-blue-500 scale-110 shadow-sm'
                        : 'hover:bg-slate-800'
                    }`}
                    title={ic}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* City & Condition Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 block">
                  શહેરનું નામ:
                </label>
                <input
                  type="text"
                  value={weatherCity}
                  onChange={(e) => updateWeather({ city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 block">
                  સ્થિતિ (Condition):
                </label>
                <input
                  type="text"
                  value={weatherCondition}
                  onChange={(e) => updateWeather({ condition: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Condition Quick Chips */}
            <div className="flex flex-wrap gap-1">
              {WEATHER_CONDITION_PRESETS.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => updateWeather({ condition: cond })}
                  className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                    weatherCondition === cond
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>

            {/* Temperatures (High / Low) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 block">
                  મહત્તમ તાપમાન (Max High):
                </label>
                <input
                  type="text"
                  value={weatherHigh}
                  onChange={(e) => updateWeather({ high: e.target.value })}
                  placeholder="૩૪°C"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 block">
                  લઘુત્તમ તાપમાન (Min Low):
                </label>
                <input
                  type="text"
                  value={weatherLow}
                  onChange={(e) => updateWeather({ low: e.target.value })}
                  placeholder="૨૬°C"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* 4. EDITION DETAILS BAR (BOTTOM STRIP)                     */}
      {/* ───────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border transition-all ${
          selectedSubfield?.startsWith('editionBar')
            ? 'bg-slate-900 border-red-500/60 shadow-lg ring-1 ring-red-500/30'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
        }`}
      >
        <div
          onClick={() => toggleSection('editionBar')}
          className="p-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800/60"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">📰</span>
            <div>
              <h4 className="text-xs font-black text-white">અખબાર વિગત પટ્ટી (Edition Bar)</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                RNI નંબર, તારીખ, અંક, વેબસાઈટ અને કિંમત
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400">
              {editionPrice}
            </span>
            {openSections.editionBar ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {openSections.editionBar && (
          <div className="p-4 space-y-4">
            {/* RNI Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                RNI રજિસ્ટ્રેશન નંબર:
              </label>
              <input
                type="text"
                value={editionRni}
                onChange={(e) => updateEditionBar({ rniNo: e.target.value })}
                placeholder="RNI No. GUJGUJ/2011/40000"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono font-bold outline-none focus:border-red-500"
              />
            </div>

            {/* Day & Date with Quick Action */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <span>દિવસ અને તારીખ (Day & Date):</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetTodayDate}
                  className="text-[9.5px] font-bold text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40 cursor-pointer"
                >
                  📅 આજની તારીખ
                </button>
              </div>
              <input
                type="text"
                value={editionDayDate}
                onChange={(e) => updateEditionBar({ dayDate: e.target.value })}
                placeholder="સોમવાર, ૦૭ સપ્ટેમ્બર ૨૦૨૬"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold outline-none focus:border-red-500"
              />
            </div>

            {/* Year & Issue */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 block">
                  વર્ષ અને અંક:
                </label>
                <input
                  type="text"
                  value={editionYearIssue}
                  onChange={(e) => updateEditionBar({ yearIssue: e.target.value })}
                  placeholder="વર્ષ ૨૬ • અંક ૧૮૨"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 block">
                  આવૃત્તિ શહેર:
                </label>
                <input
                  type="text"
                  value={editionCity}
                  onChange={(e) => updateEditionBar({ city: e.target.value })}
                  placeholder="અમદાવાદ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Website & Price */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>વેબસાઈટ URL:</span>
                </label>
                <input
                  type="text"
                  value={editionWebsite}
                  onChange={(e) => updateEditionBar({ website: e.target.value })}
                  placeholder="www.gujaratpost.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono font-bold outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span>અખબાર કિંમત:</span>
                </label>
                <input
                  type="text"
                  value={editionPrice}
                  onChange={(e) => updateEditionBar({ price: e.target.value })}
                  placeholder="₹ 5.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Quick Price Chips */}
            <div className="flex items-center gap-1 pt-1">
              <span className="text-[10px] text-slate-500">ઝડપી કિંમત:</span>
              {PRICE_PRESETS.map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => updateEditionBar({ price: pr })}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                    editionPrice === pr
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
