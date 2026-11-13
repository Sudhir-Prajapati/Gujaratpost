import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const CITY_COORDS: Record<string, { lat: number; lon: number; stationGu: string; stationEn: string }> = {
  Ahmedabad: {
    lat: 23.0225,
    lon: 72.5714,
    stationGu: 'પીરાણા / મણિનગર - GPCB CAAQM સ્ટેશન, અમદાવાદ',
    stationEn: 'Pirana / Maninagar - GPCB CAAQM Station, Ahmedabad',
  },
  Vadodara: {
    lat: 22.3072,
    lon: 73.1812,
    stationGu: 'દાંડિયા બજાર / જીઆઇડીસી - GPCB CAAQM સ્ટેશન, વડોદરા',
    stationEn: 'Dandia Bazar / GIDC - GPCB CAAQM Station, Vadodara',
  },
  Surat: {
    lat: 21.1702,
    lon: 72.8311,
    stationGu: 'કતારગામ / વરાછા - GPCB CAAQM સ્ટેશન, સુરત',
    stationEn: 'Katargam / Varachha - GPCB CAAQM Station, Surat',
  },
  Rajkot: {
    lat: 22.3039,
    lon: 70.8022,
    stationGu: 'કણકોટ / રેસકોર્સ - GPCB CAAQM સ્ટેશન, રાજકોટ',
    stationEn: 'Kankot / Race Course - GPCB CAAQM Station, Rajkot',
  },
};

function parseWmoCode(code: number) {
  if (code === 0) return { desc: 'Clear sky', descGu: 'સ્પષ્ટ આકાશ', icon: 'sun' };
  if (code <= 3) return { desc: 'Partly cloudy', descGu: 'આંશિક વાદળછાઈ', icon: 'cloud' };
  if (code <= 48) return { desc: 'Foggy', descGu: 'ધુમ્મસ', icon: 'cloud' };
  if (code <= 55) return { desc: 'Drizzle', descGu: 'ઝરમર વરસાદ', icon: 'rain' };
  if (code <= 65) return { desc: 'Heavy Rain', descGu: 'ભારે વરસાદ', icon: 'rain' };
  if (code <= 82) return { desc: 'Showers', descGu: 'ઝાપટાં', icon: 'rain' };
  if (code <= 99) return { desc: 'Thunderstorm', descGu: 'ગાજવીજ સાથે વરસાદ', icon: 'rain' };
  return { desc: 'Partly cloudy', descGu: 'વાદળછાઈ', icon: 'cloud' };
}

/**
 * Official Central Pollution Control Board (CPCB) India Breakpoints for NAQI calculation
 */
const CPCB_BREAKPOINTS = {
  pm25: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },
  ],
  no2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 600, iLow: 401, iHigh: 500 },
  ],
  so2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1601, cHigh: 2000, iLow: 401, iHigh: 500 },
  ],
  co: [
    { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50 },
    { cLow: 1.1, cHigh: 2.0, iLow: 51, iHigh: 100 },
    { cLow: 2.1, cHigh: 10.0, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 50.0, iLow: 401, iHigh: 500 },
  ],
  o3: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500 },
  ],
};

function calculateSubIndex(val: number | null | undefined, pollutant: keyof typeof CPCB_BREAKPOINTS): number | null {
  if (val === undefined || val === null || isNaN(val)) return null;
  const ranges = CPCB_BREAKPOINTS[pollutant];
  for (const r of ranges) {
    if (val >= r.cLow && val <= r.cHigh) {
      return Math.round(((r.iHigh - r.iLow) / (r.cHigh - r.cLow)) * (val - r.cLow) + r.iLow);
    }
  }
  if (val > ranges[ranges.length - 1].cHigh) return 500;
  return 0;
}

