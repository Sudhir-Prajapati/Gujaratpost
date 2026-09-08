'use client';

import React, { useState } from 'react';
import { CloudSun, RefreshCw, MapPin } from 'lucide-react';
import { fetchLiveCityWeather, GUJARAT_CITIES_COORDS, getIconFromConditionText } from '@/lib/weather';

export interface WeatherData {
  city: string;
  high: string;
  low: string;
  condition: string;
  icon?: string;
}

interface WeatherEditorProps {
  data: WeatherData;
  onChange: (newData: WeatherData) => void;
  selectedCityName?: string;
}

const WEATHER_ICONS = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '🌦️', '❄️', '🌫️'];

export const WeatherEditor: React.FC<WeatherEditorProps> = ({ data, onChange, selectedCityName }) => {
  const [loading, setLoading] = useState(false);
  const [selectedCityKey, setSelectedCityKey] = useState<string>('ahmedabad');

  const handleFetchLive = async (cityKeyToUse?: string) => {
    setLoading(true);
    try {
      const cityToFetch = cityKeyToUse || data.city || selectedCityName || 'અમદાવાદ';
      const live = await fetchLiveCityWeather(cityToFetch);
      onChange({
        city: live.city,
        high: live.high,
        low: live.low,
        condition: live.condition,
        icon: live.icon,
      });
    } catch (err) {
      console.warn('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof WeatherData, val: string) => {
    const updated = {
      ...data,
      [field]: val,
    };
    // Auto-update icon if condition changes
    if (field === 'condition') {
      updated.icon = getIconFromConditionText(val);
    }
    onChange(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">આજનું હવામાન (Weather Box)</h4>
            <p className="text-[10px] text-slate-400">ઓપન-મેટિયો લાઈવ હવામાન સેવા</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleFetchLive(selectedCityKey)}
          disabled={loading}
          className="flex items-center gap-1 text-[11px] font-black bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
          title="Open-Meteo API પરથી લાઈવ ડેટા મેળવો"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'ફેચ...' : 'લાઈવ મેળવો'}</span>
        </button>
      </div>

      {/* City Select Dropdown */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span>શહેર પસંદ કરો (Select City):</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedCityKey}
            onChange={(e) => {
              const newKey = e.target.value;
              setSelectedCityKey(newKey);
              const info = GUJARAT_CITIES_COORDS[newKey];
              if (info) {
                handleFieldChange('city', info.nameGu);
                handleFetchLive(newKey);
              }
            }}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Object.entries(GUJARAT_CITIES_COORDS).map(([key, info]) => (
              <option key={key} value={key}>
                {info.nameGu} ({info.nameEn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weather Icon Selector Palette */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-300 block">
          હવામાન આઇકન પસંદ કરો:
        </label>
        <div className="grid grid-cols-8 gap-1 p-2 bg-slate-950 border border-slate-800 rounded-xl">
          {WEATHER_ICONS.map((ic) => {
            const isSelected = (data.icon || '⛅') === ic;
            return (
              <button
                key={ic}
                type="button"
                onClick={() => handleFieldChange('icon', ic)}
                className={`text-xl p-1 rounded-lg transition hover:scale-115 flex items-center justify-center cursor-pointer ${
                  isSelected ? 'bg-blue-600/30 border border-blue-500 scale-110 shadow-sm' : 'hover:bg-slate-800'
                }`}
                title={ic}
              >
                {ic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition & City Inputs */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">શહેરનું નામ:</label>
          <input
            type="text"
            value={data.city || 'અમદાવાદ'}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-bold outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">હવામાન સ્થિતિ:</label>
          <input
            type="text"
            value={data.condition || 'આંશિક વાદળછાયું'}
            onChange={(e) => handleFieldChange('condition', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-bold outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Temperatures */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">મહત્તમ તાપમાન:</label>
          <input
            type="text"
            value={data.high || '૩૪°C'}
            onChange={(e) => handleFieldChange('high', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-bold outline-none focus:border-blue-500"
            placeholder="૩૪°C"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">લઘુત્તમ તાપમાન:</label>
          <input
            type="text"
            value={data.low || '૨૬°C'}
            onChange={(e) => handleFieldChange('low', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-bold outline-none focus:border-blue-500"
            placeholder="૨૬°C"
          />
        </div>
      </div>
    </div>
  );
};
