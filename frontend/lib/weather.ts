/**
 * Live Weather Service for Gujarat Post
 * Uses Open-Meteo API (100% free, real-time, no API key needed)
 */

export interface LiveWeatherResult {
  city: string;
  cityEn: string;
  high: string; // e.g. "૩૪°C"
  low: string;  // e.g. "૨૭°C"
  currentTemp: string; // e.g. "૩૩°C"
  condition: string; // Gujarati: e.g. "આંશિક વાદળછાયું"
  conditionEn: string; // English: e.g. "Partly Cloudy"
  icon: string; // Emoji: e.g. "⛅"
  weatherCode: number;
  humidity?: string;
  windSpeed?: string;
  updatedAt: string;
}

export const GUJARAT_CITIES_COORDS: Record<string, { lat: number; lon: number; nameGu: string; nameEn: string }> = {
  // Major 4 Metros
  ahmedabad: { lat: 23.0225, lon: 72.5714, nameGu: 'અમદાવાદ', nameEn: 'Ahmedabad' },
  surat: { lat: 21.1702, lon: 72.8311, nameGu: 'સુરત', nameEn: 'Surat' },
  vadodara: { lat: 22.3072, lon: 73.1812, nameGu: 'વડોદરા', nameEn: 'Vadodara' },
  rajkot: { lat: 22.3039, lon: 70.8022, nameGu: 'રાજકોટ', nameEn: 'Rajkot' },

  // Other Major Gujarat Cities
  gandhinagar: { lat: 23.2156, lon: 72.6369, nameGu: 'ગાંધીનગર', nameEn: 'Gandhinagar' },
  bhavnagar: { lat: 21.7645, lon: 72.1519, nameGu: 'ભાવનગર', nameEn: 'Bhavnagar' },
  jamnagar: { lat: 22.4707, lon: 70.0577, nameGu: 'જામનગર', nameEn: 'Jamnagar' },
  junagadh: { lat: 21.5222, lon: 70.4579, nameGu: 'જૂનાગઢ', nameEn: 'Junagadh' },
  bhuj: { lat: 23.2420, lon: 69.6669, nameGu: 'ભુજ', nameEn: 'Bhuj' },
  kutch: { lat: 23.2420, lon: 69.6669, nameGu: 'કચ્છ', nameEn: 'Kutch' },
  anand: { lat: 22.5645, lon: 72.9289, nameGu: 'આણંદ', nameEn: 'Anand' },
  mehsana: { lat: 23.5880, lon: 72.3693, nameGu: 'મહેસાણા', nameEn: 'Mehsana' },
  bharuch: { lat: 21.7051, lon: 72.9959, nameGu: 'ભરૂચ', nameEn: 'Bharuch' },
  navsari: { lat: 20.9467, lon: 72.9520, nameGu: 'નવસારી', nameEn: 'Navsari' },
  valsad: { lat: 20.5992, lon: 72.9342, nameGu: 'વલસાડ', nameEn: 'Valsad' },
  morbi: { lat: 22.8173, lon: 70.8370, nameGu: 'મોરબી', nameEn: 'Morbi' },
  surendranagar: { lat: 22.7275, lon: 71.6370, nameGu: 'સુરેન્દ્રનગર', nameEn: 'Surendranagar' },
  amreli: { lat: 21.6032, lon: 71.2221, nameGu: 'અમરેલી', nameEn: 'Amreli' },
  porbandar: { lat: 21.6417, lon: 69.6293, nameGu: 'પોરબંદર', nameEn: 'Porbandar' },
  godhra: { lat: 22.7758, lon: 73.6149, nameGu: 'ગોધરા', nameEn: 'Godhra' },
  himatnagar: { lat: 23.5977, lon: 72.9698, nameGu: 'હિંમતનગર', nameEn: 'Himatnagar' },
  patan: { lat: 23.8493, lon: 72.1266, nameGu: 'પાટણ', nameEn: 'Patan' },
  palanpur: { lat: 24.1724, lon: 72.4346, nameGu: 'પાલનપુર', nameEn: 'Palanpur' },
};

/**
 * Convert English numeric digits to Gujarati digits
 */
export function toGujaratiDigits(num: number | string): string {
  const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
  return String(num).replace(/[0-9]/g, (digit) => gujaratiDigits[parseInt(digit, 10)]);
}

/**
 * Map standard WMO weather codes to Gujarati description, English description, and icon
 */
