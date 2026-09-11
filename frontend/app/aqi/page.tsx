'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/components/AppProvider';
import AqiSkeleton from '@/components/aqi/AqiSkeleton';
import { getPublicArticles } from '@/lib/api';
import {
  Search,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  Droplets,
  Thermometer,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface CityData {
  nameEn: string;
  nameGu: string;
  nameHi: string;
  lat: number;
  lon: number;
  icon: string;
}

const POPULAR_CITIES: CityData[] = [
  { nameEn: 'Ahmedabad', nameGu: 'અમદાવાદ', nameHi: 'અહમદાબાદ', lat: 23.0225, lon: 72.5714, icon: 'Ahmedabad' },
  { nameEn: 'Mumbai', nameGu: 'મુંબઈ', nameHi: 'मुंबई', lat: 19.0760, lon: 72.8777, icon: 'Mumbai' },
  { nameEn: 'Delhi', nameGu: 'દિલ્હી', nameHi: 'दिल्ली', lat: 28.6139, lon: 77.2090, icon: 'Delhi' },
  { nameEn: 'Rajkot', nameGu: 'રાજકોટ', nameHi: 'રાજકોટ', lat: 22.3039, lon: 70.8022, icon: 'Rajkot' },
  { nameEn: 'Vadodara', nameGu: 'વડોદરા', nameHi: 'वडोदरा', lat: 22.3072, lon: 73.1812, icon: 'Vadodara' },
  { nameEn: 'Surat', nameGu: 'સુરત', nameHi: 'सूरत', lat: 21.1702, lon: 72.8311, icon: 'Surat' },
  { nameEn: 'Jamnagar', nameGu: 'જામનગર', nameHi: 'जामनगर', lat: 22.4707, lon: 70.0577, icon: 'Jamnagar' },
  { nameEn: 'Bhavnagar', nameGu: 'ભાવનગર', nameHi: 'भाવનગર', lat: 21.7645, lon: 72.1519, icon: 'Bhavnagar' },
  { nameEn: 'Gandhinagar', nameGu: 'ગાંધીનગર', nameHi: 'गांधीनगर', lat: 23.2156, lon: 72.6369, icon: 'Gandhinagar' },
  { nameEn: 'Kolkata', nameGu: 'કોલકાતા', nameHi: 'कोलकाता', lat: 22.5726, lon: 88.3639, icon: 'Kolkata' },
];

const MOST_POLLUTED_CITIES_DEF = [
  { city: 'Pali', lat: 25.7713, lon: 73.3237, defaultAqi: 167 },
  { city: 'Chapra', lat: 25.7845, lon: 84.7274, defaultAqi: 162 },
  { city: 'Gadag-Betageri', lat: 15.4319, lon: 75.6322, defaultAqi: 161 },
  { city: 'Siwan', lat: 26.2196, lon: 84.3567, defaultAqi: 159 },
  { city: 'Muzaffarnagar', lat: 29.4727, lon: 77.7085, defaultAqi: 158 },
  { city: 'Chipyana Khurd Urf Tigri', lat: 28.6180, lon: 77.4280, defaultAqi: 158 },
  { city: 'Fatehgarh Sahib', lat: 30.6489, lon: 76.3980, defaultAqi: 157 },
  { city: 'Hapur', lat: 28.7306, lon: 77.7758, defaultAqi: 156 },
  { city: 'Baghpat', lat: 28.9443, lon: 77.2223, defaultAqi: 156 },
  { city: 'Jhargram', lat: 22.4514, lon: 86.9944, defaultAqi: 155 },
];

const LEAST_POLLUTED_CITIES_DEF = [
  { city: 'Khalilabad', lat: 26.7761, lon: 83.0712, defaultAqi: 11 },
  { city: 'Unchahar', lat: 25.9189, lon: 81.3142, defaultAqi: 17 },
  { city: 'Tiruvallur', lat: 13.1438, lon: 79.9079, defaultAqi: 22 },
  { city: 'Alleppey', lat: 9.4981, lon: 76.3388, defaultAqi: 25 },
  { city: 'Kohima', lat: 25.6751, lon: 94.1086, defaultAqi: 25 },
  { city: 'Nainital', lat: 29.3919, lon: 79.4542, defaultAqi: 25 },
  { city: 'Darjeeling', lat: 27.0410, lon: 88.2663, defaultAqi: 27 },
  { city: 'Curchorem', lat: 15.2638, lon: 74.1130, defaultAqi: 29 },
  { city: 'Loutolim', lat: 15.3400, lon: 73.9900, defaultAqi: 29 },
  { city: 'Kollam', lat: 8.8932, lon: 76.6141, defaultAqi: 31 },
];

const FALLBACK_NEWS_ARTICLES = [
  {
    id: 'news-1',
    slug: 'gujarat-seven-day-rain-forecast',
    title: 'રાજ્યમાં હજુ સાત દિવસ વરસાદી માહોલ રહેવાની હવામાન વિભાગની આગાહી',
    featuredImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80',
  },
  {
    id: 'news-2',
    slug: 'ahmedabad-aqi-moderate-category',
    title: 'અમદાવાદમાં AQI 100 પાર, હવા ગુણવત્તા મધ્યમ શ્રેણીમાં નોંધાઈ',
    featuredImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
  },
  {
    id: 'news-3',
    slug: 'north-gujarat-red-alert-rain',
    title: 'આગામી ત્રણ કલાક અતિભારે વરસાદની હવામાન વિભાગની આગાહી',
    featuredImage: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=600&q=80',
  },
  {
    id: 'news-4',
    slug: 'gujarat-rainfall-surat-details',
    title: 'જુઓ ગુજરાતમાં ક્યાં કેટલો વરસાદ ખાબક્યો: સુરતમાં 4 ઈંચ અનરાધાર વરસાદ - Video',
    featuredImage: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=600&q=80',
  },
  {
    id: 'news-5',
    slug: 'middle-gujarat-heavy-rain-shower',
    title: 'મધ્ય ગુજરાતમાં મેઘો મન મૂકીને વરસ્યો, અનેક વિસ્તારો જળમગ્ન',
    featuredImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80',
  },
  {
    id: 'news-6',
    slug: 'delhi-west-india-aqi-pollution',
    title: 'દિલ્હી અને પશ્ચિમ ભારતમાં પ્રદૂષણનું પ્રમાણ વધ્યું: AQI જોખમી સ્તરે',
    featuredImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600&q=80',
  },
  {
    id: 'news-7',
    slug: 'vadodara-rajkot-torrential-rain',
    title: 'વડોદરા અને રાજકોટમાં ભારે પવન સાથે મુસળધાર વરસાદી ઝાપટાં',
    featuredImage: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=600&q=80',
  },
  {
    id: 'news-8',
    slug: 'gujarat-ports-signal-3-fishermen',
    title: 'ગુજરાતના બંદરો પર 3 નંબરનું સિગ્નલ લગાવાયું, માછીમારોને દરિયો ન ખેડવા સૂચના',
    featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  },
  {
    id: 'news-9',
    slug: 'gandhinagar-cloudy-temp-drop',
    title: 'ગાંધીનગરમાં વાદળછાયું વાતાવરણ, તાપમાનમાં 3 ડિગ્રીનો ઘટાડો નોંધાયો',
    featuredImage: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=80',
  },
  {
    id: 'news-10',
    slug: 'bay-of-bengal-low-pressure-warning',
    title: 'બંગાળની ખાડીમાં લો પ્રેશર સર્જાતા આગામી 48 કલાક ભારે વરસાદની ચેતવણી',
    featuredImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=600&q=80',
  },
  {
    id: 'news-11',
    slug: 'ahmedabad-monsoon-weather-shift',
    title: 'અમદાવાદ શહેરના વાતાવરણમાં પલટો: ભારે બફારા બાદ ધોધમાર વરસાદ',
    featuredImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80',
  },
  {
    id: 'news-12',
    slug: 'reservoir-dams-high-alert-gujarat',
    title: 'જળાશયોમાં નવા નીરની આવક, 50થી વધુ ડેમ હાઈ એલર્ટ પર મુકાયા',
    featuredImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
  },
];

// Pre-calculated static SVG coordinates to eliminate floating-point hydration mismatch
const SUNBURST_RAYS = [
  { x2: 175, y2: 100 },
  { x2: 164.95, y2: 137.5 },
  { x2: 137.5, y2: 164.95 },
  { x2: 100, y2: 175 },
  { x2: 62.5, y2: 164.95 },
  { x2: 35.05, y2: 137.5 },
  { x2: 25, y2: 100 },
  { x2: 35.05, y2: 62.5 },
  { x2: 62.5, y2: 35.05 },
  { x2: 100, y2: 25 },
  { x2: 137.5, y2: 35.05 },
  { x2: 164.95, y2: 62.5 },
];

function CityReferenceIcon({ cityKey }: { cityKey: string }) {
  return (
    <div className="w-16 h-16 rounded-full bg-[#E0F2FE] dark:bg-sky-950/70 flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform shrink-0">
      {cityKey === 'Ahmedabad' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M16 28h16v12H16z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 40h32M10 40V22l14-10 14 10v18M18 40V28a6 6 0 0 1 12 0v12M18 18h12M12 28h4M32 28h4" />
        </svg>
      )}
      {cityKey === 'Mumbai' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M18 24h12v16H18z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M6 40h36M10 40V16l14-6 14 6v24M18 40V24a6 6 0 0 1 12 0v16M14 18h4M30 18h4" />
        </svg>
      )}
      {cityKey === 'Delhi' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M18 26h12v14H18z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 40h32M12 40V12h24v28M18 40V26a6 6 0 0 1 12 0v14M16 18h16M20 12V8h8v4" />
        </svg>
      )}
      {cityKey === 'Rajkot' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M20 22h8v18h-8z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M6 40h36M10 40V20l6-6 8 8 8-8 6 6v20M20 40V26a4 4 0 0 1 8 0v14" />
        </svg>
      )}
      {cityKey === 'Vadodara' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M18 24h12v16H18z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M6 40h36M10 40V22l14-12 14 12v18M18 40V24a6 6 0 0 1 12 0v16M24 10V6" />
        </svg>
      )}
      {cityKey === 'Surat' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M14 16h20v24H14z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 40h32M12 40V12h24v28M18 18h3M27 18h3M18 24h3M27 24h3M18 30h3M27 30h3" />
        </svg>
      )}
      {cityKey === 'Jamnagar' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M16 22h16v18H16z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M6 40h36M10 40V20l14-10 14 10v20M18 40V28a6 6 0 0 1 12 0v12M8 32c4-2 8 2 12 0s8 2 12 0" />
        </svg>
      )}
      {cityKey === 'Bhavnagar' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M20 22h8v18h-8z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M6 40h36M12 40V22l12-10 12 10v18M20 40V26a4 4 0 0 1 8 0v14M24 12V6" />
        </svg>
      )}
      {cityKey === 'Gandhinagar' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M14 22h20v18H14z" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M6 40h36M10 40V16h28v24M24 8l14 8H10l14-8zM18 26h12" />
        </svg>
      )}
      {cityKey === 'Kolkata' && (
        <svg viewBox="0 0 48 48" className="w-10 h-10">
          <path fill="#38BDF8" d="M10 24h28v14H10z" opacity="0.6" />
          <path fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M4 40h40M10 40V14l14 8 14-8v26M10 22c14 8 14 8 28 0" />
        </svg>
      )}
    </div>
  );
}

