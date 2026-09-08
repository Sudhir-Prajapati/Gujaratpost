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

/**
 * Fetch live weather from Open-Meteo API
 */
export async function fetchLiveCityWeather(cityInput?: string): Promise<LiveWeatherResult> {
  const cityKey = normalizeCityKey(cityInput);
  const cityInfo = GUJARAT_CITIES_COORDS[cityKey] || GUJARAT_CITIES_COORDS.ahmedabad;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia%2FKolkata`;
    
    const res = await fetch(url, { next: { revalidate: 600 } }); // 10 minutes cache
    if (!res.ok) throw new Error(`Open-Meteo returned status ${res.status}`);

    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const maxTempNum = Math.round(daily.temperature_2m_max?.[0] ?? current.temperature_2m ?? 34);
    const minTempNum = Math.round(daily.temperature_2m_min?.[0] ?? 26);
    const currTempNum = Math.round(current.temperature_2m ?? 32);
    const weatherCode = daily.weather_code?.[0] ?? current.weather_code ?? 2;

    const parsed = parseWmoCode(weatherCode);

    return {
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
  } catch (error) {
    console.warn('Failed to fetch live weather from Open-Meteo:', error);
    // Graceful fallback with realistic defaults
    return {
      city: cityInfo.nameGu,
      cityEn: cityInfo.nameEn,
      high: '૩૪°C',
      low: '૨૬°C',
      currentTemp: '૩૨°C',
      condition: 'આંશિક વાદળછાયું',
      conditionEn: 'Partly Cloudy',
      icon: '⛅',
      weatherCode: 2,
      humidity: '65%',
      windSpeed: '14 km/h',
      updatedAt: new Date().toISOString(),
    };
  }
}
