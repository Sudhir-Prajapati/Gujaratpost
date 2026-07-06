import { NextRequest } from 'next/server';

const conditionFor = (code: number) => {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
};

interface GeoResult { name: string; latitude: number; longitude: number; admin1?: string; country_code: string }
interface GeoResponse { results?: GeoResult[] }
interface ForecastResponse {
  current: { time: string; temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number };
  daily: { precipitation_probability_max: number[] };
}

async function weatherForCity(city: string) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json&countryCode=IN`;
  const geoResponse = await fetch(geoUrl, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
  if (!geoResponse.ok) throw new Error('Location service unavailable');
  const geo = (await geoResponse.json()) as GeoResponse;
  const location = geo.results?.find((item) => item.country_code === 'IN');
  if (!location) return null;

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.searchParams.set('latitude', String(location.latitude));
  forecastUrl.searchParams.set('longitude', String(location.longitude));
  forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');
  forecastUrl.searchParams.set('daily', 'precipitation_probability_max');
  forecastUrl.searchParams.set('timezone', 'auto');
  forecastUrl.searchParams.set('forecast_days', '1');
  const forecastResponse = await fetch(forecastUrl, { next: { revalidate: 900 }, signal: AbortSignal.timeout(5000) });
  if (!forecastResponse.ok) throw new Error('Weather service unavailable');
  const forecast = (await forecastResponse.json()) as ForecastResponse;

  return {
    city: location.name,
    state: location.admin1 ?? '',
    temperature: Math.round(forecast.current.temperature_2m),
    feelsLike: Math.round(forecast.current.apparent_temperature),
    humidity: forecast.current.relative_humidity_2m,
    rainChance: forecast.daily.precipitation_probability_max[0] ?? 0,
    windSpeed: Math.round(forecast.current.wind_speed_10m),
    condition: conditionFor(forecast.current.weather_code),
    observedAt: forecast.current.time,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('cities') ?? request.nextUrl.searchParams.get('city') ?? 'Ahmedabad,Delhi,Mumbai,Bengaluru';
  const cities = query.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8);
  try {
    const results = (await Promise.all(cities.map(weatherForCity))).filter(Boolean);
    if (!results.length) return Response.json({ error: 'No Indian city found' }, { status: 404 });
    return Response.json({ weather: results, updatedAt: new Date().toISOString(), source: 'Open-Meteo' });
  } catch {
    return Response.json({ error: 'Live weather is temporarily unavailable' }, { status: 503 });
  }
}
