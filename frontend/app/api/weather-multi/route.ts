import { NextResponse } from 'next/server';

export const revalidate = 600; // Cache for 10 minutes

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Vadodara: { lat: 22.3072, lon: 73.1812 },
  Surat: { lat: 21.1702, lon: 72.8311 },
  Rajkot: { lat: 22.3039, lon: 70.8022 },
};

function parseWmoCode(code: number) {
  if (code === 0) return { desc: 'Clear sky', descGu: 'સ્વચ્છ આકાશ', icon: 'sun' };
  if (code <= 3) return { desc: 'Partly cloudy', descGu: 'વાદળછાઈ', icon: 'cloud' };
  if (code <= 48) return { desc: 'Foggy', descGu: 'ધુમ્મસ', icon: 'cloud' };
  if (code <= 55) return { desc: 'Drizzle', descGu: 'ઝરમર વરસાદ', icon: 'rain' };
  if (code <= 65) return { desc: 'Heavy Rain', descGu: 'ભારે વરસાદ', icon: 'rain' };
  if (code <= 82) return { desc: 'Showers', descGu: 'ઝાપટાં', icon: 'rain' };
  if (code <= 99) return { desc: 'Thunderstorm', descGu: 'ગાજવીજ સાથે વરસાદ', icon: 'rain' };
  return { desc: 'Partly cloudy', descGu: 'વાદળછાઈ', icon: 'cloud' };
}

function parseAqi(val: number) {
  if (val <= 50) return { label: 'Good', labelGu: 'સારું' };
  if (val <= 100) return { label: 'Satisfactory', labelGu: 'સંતોષકારક' };
  if (val <= 200) return { label: 'Moderate', labelGu: 'સાધારણ' };
  if (val <= 300) return { label: 'Poor', labelGu: 'ખરાબ' };
  return { label: 'Very Poor', labelGu: 'અતિ ખરાબ' };
}

interface CacheStore {
  timestamp: number;
  data: any;
}
let memoryCache: CacheStore | null = null;
let inFlightRequest: Promise<any> | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (memoryCache && (now - memoryCache.timestamp) < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, data: memoryCache.data, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } }
    );
  }

  if (inFlightRequest) {
    try {
      const data = await inFlightRequest;
      return NextResponse.json(
        { success: true, data, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } }
      );
    } catch { }
  }

  const fetchTask = (async () => {
    const cities = ['Ahmedabad', 'Vadodara', 'Surat', 'Rajkot'];
    const weatherData: Record<string, any> = {};
    const aqiData: Record<string, any> = {};

    await Promise.all(
      cities.map(async (city) => {
        const coords = CITY_COORDS[city];
        if (!coords) return;

        try {
          const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`,
            { next: { revalidate: 600 } }
          );
          if (wRes.ok) {
            const wJson = await wRes.json();
            if (wJson?.current) {
              const c = wJson.current;
              const parsed = parseWmoCode(c.weather_code);
              weatherData[city] = {
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
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=us_aqi,pm10,pm2_5`,
            { next: { revalidate: 600 } }
          );
          if (aRes.ok) {
            const aJson = await aRes.json();
            if (aJson?.current) {
              const c = aJson.current;
              const val = Math.round(c.us_aqi || 65);
              const parsedAqi = parseAqi(val);
              aqiData[city] = {
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

    const payload = { weatherData, aqiData };
    memoryCache = { timestamp: Date.now(), data: payload };
    return payload;
  })();

  inFlightRequest = fetchTask;

  try {
    const data = await fetchTask;
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } }
    );
  } catch (err: any) {
    if (memoryCache) {
      return NextResponse.json({ success: true, data: memoryCache.data, stale: true });
    }
    return NextResponse.json({ success: false, error: err?.message }, { status: 200 });
  } finally {
    inFlightRequest = null;
  }
}