export function parseWmoCode(code: number): { descGu: string; descEn: string; icon: string } {
  if (code === 0) {
    return { descGu: 'સાફ આકાશ / તડકો', descEn: 'Clear Sky', icon: '☀️' };
  }
  if (code === 1 || code === 2) {
    return { descGu: 'આંશિક વાદળછાયું', descEn: 'Partly Cloudy', icon: '⛅' };
  }
  if (code === 3) {
    return { descGu: 'વાદળછાયું વાતાવરણ', descEn: 'Overcast', icon: '☁️' };
  }
  if (code === 45 || code === 48) {
    return { descGu: 'ધુમ્મસિયું વાતાવરણ', descEn: 'Foggy', icon: '🌫️' };
  }
  if (code >= 51 && code <= 57) {
    return { descGu: 'હળવા વરસાદી ઝાપટાં', descEn: 'Light Drizzle', icon: '🌦️' };
  }
  if (code >= 61 && code <= 67) {
    return { descGu: 'વરસાદ / ઝાપટાં', descEn: 'Rain', icon: '🌧️' };
  }
  if (code >= 71 && code <= 77) {
    return { descGu: 'ઠંડો પવન', descEn: 'Cold Breeze', icon: '❄️' };
  }
  if (code >= 80 && code <= 82) {
    return { descGu: 'ભારે વરસાદી ઝાપટાં', descEn: 'Heavy Showers', icon: '🌧️' };
  }
  if (code >= 95 && code <= 99) {
    return { descGu: 'ગાજવીજ સાથે વરસાદ', descEn: 'Thunderstorm', icon: '⛈️' };
  }
  return { descGu: 'આંશિક વાદળછાયું', descEn: 'Partly Cloudy', icon: '⛅' };
}

/**
 * Guess best icon from Gujarati or English condition string
 */
export function getIconFromConditionText(text: string): string {
  if (!text) return '⛅';
  const lower = text.toLowerCase();
  if (lower.includes('ગાજવીજ') || lower.includes('વાવાઝોડું') || lower.includes('thunder') || lower.includes('storm')) {
    return '⛈️';
  }
  if (lower.includes('વરસાદ') || lower.includes('ઝાપટા') || lower.includes('rain') || lower.includes('shower') || lower.includes('drizzle')) {
    return '🌧️';
  }
  if (lower.includes('તડકો') || lower.includes('સાફ') || lower.includes('ખુલ્લો') || lower.includes('sunny') || lower.includes('clear')) {
    return '☀️';
  }
  if (lower.includes('ધુમ્મસ') || lower.includes('fog') || lower.includes('mist')) {
    return '🌫️';
  }
  if (lower.includes('વાદળછાયું') || lower.includes('વાદળછાઈ') || lower.includes('partly')) {
    return '⛅';
  }
  if (lower.includes('વાદળ') || lower.includes('cloud') || lower.includes('overcast')) {
    return '☁️';
  }
  return '⛅';
}

/**
 * Normalize city input string (Gujarati or English) to a key in GUJARAT_CITIES_COORDS
 */
export function normalizeCityKey(cityInput?: string): string {
  if (!cityInput) return 'ahmedabad';
  const trimmed = cityInput.trim().toLowerCase();

  for (const [key, val] of Object.entries(GUJARAT_CITIES_COORDS)) {
    if (trimmed === key || trimmed === val.nameEn.toLowerCase() || trimmed === val.nameGu) {
      return key;
    }
  }

  // Partial match checks
  if (trimmed.includes('અમદાવાદ') || trimmed.includes('ahmedabad')) return 'ahmedabad';
  if (trimmed.includes('સુરત') || trimmed.includes('surat')) return 'surat';
  if (trimmed.includes('વડોદરા') || trimmed.includes('vadodara') || trimmed.includes('baroda')) return 'vadodara';
  if (trimmed.includes('રાજકોટ') || trimmed.includes('rajkot')) return 'rajkot';
  if (trimmed.includes('ગાંધીનગર') || trimmed.includes('gandhinagar')) return 'gandhinagar';
  if (trimmed.includes('ભાવનગર') || trimmed.includes('bhavnagar')) return 'bhavnagar';
  if (trimmed.includes('જામનગર') || trimmed.includes('jamnagar')) return 'jamnagar';
  if (trimmed.includes('જૂનાગઢ') || trimmed.includes('junagadh')) return 'junagadh';
  if (trimmed.includes('ભુજ') || trimmed.includes('bhuj') || trimmed.includes('કચ્છ') || trimmed.includes('kutch')) return 'bhuj';

  return 'ahmedabad';
}

// In-memory weather cache to prevent redundant external fetches and avoid 503 rate-limits
const weatherMemoryCache = new Map<string, { data: LiveWeatherResult; timestamp: number }>();
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache
let openMeteoCooldownUntil = 0;

/**
 * Fetch live weather with resilient multi-tier fallback:
 * 1. Fast in-memory cache (10 min TTL)
 * 2. Open-Meteo API (primary)
 * 3. Wttr.in API (reliable secondary mirror if Open-Meteo is 503 overloaded)
 * 4. Stale cache / realistic Gujarat seasonal weather fallback
 */
