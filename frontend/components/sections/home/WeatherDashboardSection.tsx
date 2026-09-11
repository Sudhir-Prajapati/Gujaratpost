'use client';

import React, { useState, useEffect } from 'react';
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
      const cities = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'];
      const updatedW = { ...weatherData };
      const updatedA = { ...aqiData };

      await Promise.all(
        cities.map(async (city) => {
          const coords = CITY_COORDS[city];
          if (!coords) return;

          try {
            const wRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
            );
            if (wRes.ok) {
              const wJson = await wRes.json();
              if (wJson?.current) {
                const c = wJson.current;
                const parsed = parseWmoCode(c.weather_code);
                updatedW[city] = {
                  temp: String(Math.round(c.temperature_2m * 10) / 10),
                  desc: parsed.desc,
                  descGu: parsed.descGu,
                  icon: parsed.icon,
                  humidity: `${c.relative_humidity_2m}%`,
                  wind: `${Math.round(c.wind_speed_10m)} km/h`,
                };
              }
            }
          } catch { }

          try {
            const aRes = await fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=us_aqi,pm10,pm2_5`
            );
            if (aRes.ok) {
              const aJson = await aRes.json();
              if (aJson?.current) {
                const c = aJson.current;
                const val = Math.round(c.us_aqi || 65);
                const parsedAqi = parseAqi(val);
                updatedA[city] = {
                  value: val,
                  label: parsedAqi.label,
                  labelGu: parsedAqi.labelGu,
                  pm25: Math.round(c.pm2_5 || 22),
                  pm10: Math.round(c.pm10 || 45),
                };
              }
            }
          } catch { }
        })
      );

      setWeatherData(updatedW);
      setAqiData(updatedA);

      const now = new Date();
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastUpdateStr(formatted);
    };

    fetchLiveData();
  }, []);

  const mainWeather = weatherData[selectedCity] || weatherData.Ahmedabad;
  const otherCities = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'].filter(c => c !== selectedCity);

  return (
    <section className="mx-auto max-w-screen-xl px-4 py-4 mt-8 select-none">
      {/* Tab headers - Black, Red & White */}
      <div className="flex items-end">
        <div className="bg-slate-950 p-1 rounded-t-xl inline-flex gap-1 border-t border-x border-slate-800">
          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-black transition-all rounded-lg tracking-wider select-none ${activeTab === 'weather'
              ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
              : 'text-white/80 hover:text-white bg-transparent'
              }`}
          >
            <Sun className={`h-4 w-4 ${activeTab === 'weather' ? 'text-[#B3121B]' : 'text-white/60'}`} />
            {isGu ? 'હવામાન' : 'WEATHER'}
          </button>
          <button
            onClick={() => setActiveTab('aqi')}
            className={`flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-black transition-all rounded-lg tracking-wider select-none ${activeTab === 'aqi'
              ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
              : 'text-white/80 hover:text-white bg-transparent'
              }`}
          >
            <Wind className={`h-4 w-4 ${activeTab === 'aqi' ? 'text-[#B3121B]' : 'text-white/60'}`} />
            {isGu ? 'હવા ગુણવત્તા (AQI)' : 'AQI'}
          </button>
        </div>
      </div>

      {/* Main Box - Clean Light Grey Container */}
      <div className="bg-[#f3f4f6] dark:bg-slate-900/90 p-6 rounded-b-2xl rounded-r-2xl border border-slate-200 dark:border-slate-800 shadow-md relative">
        {activeTab === 'weather' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            {/* Left Area - Selected City weather info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b lg:border-b-0 lg:border-r border-slate-300 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-10">
              <div className="flex flex-col">
                <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                  {selectedCity} {isGu ? 'હવામાનની સ્થિતિ' : 'Weather Status'}
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 select-none">
                  {isGu ? 'વર્તમાન તાપમાનનું સ્તર' : 'Current temperature level'}
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
                    <span className="mt-1.5 self-start bg-[#B3121B] text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase leading-none select-none shadow-sm">
                      {isGu ? mainWeather.descGu : mainWeather.desc}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area - Other Cities */}
            <div className="flex flex-col gap-4">
              {/* City selector dropdown on top right */}
              <div className="self-end flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="appearance-none bg-white text-slate-950 dark:bg-slate-950 dark:text-white text-xs font-black px-4 py-2 pr-8 rounded-full border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B3121B] cursor-pointer shadow-sm"
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Surat">Surat</option>
                    <option value="Rajkot">Rajkot</option>
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* City cards with Clean Black, Red, White styling */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherCities.map((city) => {
                  const item = weatherData[city];
                  return (
                    <div
                      key={city}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3 min-w-[190px] relative hover:shadow-md hover:border-[#B3121B]/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-black text-slate-950 dark:text-white">{city}</span>
                        <button
                          onClick={() => setSelectedCity(city)}
                          className="h-5.5 w-5.5 bg-[#B3121B] text-white rounded-full flex items-center justify-center hover:bg-slate-950 transition-colors"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        {item.icon === 'cloud' && <Cloud className="h-8 w-8 text-slate-950 dark:text-white shrink-0" />}
                        {item.icon === 'rain' && <CloudRain className="h-8 w-8 text-slate-950 dark:text-white shrink-0" />}
                        {item.icon === 'sun' && <Sun className="h-8 w-8 text-[#B3121B] shrink-0" />}

                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[12px] font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1 select-none">
                            <Thermometer className="h-3.5 w-3.5 text-[#B3121B]" />
                            {item.temp}°C
                          </span>
                          <span className="text-[12px] font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1 select-none">
                            <Droplet className="h-3.5 w-3.5 text-[#B3121B]" />
                            {item.humidity}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom update timestamp */}
              <div className="text-[10px] text-slate-500 font-semibold text-right select-none mt-2">
                Last Update: {lastUpdateStr || '2026-07-16 18:31'} (local time)
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            {/* Left Area - Selected City AQI info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b lg:border-b-0 lg:border-r border-slate-300 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-10">
              <div className="flex flex-col">
                <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white">
                  {selectedCity} {isGu ? 'હવાની ગુણવત્તા સૂચકાંક (AQI)' : 'Air Quality Index'}
                </h3>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {isGu ? 'વર્તમાન વાયુ પ્રદૂષણ સ્તર' : 'Current air pollution levels'}
                </p>
                <div className="flex items-center gap-5 mt-4">
                  <div className="h-14 w-14 rounded-xl bg-[#B3121B] text-white flex items-center justify-center text-xl font-black shadow-md select-none">
                    {aqiData[selectedCity]?.value}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-black text-slate-950 dark:text-white">
                      {isGu ? aqiData[selectedCity]?.labelGu : aqiData[selectedCity]?.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                      PM2.5: {aqiData[selectedCity]?.pm25 || 22} µg/m³ · PM10: {aqiData[selectedCity]?.pm10 || 45} µg/m³
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area - Other Cities AQI */}
            <div className="flex flex-col gap-4">
              {/* City selector dropdown on top right */}
              <div className="self-end flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="appearance-none bg-white text-slate-950 dark:bg-slate-950 dark:text-white text-xs font-black px-4 py-2 pr-8 rounded-full border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B3121B] cursor-pointer shadow-sm"
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
                    <div
                      key={city}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3 min-w-[190px] hover:shadow-md hover:border-[#B3121B]/40 transition-all duration-300"
                    >
                      <span className="text-[13px] font-black text-slate-950 dark:text-white">{city}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12px] font-black text-white px-2.5 py-1 rounded bg-[#B3121B] shadow-sm select-none">
                          {item.value} AQI
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200">
                          {isGu ? item.labelGu : item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold text-right select-none mt-2">
                Last Update: {lastUpdateStr || '2026-07-16 18:31'} (local time)
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
export { WeatherDashboardSection };

