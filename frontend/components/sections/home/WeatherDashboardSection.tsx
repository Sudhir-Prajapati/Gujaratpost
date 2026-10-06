'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cloud, Sun, CloudRain, Wind, Droplet, Thermometer, ChevronDown, ArrowUpRight } from 'lucide-react';
import type { Language } from '@/types';
import { CITY_COORDS, parseWmoCode, parseAqi } from './homeHelpers';

export default function WeatherDashboardSection({ language }: { language: Language }) {
  const [activeTab, setActiveTab] = useState<'weather' | 'aqi'>('weather');
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [lastUpdateStr, setLastUpdateStr] = useState('');

  const isGu = language === 'gu';

  // Weather data state with default fallbacks
  const [weatherData, setWeatherData] = useState<Record<string, { temp: string; desc: string; descGu: string; icon: string; humidity: string; wind: string }>>({
    Ahmedabad: { temp: '29', desc: 'Mist', descGu: 'ધુમ્મસ', icon: 'cloud', humidity: '68%', wind: '19 km/h' },
    Vadodara: { temp: '31.7', desc: 'Partly Cloudy', descGu: 'વાદળછાઈ', icon: 'cloud', humidity: '52%', wind: '12 km/h' },
    Surat: { temp: '29.8', desc: 'Heavy Rain', descGu: 'ભારે વરસાદ', icon: 'rain', humidity: '68%', wind: '15 km/h' },
    Rajkot: { temp: '31.9', desc: 'Sunny', descGu: 'તડકો', icon: 'sun', humidity: '52%', wind: '10 km/h' }
  });

  const [aqiData, setAqiData] = useState<Record<string, { value: number; label: string; labelGu: string; pm25: number; pm10: number }>>({
    Ahmedabad: { value: 72, label: 'Satisfactory', labelGu: 'સંતોષકારક', pm25: 22, pm10: 45 },
    Vadodara: { value: 65, label: 'Satisfactory', labelGu: 'સંતોષકારક', pm25: 19, pm10: 40 },
    Surat: { value: 85, label: 'Moderate', labelGu: 'સાધારણ', pm25: 28, pm10: 55 },
    Rajkot: { value: 58, label: 'Good', labelGu: 'સારું', pm25: 15, pm10: 35 }
  });

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const res = await fetch('/api/weather-multi');
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data) {
            const { weatherData: wData, aqiData: aData } = json.data;
            if (wData && Object.keys(wData).length > 0) {
              setWeatherData((prev) => ({ ...prev, ...wData }));
            }
            if (aData && Object.keys(aData).length > 0) {
              setAqiData((prev) => ({ ...prev, ...aData }));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch multi-city weather:', err);
      }

      const now = new Date();
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastUpdateStr(formatted);
    };

    fetchLiveData();
  }, []);

  const mainWeather = weatherData[selectedCity] || weatherData.Ahmedabad;
  const otherCities = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'].filter(c => c !== selectedCity);

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-1 mt-2 select-none">
      {/* Tab headers - Black, Red & White */}
      <div className="flex items-end">
        <div className="bg-slate-950 p-1 rounded-t-xl inline-flex gap-1 border-t-2 border-x-2 border-[#B3121B]/60 dark:border-[#B3121B]/50 relative z-10 -mb-[2px]">
          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-black transition-all rounded-lg tracking-wider select-none ${activeTab === 'weather'
              ? 'bg-white text-slate-950 shadow-sm border border-slate-300'
              : 'text-white/80 hover:text-white bg-transparent'
              }`}
          >
            <Sun className={`h-4 w-4 ${activeTab === 'weather' ? 'text-[#B3121B]' : 'text-white/60'}`} />
            {isGu ? 'હવામાન' : 'WEATHER'}
          </button>
          <button
            onClick={() => setActiveTab('aqi')}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-black transition-all rounded-lg tracking-wider select-none ${activeTab === 'aqi'
              ? 'bg-white text-slate-950 shadow-sm border border-slate-300'
              : 'text-white/80 hover:text-white bg-transparent'
              }`}
          >
            <Wind className={`h-4 w-4 ${activeTab === 'aqi' ? 'text-[#B3121B]' : 'text-white/60'}`} />
            {isGu ? 'હવા ગુણવત્તા (AQI)' : 'AQI'}
          </button>
        </div>
      </div>

      {/* Main Box - Clean Container with Prominent Visible Border */}
      <div className="bg-[#f8f9fa] dark:bg-slate-900/90 p-4 sm:p-6 md:p-7 rounded-2xl rounded-tl-none border-2 border-[#B3121B]/40 dark:border-[#B3121B]/30 shadow-md relative">
        {activeTab === 'weather' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-8 items-center">
            {/* Left Area - Selected City weather info linking to AQI page */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-300 dark:border-slate-800 pb-4 lg:pb-0 lg:pr-10">
              <Link
                href={`/aqi?city=${encodeURIComponent(selectedCity)}`}
                className="group flex flex-col cursor-pointer"
                title={isGu ? `${selectedCity} માટે હવામાન અને AQI વિગતવાર જુઓ` : `View ${selectedCity} Weather & AQI details`}
              >
                <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2 group-hover:text-[#B3121B] transition-colors">
                  {selectedCity} {isGu ? 'હવામાનની સ્થિતિ' : 'Weather Status'}
                  <ArrowUpRight className="h-4 w-4 text-[#B3121B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 select-none">
                  {isGu ? 'વર્તમાન તાપમાનનું સ્તર (સંપૂર્ણ AQI જુઓ →)' : 'Current temperature level (View full AQI →)'}
                </p>
                <div className="flex items-center gap-5 mt-4">
                  <div className="relative">
                    {mainWeather.icon === 'cloud' && <Cloud className="h-16 w-16 text-slate-950 dark:text-white fill-slate-950/10" />}
                    {mainWeather.icon === 'rain' && <CloudRain className="h-16 w-16 text-slate-950 dark:text-white fill-slate-950/10" />}
                    {mainWeather.icon === 'sun' && <Sun className="h-16 w-16 text-[#B3121B] fill-[#B3121B]/10" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white select-none">
                      {mainWeather.temp}°C
                    </span>
                    <span className="mt-1.5 self-start bg-[#B3121B] text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase leading-none select-none shadow-sm group-hover:shadow-md transition-shadow">
                      {isGu ? mainWeather.descGu : mainWeather.desc}
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Right Area - Other Cities (Vadodara, Surat, Rajkot) linking to AQI page */}
            <div className="flex flex-col gap-4">
              {/* City selector dropdown on top right */}
              <div className="self-end flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="appearance-none bg-white text-slate-950 dark:bg-slate-950 dark:text-white text-[13.5px] sm:text-xs font-black px-4 py-2 pr-8 rounded-full border border-slate-400 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B3121B] cursor-pointer shadow-sm"
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Surat">Surat</option>
                    <option value="Rajkot">Rajkot</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* City cards with Clean Black, Red, White styling linking to AQI page */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherCities.map((city) => {
                  const item = weatherData[city];
                  return (
                    <Link
                      key={city}
                      href={`/aqi?city=${encodeURIComponent(city)}`}
                      className="group bg-white dark:bg-slate-950 border border-slate-300/80 dark:border-slate-800 rounded-xl p-4.5 sm:p-4 shadow-sm flex flex-col justify-between gap-3.5 sm:gap-3 min-w-[190px] relative hover:shadow-md hover:border-[#B3121B] hover:scale-[1.02] transition-all duration-300 cursor-pointer select-none"
                      title={isGu ? `${city} માટે સંપૂર્ણ હવામાન અને AQI પેજ જુઓ` : `View full Weather & AQI page for ${city}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[15.5px] sm:text-[13px] font-black text-slate-950 dark:text-white group-hover:text-[#B3121B] transition-colors">{city}</span>
                        <span
                          className="h-7 w-7 sm:h-6 sm:w-6 bg-[#B3121B] text-white rounded-full flex items-center justify-center group-hover:bg-slate-950 group-hover:scale-110 transition-all shadow-xs"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        {item.icon === 'cloud' && <Cloud className="h-9 w-9 sm:h-8 sm:w-8 text-slate-950 dark:text-white shrink-0" />}
                        {item.icon === 'rain' && <CloudRain className="h-9 w-9 sm:h-8 sm:w-8 text-slate-950 dark:text-white shrink-0" />}
                        {item.icon === 'sun' && <Sun className="h-9 w-9 sm:h-8 sm:w-8 text-[#B3121B] shrink-0" />}

                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[14px] sm:text-[12px] font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1 select-none">
                            <Thermometer className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-[#B3121B]" />
                            {item.temp}°C
                          </span>
                          <span className="text-[14px] sm:text-[12px] font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1 select-none">
                            <Droplet className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-[#B3121B]" />
                            {item.humidity}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom update timestamp + Link to AQI page */}
              <div className="flex items-center justify-between mt-2 select-none">
                <Link
                  href={`/aqi?city=${encodeURIComponent(selectedCity)}`}
                  className="text-xs font-black text-[#B3121B] hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isGu ? 'સંપૂર્ણ હવામાન & AQI વિગતો જુઓ' : 'View Full Weather & AQI Details'}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <div className="text-[10px] text-slate-500 font-semibold text-right">
                  Last Update: {lastUpdateStr || '2026-07-16 18:31'} (local time)
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-8 items-center">
            {/* Left Area - Selected City AQI info linking to AQI page */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-300 dark:border-slate-800 pb-4 lg:pb-0 lg:pr-10">
              <Link
                href={`/aqi?city=${encodeURIComponent(selectedCity)}`}
                className="group flex flex-col cursor-pointer"
                title={isGu ? `${selectedCity} માટે સંપૂર્ણ AQI વિગતવાર જુઓ` : `View detailed AQI for ${selectedCity}`}
              >
                <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2 group-hover:text-[#B3121B] transition-colors">
                  {selectedCity} {isGu ? 'હવાની ગુણવત્તા સૂચકાંક (AQI)' : 'Air Quality Index'}
                  <ArrowUpRight className="h-4 w-4 text-[#B3121B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 select-none">
                  {isGu ? 'વર્તમાન વાયુ પ્રદૂષણ સ્તર (સંપૂર્ણ AQI જુઓ →)' : 'Current air pollution levels (View full AQI →)'}
                </p>
                <div className="flex items-center gap-5 mt-4">
                  <div className="h-14 w-14 rounded-xl bg-[#B3121B] text-white flex items-center justify-center text-xl font-black shadow-md select-none group-hover:scale-105 transition-transform">
                    {aqiData[selectedCity]?.value}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-black text-slate-950 dark:text-white group-hover:text-[#B3121B] transition-colors">
                      {isGu ? aqiData[selectedCity]?.labelGu : aqiData[selectedCity]?.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                      PM2.5: {aqiData[selectedCity]?.pm25 || 22} µg/m³ · PM10: {aqiData[selectedCity]?.pm10 || 45} µg/m³
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Right Area - Other Cities AQI linking to AQI page */}
            <div className="flex flex-col gap-4">
              {/* City selector dropdown on top right */}
              <div className="self-end flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="appearance-none bg-white text-slate-950 dark:bg-slate-950 dark:text-white text-xs font-black px-4 py-2 pr-8 rounded-full border border-slate-400 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B3121B] cursor-pointer shadow-sm"
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Surat">Surat</option>
                    <option value="Rajkot">Rajkot</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherCities.map((city) => {
                  const item = aqiData[city];
                  return (
                    <Link
                      key={city}
                      href={`/aqi?city=${encodeURIComponent(city)}`}
                      className="group bg-white dark:bg-slate-950 border border-slate-300/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3 min-w-[190px] hover:shadow-md hover:border-[#B3121B] hover:scale-[1.02] transition-all duration-300 cursor-pointer select-none"
                      title={isGu ? `${city} માટે સંપૂર્ણ AQI પેજ જુઓ` : `View full AQI page for ${city}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-black text-slate-950 dark:text-white group-hover:text-[#B3121B] transition-colors">{city}</span>
                        <span
                          className="h-6 w-6 bg-[#B3121B] text-white rounded-full flex items-center justify-center group-hover:bg-slate-950 group-hover:scale-110 transition-all shadow-xs"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12px] font-black text-white px-2.5 py-1 rounded bg-[#B3121B] shadow-sm select-none">
                          {item.value} AQI
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200">
                          {isGu ? item.labelGu : item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom update timestamp + Link to AQI page */}
              <div className="flex items-center justify-between mt-2 select-none">
                <Link
                  href={`/aqi?city=${encodeURIComponent(selectedCity)}`}
                  className="text-xs font-black text-[#B3121B] hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isGu ? 'સંપૂર્ણ હવામાન & AQI વિગતો જુઓ' : 'View Full Weather & AQI Details'}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <div className="text-[10px] text-slate-500 font-semibold text-right">
                  Last Update: {lastUpdateStr || '2026-07-16 18:31'} (local time)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
export { WeatherDashboardSection };