export async function fetchLiveCityWeather(cityInput?: string): Promise<LiveWeatherResult> {
  const cityKey = normalizeCityKey(cityInput);
  const cityInfo = GUJARAT_CITIES_COORDS[cityKey] || GUJARAT_CITIES_COORDS.ahmedabad;
  const now = Date.now();

  // 1. Serve from in-memory cache if fresh
  const cached = weatherMemoryCache.get(cityKey);
  if (cached && (now - cached.timestamp) < WEATHER_CACHE_TTL) {
    return cached.data;
  }

  // 2. Attempt Open-Meteo API (only if not on cooldown due to 503/overload)
  if (now >= openMeteoCooldownUntil) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia%2FKolkata`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(url, {
        next: { revalidate: 600 },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const current = data.current || {};
        const daily = data.daily || {};

        const maxTempNum = Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m ?? 34);
        const minTempNum = Math.round(daily.temperature_2m_min?.[0] ?? 26);
        const currTempNum = Math.round(current.temperature_2m ?? 32);
        const weatherCode = daily.weather_code?.[0] ?? current.weather_code ?? 2;

        const parsed = parseWmoCode(weatherCode);

        const result: LiveWeatherResult = {
          city: cityInfo.nameGu,
          cityEn: cityInfo.nameEn,
          high: `${toGujaratiDigits(maxTempNum)}°C`,
          low: `${toGujaratiDigits(minTempNum)}°C`,
          currentTemp: `${toGujaratiDigits(currTempNum)}°C`,
          condition: parsed.descGu,
          conditionEn: parsed.descEn,
          icon: parsed.icon,
          weatherCode,
          humidity: `${current.relative_humidity_2m ?? 60}%`,
          windSpeed: `${Math.round(current.wind_speed_10m ?? 12)} km/h`,
          updatedAt: new Date().toISOString(),
        };

        weatherMemoryCache.set(cityKey, { data: result, timestamp: Date.now() });
        return result;
      } else if (res.status === 503 || res.status === 429) {
        // Open-Meteo is overloaded - set 5 minute cooldown to avoid hammering the service
        openMeteoCooldownUntil = Date.now() + 5 * 60 * 1000;
      }
    } catch {
      // Open-Meteo network timeout / abort
      openMeteoCooldownUntil = Date.now() + 2 * 60 * 1000;
    }
  }

  // 3. Secondary Backup: Wttr.in JSON API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const wttrUrl = `https://wttr.in/${encodeURIComponent(cityInfo.nameEn)}?format=j1`;
    const wttrRes = await fetch(wttrUrl, {
      headers: { 'User-Agent': 'curl/7.68.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (wttrRes.ok) {
      const wttrJson = await wttrRes.json();
      const curr = wttrJson.current_condition?.[0] || {};
      const today = wttrJson.weather?.[0] || {};

      const currTempNum = parseInt(curr.temp_C, 10) || 32;
      const maxTempNum = parseInt(today.maxtempC, 10) || currTempNum + 3;
      const minTempNum = parseInt(today.mintempC, 10) || currTempNum - 6;

      const descEn = curr.weatherDesc?.[0]?.value?.trim() || 'Partly Cloudy';
      const icon = getIconFromConditionText(descEn);

      let descGu = 'આંશિક વાદળછાયું';
      const lower = descEn.toLowerCase();
      if (lower.includes('sunny') || lower.includes('clear')) descGu = 'સાફ આકાશ / તડકો';
      else if (lower.includes('rain') || lower.includes('drizzle')) descGu = 'વરસાદ / ઝાપટાં';
      else if (lower.includes('thunder')) descGu = 'ગાજવીજ સાથે વરસાદ';
      else if (lower.includes('fog') || lower.includes('mist')) descGu = 'ધુમ્મસિયું વાતાવરણ';
      else if (lower.includes('overcast') || lower.includes('cloud')) descGu = 'વાદળછાયું વાતાવરણ';

      const result: LiveWeatherResult = {
        city: cityInfo.nameGu,
        cityEn: cityInfo.nameEn,
        high: `${toGujaratiDigits(maxTempNum)}°C`,
        low: `${toGujaratiDigits(minTempNum)}°C`,
        currentTemp: `${toGujaratiDigits(currTempNum)}°C`,
        condition: descGu,
        conditionEn: descEn,
        icon,
        weatherCode: 2,
        humidity: `${curr.humidity || 60}%`,
        windSpeed: `${curr.windspeedKmph || 12} km/h`,
        updatedAt: new Date().toISOString(),
      };

      weatherMemoryCache.set(cityKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch {
    // Secondary backup timed out or failed
  }

  // 4. Return stale cache if available
  if (cached) {
    return cached.data;
  }

  // 5. Realistic Gujarat seasonal default fallback (prevents UI errors & page hangs)
  const fallbackResult: LiveWeatherResult = {
    city: cityInfo.nameGu,
    cityEn: cityInfo.nameEn,
    high: '૩૪°C',
    low: '૨૬°C',
    currentTemp: '૩૨°C',
    condition: 'સાફ આકાશ / તડકો',
    conditionEn: 'Clear Sky',
    icon: '☀️',
    weatherCode: 0,
    humidity: '58%',
    windSpeed: '12 km/h',
    updatedAt: new Date().toISOString(),
  };

  weatherMemoryCache.set(cityKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}