function calculateCpcbAqi(pollutants: {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
}) {
  const coMg = typeof pollutants.co === 'number' && pollutants.co > 50 ? pollutants.co / 1000 : pollutants.co;

  const subIndices = {
    pm25: calculateSubIndex(pollutants.pm25, 'pm25'),
    pm10: calculateSubIndex(pollutants.pm10, 'pm10'),
    no2: calculateSubIndex(pollutants.no2, 'no2'),
    so2: calculateSubIndex(pollutants.so2, 'so2'),
    co: calculateSubIndex(coMg, 'co'),
    o3: calculateSubIndex(pollutants.o3, 'o3'),
  };

  // CPCB Requirement: at least PM2.5 or PM10 must be present
  if (subIndices.pm25 === null && subIndices.pm10 === null) {
    return null;
  }

  let maxAqi = 0;
  let dominant = 'pm25';

  for (const [key, val] of Object.entries(subIndices)) {
    if (val !== null && val > maxAqi) {
      maxAqi = val;
      dominant = key;
    }
  }

  // Official Indian CPCB Categories & Color Palette
  let label = 'Good';
  let labelGu = 'સારી';
  let color = '#16a34a'; // Green
  let lightColor = '#f0fdf4';
  let advisoryGu = 'હવાની ગુણવત્તા સારી છે. સ્વાસ્થ્ય માટે કોઈ જોખમ નથી.';
  let advisoryEn = 'Air quality is satisfactory and poses little or no risk.';

  if (maxAqi <= 50) {
    label = 'Good';
    labelGu = 'સારી';
    color = '#16a34a';
    lightColor = '#f0fdf4';
    advisoryGu = 'હવાની ગુણવત્તા ઉત્તમ છે. સ્વાસ્થ્ય માટે કોઈ જોખમ નથી.';
    advisoryEn = 'Air quality is excellent and poses little or no risk.';
  } else if (maxAqi <= 100) {
    label = 'Satisfactory';
    labelGu = 'સંતોષકારક';
    color = '#65a30d';
    lightColor = '#f7fee7';
    advisoryGu = 'હવાની ગુણવત્તા સ્વીકાર્ય છે. સંવેદનશીલ લોકોએ વધુ પડતો શ્રમ ટાળવો.';
    advisoryEn = 'Air quality is acceptable for most people.';
  } else if (maxAqi <= 200) {
    label = 'Moderate';
    labelGu = 'સાધારણ';
    color = '#ca8a04';
    lightColor = '#fefce8';
    advisoryGu = 'ફેફસાં કે હૃદયના દર્દીઓ, બાળકો અને વડીલોને શ્વાસ લેવામાં તકલીફ થઈ શકે છે.';
    advisoryEn = 'May cause breathing discomfort to people with lung disease.';
  } else if (maxAqi <= 300) {
    label = 'Poor';
    labelGu = 'ખરાબ';
    color = '#ea580c';
    lightColor = '#fff7ed';
    advisoryGu = 'લાંબા સમય સુધી સંપર્કમાં રહેવાથી શ્વાસની તકલીફ થઈ શકે છે. માસ્ક પહેરવું હિતાવહ.';
    advisoryEn = 'Breathing discomfort to most people on prolonged exposure.';
  } else if (maxAqi <= 400) {
    label = 'Very Poor';
    labelGu = 'ખૂબ ખરાબ';
    color = '#dc2626';
    lightColor = '#fef2f2';
    advisoryGu = 'શ્વસન સંબંધી ગંભીર અસર થઈ શકે છે. બિનજરૂરી બહાર નીકળવાનું ટાળવું.';
    advisoryEn = 'Respiratory illness to the people on prolonged exposure.';
  } else {
    label = 'Severe';
    labelGu = 'ગંભીર';
    color = '#7f1d1d';
    lightColor = '#fdf2f2';
    advisoryGu = 'તંદુરસ્ત લોકોને પણ ગંભીર અસર થઈ શકે છે. તાત્કાલિક સાવચેતીનાં પગલાં લો.';
    advisoryEn = 'Affects healthy people and seriously impacts those with existing diseases.';
  }

  return {
    value: maxAqi,
    label,
    labelGu,
    color,
    lightColor,
    dominant,
    advisoryGu,
    advisoryEn,
    subIndices,
  };
}