const AQI_LEVELS = [
  { range: '0-50', statusEn: 'Good', statusGu: 'સારું', statusHi: 'अच्छा', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { range: '51-100', statusEn: 'Moderate', statusGu: 'મધ્યમ', statusHi: 'मध्यम', color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { range: '101-150', statusEn: 'Poor', statusGu: 'નબળું', statusHi: 'खराब', color: '#F97316', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  { range: '151-200', statusEn: 'Unhealthy', statusGu: 'અસ્વાસ્થ્યપ્રદ', statusHi: 'અસ્વાસ્થ્યકર', color: '#EF4444', bg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800' },
  { range: '201-300', statusEn: 'Severe', statusGu: 'ગંભીર', statusHi: 'गंभीर', color: '#8B5CF6', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  { range: '301-500+', statusEn: 'Hazardous', statusGu: 'જોખમી', statusHi: 'ખતરનાક', color: '#B91C1C', bg: 'bg-rose-900 text-white dark:bg-rose-950 border-rose-800' },
];

function getAqiMeta(aqi: number, lang: string) {
  if (aqi <= 50) return { range: '0-50', status: 'Good', color: '#10B981', bg: 'bg-emerald-100 text-emerald-800' };
  if (aqi <= 100) return { range: '51-100', status: 'Moderate', color: '#F59E0B', bg: 'bg-[#FEF3C7] text-[#D97706]' };
  if (aqi <= 150) return { range: '101-150', status: 'Poor', color: '#F97316', bg: 'bg-orange-100 text-orange-800' };
  if (aqi <= 200) return { range: '151-200', status: 'Unhealthy', color: '#EF4444', bg: 'bg-red-100 text-red-800' };
  if (aqi <= 300) return { range: '201-300', status: 'Severe', color: '#8B5CF6', bg: 'bg-purple-100 text-purple-800' };
  return { range: '301-500+', status: 'Hazardous', color: '#B91C1C', bg: 'bg-rose-900 text-white' };
}

export default function AqiPage() {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<'aqi' | 'weather'>('aqi');
  const [selectedCity, setSelectedCity] = useState<CityData>(POPULAR_CITIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const [liveAqi, setLiveAqi] = useState<{ aqi: number; pm25: number; pm10: number } | null>(null);
  const [liveWeather, setLiveWeather] = useState<{ temp: number; wind: number; humidity: number; condition: string } | null>(null);
  const [loadingAqi, setLoadingAqi] = useState(true);

  const [cityAqiMap, setCityAqiMap] = useState<Record<string, number>>({});
  const [newsArticles, setNewsArticles] = useState<any[]>(FALLBACK_NEWS_ARTICLES);
  const [visibleNewsCount, setVisibleNewsCount] = useState(8);

  // Live API State for Most & Least Polluted Cities Rankings
  const [mostPollutedList, setMostPollutedList] = useState(
    MOST_POLLUTED_CITIES_DEF.map((c, i) => ({ rank: i + 1, city: c.city, aqi: c.defaultAqi }))
  );
  const [leastPollutedList, setLeastPollutedList] = useState(
    LEAST_POLLUTED_CITIES_DEF.map((c, i) => ({ rank: i + 1, city: c.city, aqi: c.defaultAqi }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real-time live API data from Open-Meteo for selected city
  useEffect(() => {
    setLoadingAqi(true);
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=us_aqi,pm10,pm2_5`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current_weather=true&hourly=relative_humidity_2m`;

    Promise.all([
      fetch(url).then(res => res.json()).catch(() => null),
      fetch(weatherUrl).then(res => res.json()).catch(() => null)
    ]).then(([aqiRes, weatherRes]) => {
      const aqiVal = Math.round(aqiRes?.current?.us_aqi || (selectedCity.nameEn === 'Ahmedabad' ? 103 : 65));
      const pm25Val = Math.round(aqiRes?.current?.pm2_5 || 36);
      const pm10Val = Math.round(aqiRes?.current?.pm10 || 59);

      const tempVal = weatherRes?.current_weather?.temperature ? Math.round(weatherRes.current_weather.temperature) : 31;
      const windVal = weatherRes?.current_weather?.windspeed ? Math.round(weatherRes.current_weather.windspeed) : 14;
      const humVal = weatherRes?.hourly?.relative_humidity_2m?.[0] || 72;
      const code = weatherRes?.current_weather?.weathercode || 0;

      let condText = language === 'gu' ? 'સાફ હવામાન' : 'Clear Sky';
      if (code > 0 && code <= 3) condText = language === 'gu' ? 'અંશતઃ વાદળછાયું' : 'Partly Cloudy';
      else if (code > 50) condText = language === 'gu' ? 'વરસાદ' : 'Rainy';

      setLiveAqi({
        aqi: aqiVal,
        pm25: pm25Val,
        pm10: pm10Val,
      });

      setLiveWeather({
        temp: tempVal,
        wind: windVal,
        humidity: humVal,
        condition: condText,
      });

      setCityAqiMap(prev => ({ ...prev, [selectedCity.nameEn]: aqiVal }));
      setLoadingAqi(false);
    }).catch(() => {
      setLiveAqi({ aqi: 103, pm25: 36, pm10: 59 });
      setLiveWeather({ temp: 31, wind: 14, humidity: 72, condition: 'Partly Cloudy' });
      setLoadingAqi(false);
    });
  }, [selectedCity, language]);

  // Pre-fetch live AQI for all popular cities
  useEffect(() => {
    POPULAR_CITIES.forEach(city => {
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi`)
        .then(res => res.json())
        .then(data => {
          if (data?.current?.us_aqi) {
            const val = Math.round(data.current.us_aqi);
            setCityAqiMap(prev => ({ ...prev, [city.nameEn]: val }));
          }
        }).catch(() => {});
    });
  }, []);

  // Fetch Live API AQI data for Most & Least Polluted City Rankings!
  useEffect(() => {
    // Fetch Most Polluted Cities Live API
    Promise.all(
      MOST_POLLUTED_CITIES_DEF.map(item =>
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${item.lat}&longitude=${item.lon}&current=us_aqi`)
          .then(res => res.json())
          .then(data => ({ city: item.city, aqi: Math.round(data?.current?.us_aqi || item.defaultAqi) }))
          .catch(() => ({ city: item.city, aqi: item.defaultAqi }))
      )
    ).then(results => {
      const sorted = [...results].sort((a, b) => b.aqi - a.aqi);
      setMostPollutedList(sorted.map((item, idx) => ({ rank: idx + 1, city: item.city, aqi: item.aqi })));
    });

    // Fetch Least Polluted Cities Live API
    Promise.all(
      LEAST_POLLUTED_CITIES_DEF.map(item =>
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${item.lat}&longitude=${item.lon}&current=us_aqi`)
          .then(res => res.json())
          .then(data => ({ city: item.city, aqi: Math.round(data?.current?.us_aqi || item.defaultAqi) }))
          .catch(() => ({ city: item.city, aqi: item.defaultAqi }))
      )
    ).then(results => {
      const sorted = [...results].sort((a, b) => a.aqi - b.aqi);
      setLeastPollutedList(sorted.map((item, idx) => ({ rank: idx + 1, city: item.city, aqi: item.aqi })));
    });
  }, []);

  // Fetch weather, rain & AQI related news
  useEffect(() => {
    getPublicArticles({ limit: 20 })
      .then(res => {
        if (res?.articles && res.articles.length > 0) {
          const filtered = res.articles.filter((art: any) =>
            art.category?.name?.toUpperCase().includes('WEATHER') ||
            art.category?.name?.toUpperCase().includes('ENVIRONMENT') ||
            art.title?.includes('વરસાદ') ||
            art.title?.includes('હવામાન') ||
            art.title?.includes('AQI')
          );
          if (filtered.length > 0) {
            setNewsArticles(filtered);
          }
        }
      })
      .catch(() => {});
  }, []);

  const meta = useMemo(() => {
    const score = liveAqi?.aqi || 103;
    return getAqiMeta(score, language);
  }, [liveAqi, language]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_CITIES;
    const q = searchQuery.toLowerCase().trim();
    return POPULAR_CITIES.filter(c =>
      c.nameEn.toLowerCase().includes(q) ||
      c.nameGu.includes(q) ||
      c.nameHi.includes(q)
    );
  }, [searchQuery]);

  const getCityName = (city: CityData) => {
    if (language === 'hi') return city.nameHi;
    if (language === 'gu') return city.nameGu;
    return city.nameEn;
  };

  // Exact Needle Ring coordinates on 180deg SVG arc (Radius = 80, Center = 100, 100)
  const { needleX, needleY } = useMemo(() => {
    const score = Math.min(300, Math.max(0, liveAqi?.aqi || 103));
    const pct = score / 300;
    const x = 100 - 80 * Math.cos(pct * Math.PI);
    const y = 100 - 80 * Math.sin(pct * Math.PI);
    return { needleX: Number(x.toFixed(2)), needleY: Number(y.toFixed(2)) };
  }, [liveAqi]);

  if (!mounted || (loadingAqi && !liveAqi)) {
    return <AqiSkeleton />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-10 font-sans">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 select-none">
        <Link href="/" className="hover:text-red-600 transition-colors">
          {language === 'gu' ? 'ગુજરાતી ન્યૂઝ' : language === 'hi' ? 'गुजराती न्यूज' : 'Gujarati News'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-800 dark:text-neutral-200 font-bold">AQI</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
        {language === 'gu' ? 'એર ક્વોલિટી ઈન્ડેક્સ - (AQI) આજે' : language === 'hi' ? 'एयर क्वालिटी इंडेक्स - (AQI) आज' : 'Air Quality Index - (AQI) Today'}
      </h1>

      {/* ── Top Header Controls & File Tabs Stack ── */}
      <div className="space-y-0 relative">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* File Tabs popping out from card top-left */}
          <div className="flex items-end select-none">
            <button
              type="button"
              onClick={() => setActiveTab('aqi')}
              className={`flex items-center gap-1.5 sm:gap-2.5 px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-t-xl sm:rounded-t-2xl text-xs sm:text-base font-extrabold transition-all border-t border-x cursor-pointer ${
                activeTab === 'aqi'
                  ? 'bg-white border-neutral-200 text-neutral-900 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] dark:bg-zinc-900 dark:border-zinc-800 dark:text-white z-20'
                  : 'bg-neutral-100/90 hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 border-neutral-200/70 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800'
              }`}
            >
              <Wind className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'aqi' ? 'text-red-600' : 'text-neutral-400 dark:text-zinc-500'}`} />
              <span>AQI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weather')}
              className={`flex items-center gap-1.5 sm:gap-2.5 px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-t-xl sm:rounded-t-2xl text-xs sm:text-base font-extrabold transition-all border-t border-x cursor-pointer ${
                activeTab === 'weather'
                  ? 'bg-white border-neutral-200 text-neutral-900 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] dark:bg-zinc-900 dark:border-zinc-800 dark:text-white z-20'
                  : 'bg-neutral-100/90 hover:bg-neutral-200/80 text-neutral-600 hover:text-neutral-900 border-neutral-200/70 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'weather' ? 'text-amber-500' : 'text-neutral-400 dark:text-zinc-500'}`} />
              <span>{language === 'gu' ? 'હવામાન' : language === 'hi' ? 'मौसम' : 'Weather'}</span>
            </button>
          </div>

          {/* Search Bar Top Right */}
          <div className="relative w-32 sm:w-64 mb-1 sm:mb-2 flex-shrink-0">
            <input
              type="text"
              placeholder={language === 'gu' ? 'શહેર શોધો...' : language === 'hi' ? 'शहर खोजें...' : 'Search city...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-neutral-300 dark:border-zinc-700 rounded-xl py-1.5 sm:py-2 pl-7 sm:pl-9 pr-2.5 sm:pr-3 text-xs font-bold text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Quick dropdown for city suggestions when searching */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-48 sm:w-64 max-h-56 overflow-y-auto bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 py-1 divide-y divide-neutral-100 dark:divide-zinc-800">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <button
                      key={city.nameEn}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors"
                    >
                      <span>{getCityName(city)}</span>
                      <span className="text-[10px] text-neutral-400 font-normal">{city.nameEn}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-neutral-400">
                    {language === 'gu' ? 'કોઈ પરિણામ નથી' : 'No city found'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Hero Card ── */}
        {activeTab === 'aqi' ? (
          <div className="relative overflow-hidden rounded-b-3xl rounded-tr-3xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-10 shadow-xl -mt-px">
            {/* World Map Dot Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] dark:bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

            {/* Sunburst Rays & Cloud Art behind City Name */}
            <div className="absolute top-4 left-6 w-56 h-56 pointer-events-none opacity-20 dark:opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full text-amber-500 fill-current">
                <circle cx="100" cy="100" r="24" />
                {SUNBURST_RAYS.map((ray, i) => (
                  <line
                    key={i}
                    x1="100"
                    y1="100"
                    x2={ray.x2}
                    y2={ray.y2}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                ))}
              </svg>
            </div>
            <div className="absolute top-6 left-12 text-zinc-300/40 dark:text-zinc-700/40 text-6xl pointer-events-none select-none">
              ☁️
            </div>
            <div className="absolute top-10 left-52 text-zinc-300/30 dark:text-zinc-700/30 text-5xl pointer-events-none select-none">
              ☁️
            </div>

            {/* Bottom Cloud Waves Pattern */}
            <div className="absolute bottom-0 inset-x-0 h-10 pointer-events-none opacity-70 z-0 overflow-hidden flex items-end">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-10 text-sky-100 dark:text-zinc-800 fill-current">
                <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,-20 1200,40 L1200,120 L0,120 Z" />
              </svg>
            </div>

            {/* Spectrum Bar & Vertical Timestamp (Top Right) */}
            <div className="absolute top-6 right-8 flex items-start gap-4 z-10">
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center justify-between w-64 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1 select-none">
                  <span>Good</span>
                  <span>Moderate</span>
                  <span>Poor</span>
                  <span>Unhealthy</span>
                  <span>Severe</span>
                  <span>Hazardous</span>
                </div>
                <div className="h-2 w-64 flex rounded-full overflow-hidden bg-neutral-200 dark:bg-zinc-800">
                  <div className="h-full w-[16.6%] bg-[#10B981]" />
                  <div className="h-full w-[16.6%] bg-[#F59E0B]" />
                  <div className="h-full w-[16.6%] bg-[#F97316]" />
                  <div className="h-full w-[16.6%] bg-[#EF4444]" />
                  <div className="h-full w-[16.6%] bg-[#8B5CF6]" />
                  <div className="h-full w-[16.6%] bg-[#B91C1C]" />
                </div>
                <div className="flex items-center justify-between w-64 text-[9px] font-extrabold text-neutral-400 mt-1 select-none">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                  <span>150</span>
                  <span>200</span>
                  <span>300</span>
                  <span>500+</span>
                </div>
              </div>

              {/* Rotated Vertical Timestamp */}
              <div className="hidden lg:block text-[9px] font-bold text-neutral-400 rotate-90 origin-top-right translate-y-24 translate-x-3 select-none whitespace-nowrap">
                Last Updated: 14 August 2026 | 10:30 AM
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 pt-2 pb-6">
              
              {/* Left Column: Serif City Name + Rainbow Arc Gauge */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-800 dark:text-neutral-100 mb-4 tracking-wide text-center">
                  {getCityName(selectedCity)}
                </h2>

                <div className="relative w-72 h-40 sm:w-84 sm:h-48 flex items-end justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 115">
                    <defs>
                      <linearGradient id="rainbowGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="25%" stopColor="#F59E0B" />
                        <stop offset="50%" stopColor="#F97316" />
                        <stop offset="75%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="14"
                      strokeLinecap="round"
                      className="dark:stroke-zinc-800"
                    />
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="url(#rainbowGauge)"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={needleX}
                      cy={needleY}
                      r="10"
                      fill="#FFFFFF"
                      stroke={meta.color}
                      strokeWidth="4"
                      className="transition-all duration-1000 ease-out shadow-md"
                    />
                  </svg>

                  <div className="absolute bottom-1 inset-x-0 flex flex-col items-center text-center select-none">
                    <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                      {loadingAqi ? '...' : liveAqi?.aqi}
                    </span>
                    <span className="text-sm font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mt-0.5">
                      AQI
                    </span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-1">
                      Range: {meta.range}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Air Quality Status + PM 2.5 / PM 10 Box */}
              <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-6">
                <div>
                  <div className="text-sm font-extrabold text-neutral-900 dark:text-white mb-2">
                    Air Quality Is
                  </div>
                  <div className="inline-flex items-center px-6 py-2 rounded-xl bg-[#FEF3C7] text-[#D97706] font-extrabold text-lg sm:text-xl shadow-xs">
                    <span>{meta.status}</span>
                  </div>
                </div>

                {/* PM 2.5 & PM 10 Container Card */}
                <div className="bg-white dark:bg-zinc-800 border border-neutral-200/80 dark:border-zinc-700 rounded-2xl p-3 shadow-md flex items-center gap-3 w-full max-w-xs sm:max-w-sm">
                  <div className="flex-1 rounded-xl overflow-hidden border border-neutral-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center">
                    <div className="bg-[#E0F2FE] dark:bg-sky-950/60 text-neutral-700 dark:text-sky-300 font-extrabold text-xs py-1.5">
                      PM 2.5
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white py-2.5">
                      {loadingAqi ? '...' : liveAqi?.pm25}
                    </div>
                  </div>

                  <div className="flex-1 rounded-xl overflow-hidden border border-neutral-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center">
                    <div className="bg-[#E0F2FE] dark:bg-sky-950/60 text-neutral-700 dark:text-sky-300 font-extrabold text-xs py-1.5">
                      PM 10
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white py-2.5">
                      {loadingAqi ? '...' : liveAqi?.pm10}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5 select-none pt-2">
                  <span>POWERED BY</span>
                  <span className="font-black text-[#0284C7] tracking-wider text-sm">AQI</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ── Weather View Card ── */
          <div className="rounded-b-3xl rounded-tr-3xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-10 shadow-xl -mt-px">
            <div className="flex items-center justify-between border-b pb-4 mb-6 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Sun className="w-9 h-9 text-amber-500 animate-spin-slow" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100">{getCityName(selectedCity)}</h2>
                  <p className="text-xs text-neutral-400 font-bold mt-0.5">{liveWeather?.condition}</p>
                </div>
              </div>
              <div className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-neutral-100">
                {liveWeather?.temp}°C
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-4">
                <Thermometer className="w-7 h-7 text-amber-600" />
                <div>
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-bold">Temperature</div>
                  <div className="text-xl font-black">{liveWeather?.temp}°C</div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-center gap-4">
                <Wind className="w-7 h-7 text-blue-600" />
                <div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-bold">Wind Speed</div>
                  <div className="text-xl font-black">{liveWeather?.wind} km/h</div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-4">
                <Droplets className="w-7 h-7 text-emerald-600" />
                <div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">Humidity</div>
                  <div className="text-xl font-black">{liveWeather?.humidity}%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Popular Cities Outer Blue Container Card ── */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#F2F7FD] dark:bg-zinc-900/80 p-6 sm:p-10 border border-sky-100 dark:border-zinc-800 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-center text-neutral-900 dark:text-neutral-100 mb-8 flex items-center justify-center gap-2 relative z-10">
          <span>{language === 'gu' ? 'સૌથી લોકપ્રિય શહેરોમાં AQI' : language === 'hi' ? 'सबसे लोकप्रिय शहरों में AQI' : 'AQI in Popular Cities'}</span>
          <span className="text-sky-500">💨</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 relative z-10">
          {filteredCities.map((city) => {
            const isSelected = selectedCity.nameEn === city.nameEn;

            return (
              <button
                key={city.nameEn}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 cursor-pointer select-none text-center ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-800 border-[#38BDF8] ring-2 ring-[#38BDF8]/40 shadow-lg scale-102 z-10'
                    : 'bg-white dark:bg-zinc-800 border-neutral-200/80 dark:border-zinc-700/80 hover:border-sky-300 dark:hover:border-zinc-600 shadow-sm hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <CityReferenceIcon cityKey={city.nameEn} />
                <span className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {getCityName(city)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Most vs Least Polluted Rankings Section (Powered by Live API) ── */}
      <section className="rounded-[2.5rem] bg-[#F8FAFC] dark:bg-zinc-900/60 p-6 sm:p-10 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Card: Most Polluted Cities (Live API Data) */}
          <div className="rounded-[2.2rem] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-center text-zinc-900 dark:text-zinc-100 mb-6">
              {language === 'gu' ? 'સૌથી વધુ પ્રદૂષિત શહેર' : language === 'hi' ? 'सबसे प्रदूषित शहर' : 'Most Polluted Cities'}
            </h3>

            {/* TV9 Light Blue Pill Header Bar */}
            <div className="bg-[#E0F2FE] dark:bg-sky-950/70 text-zinc-900 dark:text-zinc-100 py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex justify-between items-center mb-3 shadow-xs">
              <span className="w-16">રેન્ક</span>
              <span className="flex-1 text-center">શહેર</span>
              <span className="w-16 text-right">AQI</span>
            </div>

            {/* Live API Table Rows */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {mostPollutedList.map((row) => (
                <div
                  key={row.rank}
                  className="py-3.5 px-6 flex justify-between items-center text-base font-extrabold hover:bg-rose-50/40 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                >
                  <span className="w-16 text-zinc-400 font-extrabold">{row.rank}</span>
                  <span className="flex-1 text-center text-zinc-900 dark:text-zinc-100 font-extrabold text-base sm:text-lg">
                    {row.city}
                  </span>
                  <span className="w-16 text-right text-red-600 dark:text-red-400 font-black text-lg sm:text-xl">
                    {row.aqi}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Card: Least Polluted Cities (Live API Data) */}
          <div className="rounded-[2.2rem] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-center text-zinc-900 dark:text-zinc-100 mb-6">
              {language === 'gu' ? 'સૌથી ઓછું પ્રદૂષિત શહેર' : language === 'hi' ? 'सबसे कम प्रदूषित शहर' : 'Least Polluted Cities'}
            </h3>

            {/* TV9 Light Blue Pill Header Bar */}
            <div className="bg-[#E0F2FE] dark:bg-sky-950/70 text-zinc-900 dark:text-zinc-100 py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex justify-between items-center mb-3 shadow-xs">
              <span className="w-16">રેન્ક</span>
              <span className="flex-1 text-center">શહેર</span>
              <span className="w-16 text-right">AQI</span>
            </div>

            {/* Live API Table Rows */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leastPollutedList.map((row) => (
                <div
                  key={row.rank}
                  className="py-3.5 px-6 flex justify-between items-center text-base font-extrabold hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 rounded-xl transition-colors"
                >
                  <span className="w-16 text-zinc-400 font-extrabold">{row.rank}</span>
                  <span className="flex-1 text-center text-zinc-900 dark:text-zinc-100 font-extrabold text-base sm:text-lg">
                    {row.city}
                  </span>
                  <span className="w-16 text-right text-emerald-600 dark:text-emerald-400 font-black text-lg sm:text-xl">
                    {row.aqi}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── AQI Scale Reference Legend ── */}
      <section className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-center">
          {language === 'gu' ? 'હવા ગુણવત્તા ઈન્ડેક્સ સ્કેલ' : language === 'hi' ? 'हवा गुणवत्ता इंडेक्स स्केल' : 'Air Quality Index Scale'}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {AQI_LEVELS.map((lvl) => (
            <div
              key={lvl.range}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-white dark:bg-zinc-900 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-20 h-10 relative flex items-end justify-center mb-2">
                <svg className="w-full h-full" viewBox="0 0 100 50">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={lvl.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute bottom-0 text-xs font-black text-neutral-800 dark:text-neutral-100">
                  {lvl.range}
                </span>
              </div>
              <span className="text-xs font-black uppercase tracking-wide mt-1" style={{ color: lvl.color }}>
                {language === 'gu' ? lvl.statusGu : language === 'hi' ? lvl.statusHi : lvl.statusEn}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related Weather & Rain News Section ── */}
      <section className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center text-zinc-900 dark:text-zinc-100">
          {language === 'gu' ? 'સંબંધિત સમાચાર' : language === 'hi' ? 'संबंधित समाचार' : 'Related News'}
        </h2>

        {/* 4-Column News Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newsArticles.slice(0, visibleNewsCount).map((art) => {
            const title = language === 'gu' ? (art.titleGu || art.title) : language === 'hi' ? (art.titleHi || art.title) : art.title;
            const image = art.featuredImage || 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80';

            return (
              <Link
                key={art.id}
                href={`/news/${art.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    {title}
                  </h4>
                </div>
              </Link>
            );
          })}
        </div>

        {/* "વધુ જુઓ ˅" Button */}
        {visibleNewsCount < newsArticles.length && (
          <div className="flex justify-center pt-6">
            <button
              type="button"
              onClick={() => setVisibleNewsCount((prev) => prev + 4)}
              className="px-10 py-3.5 rounded-full border-2 border-red-600 bg-white dark:bg-zinc-900 text-red-600 hover:bg-red-600 hover:text-white font-black text-sm sm:text-base transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer tracking-wider flex items-center gap-2"
            >
              <span>{language === 'gu' ? 'વધુ જુઓ' : language === 'hi' ? 'और देखें' : 'Read More'}</span>
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