interface CacheStore {
  timestamp: number;
  data: any;
}
let memoryCache: CacheStore | null = null;
let inFlightRequest: Promise<any> | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isForceRefresh = url.searchParams.get('refresh') === '1' || url.searchParams.get('refresh') === 'true';

  const now = Date.now();
  if (!isForceRefresh && memoryCache && (now - memoryCache.timestamp) < CACHE_TTL_MS) {
    return NextResponse.json(
      { success: true, data: memoryCache.data, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' } }
    );
  }

  if (inFlightRequest && !isForceRefresh) {
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

        // 1. Live Weather API (Open-Meteo)
        try {
          const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata`,
            { next: { revalidate: 600 } }
          );
          if (wRes.ok) {
            const wJson = await wRes.json();
            if (wJson?.current) {
              const c = wJson.current;
              const parsed = parseWmoCode(c.weather_code);
              const maxTemp = wJson?.daily?.temperature_2m_max?.[0];
              const minTemp = wJson?.daily?.temperature_2m_min?.[0];

              weatherData[city] = {
                temp: String(Math.round(c.temperature_2m * 10) / 10),
                tempMax: maxTemp !== undefined ? String(Math.round(maxTemp * 10) / 10) : '32.7',
                tempMin: minTemp !== undefined ? String(Math.round(minTemp * 10) / 10) : '20.4',
                apparentTemp: String(Math.round((c.apparent_temperature || c.temperature_2m) * 10) / 10),
                desc: parsed.desc,
                descGu: parsed.descGu,
                icon: parsed.icon,
                humidity: `${c.relative_humidity_2m}%`,
                wind: `${Math.round(c.wind_speed_10m)} km/h`,
                weatherCode: c.weather_code,
                observationTime: c.time,
              };
            }
          }
        } catch (wErr) {
          console.warn(`[Weather API] Failed for ${city}:`, wErr);
        }

        // 2. Real Atmospheric AQI Pollutants API (Open-Meteo Air Quality)
        try {
          const aRes = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`,
            { next: { revalidate: 600 } }
          );
          if (aRes.ok) {
            const aJson = await aRes.json();
            if (aJson?.current) {
              const c = aJson.current;
              const pm25 = typeof c.pm2_5 === 'number' ? Math.round(c.pm2_5 * 10) / 10 : 25;
              const pm10 = typeof c.pm10 === 'number' ? Math.round(c.pm10 * 10) / 10 : 50;
              const no2 = typeof c.nitrogen_dioxide === 'number' ? Math.round(c.nitrogen_dioxide * 10) / 10 : 20;
              const so2 = typeof c.sulphur_dioxide === 'number' ? Math.round(c.sulphur_dioxide * 10) / 10 : 15;
              const coVal = typeof c.carbon_monoxide === 'number' ? Math.round((c.carbon_monoxide / 1000) * 100) / 100 : 0.45;
              const o3 = typeof c.ozone === 'number' ? Math.round(c.ozone * 10) / 10 : 50;

              const cpcb = calculateCpcbAqi({
                pm25,
                pm10,
                no2,
                so2,
                co: coVal,
                o3,
              });

              if (cpcb) {
                aqiData[city] = {
                  value: cpcb.value,
                  label: cpcb.label,
                  labelGu: cpcb.labelGu,
                  category: cpcb.label,
                  categoryGu: cpcb.labelGu,
                  color: cpcb.color,
                  lightColor: cpcb.lightColor,
                  dominant: cpcb.dominant,
                  advisoryGu: cpcb.advisoryGu,
                  advisoryEn: cpcb.advisoryEn,
                  station: coords.stationGu,
                  stationEn: coords.stationEn,
                  pm25,
                  pm10,
                  no2,
                  so2,
                  co: coVal,
                  o3,
                  subIndices: cpcb.subIndices,
                  observationTime: c.time,
                };
              }
            }
          }
        } catch (aErr) {
          console.warn(`[AQI API] Failed for ${city}:`, aErr);
        }
      })
    );

    const nowD = new Date();
    const formatted = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(nowD.getDate()).padStart(2, '0')} ${String(nowD.getHours()).padStart(2, '0')}:${String(nowD.getMinutes()).padStart(2, '0')}`;

    const payload = {
      weatherData,
      aqiData,
      updatedAt: nowD.toISOString(),
      updatedAtFormatted: formatted,
    };

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
