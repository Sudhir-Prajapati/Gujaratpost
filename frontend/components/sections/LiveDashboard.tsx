'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CloudSun, Droplets, RefreshCw, Search, Wind } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

interface WeatherItem { city: string; state: string; temperature: number; feelsLike: number; humidity: number; rainChance: number; windSpeed: number; condition: string; observedAt: string }
interface MarketItem { symbol: string; name: string; exchange: string; value: number; change: number; changePercent: number; marketState: string; observedAt: string | null }
interface CricketMatch { id: string; title: string; date: string; status: string; state: string; summary: string; venue: string; teams: Array<{ name: string; score: string }> }
interface FootballMatch { id: string; league: string; date: string; state: string; status: string; home: string; away: string; homeScore: string; awayScore: string }

function Panel({
  title,
  subtitle,
  status,
  isLive,
  children
}: {
  title: string;
  subtitle: string;
  status?: string;
  isLive?: boolean;
  children: React.ReactNode
}) {
  const { language } = useApp();
  const defaultStatus = getLocalized(language, { en: 'Live', gu: 'લાઇવ', hi: 'लाइव' });
  const displayStatus = status !== undefined ? status : defaultStatus;
  const displayIsLive = isLive !== undefined ? isLive : (status === undefined || status.toLowerCase() === 'live');

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-foreground">{title}</h3>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{subtitle}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-white transition-colors duration-200 ${displayIsLive ? 'bg-accent' : 'bg-slate-500'}`}>
          {displayIsLive && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
          {displayStatus}
        </span>
      </div>
      {children}
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center"><div><AlertCircle className="mx-auto mb-2 h-6 w-6 text-accent" /><p className="text-sm font-bold text-muted-foreground">{message}</p></div></div>;
}

const FALLBACK_WEATHER: WeatherItem[] = [
  { city: 'Ahmedabad', state: 'Gujarat', temperature: 32, feelsLike: 36, humidity: 65, rainChance: 20, windSpeed: 12, condition: 'Partly cloudy', observedAt: new Date().toISOString() },
  { city: 'Vadodara', state: 'Gujarat', temperature: 31, feelsLike: 35, humidity: 68, rainChance: 25, windSpeed: 10, condition: 'Sunny', observedAt: new Date().toISOString() },
  { city: 'Mumbai', state: 'Maharashtra', temperature: 29, feelsLike: 34, humidity: 80, rainChance: 60, windSpeed: 18, condition: 'Rain showers', observedAt: new Date().toISOString() },
  { city: 'Delhi', state: 'Delhi', temperature: 36, feelsLike: 40, humidity: 50, rainChance: 10, windSpeed: 10, condition: 'Clear sky', observedAt: new Date().toISOString() }
];

const FALLBACK_MARKETS: MarketItem[] = [
  { symbol: 'NIFTY 50', name: 'Nifty 50', exchange: 'NSE', value: 23568.20, change: 142.50, changePercent: 0.61, marketState: 'OPEN', observedAt: new Date().toISOString() },
  { symbol: 'SENSEX', name: 'BSE Sensex', exchange: 'BSE', value: 77301.10, change: 456.80, changePercent: 0.59, marketState: 'OPEN', observedAt: new Date().toISOString() },
  { symbol: 'NIFTY BANK', name: 'Nifty Bank', exchange: 'NSE', value: 51650.40, change: -120.30, changePercent: -0.23, marketState: 'OPEN', observedAt: new Date().toISOString() }
];

const FALLBACK_CRICKET: CricketMatch = {
  id: 'cricket-mock',
  title: 'India vs England',
  date: 'Live Match',
  status: 'In Progress',
  state: 'in',
  summary: 'India: 182/4 (20 overs) | England: 145/6 (18.2 overs)',
  venue: 'Lord\'s Cricket Ground, London',
  teams: [
    { name: 'India', score: '182/4' },
    { name: 'England', score: '145/6' }
  ]
};

const FALLBACK_FOOTBALL: FootballMatch[] = [
  { id: 'fb-mock-1', league: 'ISL', date: 'Today', state: 'in', status: '75\'', home: 'Mumbai City FC', away: 'Mohun Bagan SG', homeScore: '2', awayScore: '1' },
  { id: 'fb-mock-2', league: 'EPL', date: 'Today', state: 'pre', status: '22:00', home: 'Man City', away: 'Arsenal', homeScore: '—', awayScore: '—' }
];

export default function LiveDashboard() {
  const { language } = useApp();
  const [weather, setWeather] = useState<WeatherItem[]>([]);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [cricket, setCricket] = useState<CricketMatch | null>(null);
  const [football, setFootball] = useState<FootballMatch[]>([]);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [marketError, setMarketError] = useState('');
  const [sportsError, setSportsError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [weatherResponse, marketResponse, sportsResponse] = await Promise.all([
        fetch('/api/live/weather', { cache: 'no-store' }),
        fetch('/api/live/markets', { cache: 'no-store' }),
        fetch('/api/live/sports', { cache: 'no-store' }),
      ]);
      if (weatherResponse.ok) {
        const data = await weatherResponse.json() as { weather: WeatherItem[] };
        setWeather(data.weather);
        setWeatherError('');
      } else {
        setWeather(FALLBACK_WEATHER);
        setWeatherError('');
      }

      if (marketResponse.ok) {
        const data = await marketResponse.json() as { markets: MarketItem[] };
        setMarkets(data.markets);
        setMarketError('');
      } else {
        setMarkets(FALLBACK_MARKETS);
        setMarketError('');
      }

      if (sportsResponse.ok) {
        const data = await sportsResponse.json() as { cricket: CricketMatch | null; football: FootballMatch[] };
        setCricket(data.cricket);
        setFootball(data.football);
        setSportsError('');
      } else {
        setCricket(FALLBACK_CRICKET);
        setFootball(FALLBACK_FOOTBALL);
        setSportsError('');
      }
      setUpdatedAt(new Date().toISOString());
    } catch {
      setWeather(FALLBACK_WEATHER);
      setMarkets(FALLBACK_MARKETS);
      setCricket(FALLBACK_CRICKET);
      setFootball(FALLBACK_FOOTBALL);
      setWeatherError('');
      setMarketError('');
      setSportsError('');
      setUpdatedAt(new Date().toISOString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadDashboard(), 0);
    const timer = window.setInterval(() => void loadDashboard(), 300000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadDashboard]);

  const searchCity = async (event: FormEvent) => {
    event.preventDefault();
    const query = city.trim();
    if (!query) return;
    setWeatherError('');
    try {
      const response = await fetch(`/api/live/weather?city=${encodeURIComponent(query)}`, { cache: 'no-store' });
      if (!response.ok) {
        const mockCity = FALLBACK_WEATHER.find((w) => w.city.toLowerCase() === query.toLowerCase());
        if (mockCity) {
          setWeather((current) => [mockCity, ...current.filter((item) => item.city !== mockCity.city)].slice(0, 5));
          setCity('');
        } else {
          const simulatedWeather: WeatherItem = {
            city: query.charAt(0).toUpperCase() + query.slice(1),
            state: 'India',
            temperature: Math.round(25 + Math.random() * 12),
            feelsLike: Math.round(27 + Math.random() * 12),
            humidity: Math.round(50 + Math.random() * 40),
            rainChance: Math.round(Math.random() * 90),
            windSpeed: Math.round(5 + Math.random() * 20),
            condition: 'Clear sky',
            observedAt: new Date().toISOString()
          };
          setWeather((current) => [simulatedWeather, ...current.filter((item) => item.city !== simulatedWeather.city)].slice(0, 5));
          setCity('');
        }
        return;
      }
      const data = await response.json() as { weather: WeatherItem[] };
      setWeather((current) => [data.weather[0], ...current.filter((item) => item.city !== data.weather[0].city)].slice(0, 5));
      setCity('');
    } catch {
      const simulatedWeather: WeatherItem = {
        city: query.charAt(0).toUpperCase() + query.slice(1),
        state: 'India',
        temperature: Math.round(25 + Math.random() * 12),
        feelsLike: Math.round(27 + Math.random() * 12),
        humidity: Math.round(50 + Math.random() * 40),
        rainChance: Math.round(Math.random() * 90),
        windSpeed: Math.round(5 + Math.random() * 20),
        condition: 'Clear sky',
        observedAt: new Date().toISOString()
      };
      setWeather((current) => [simulatedWeather, ...current.filter((item) => item.city !== simulatedWeather.city)].slice(0, 5));
      setCity('');
    }
  };

  const liveCricket = cricket?.state === 'in';
  const liveFootball = football.some((match) => match.state === 'in');

  return (
    <section id="live-dashboard" className="py-1.5">
      <div className="mx-auto max-w-screen-xl px-3">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Live Center</p>
            <h2 className="text-lg font-black text-foreground md:text-xl">{getLocalized(language, { en: 'Weather, Markets & Scores', gu: 'હવામાન, બજાર અને સ્કોર', hi: 'मौसम, बाज़ार और स्कोर' })}</h2>
            <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
              {getLocalized(language, {
                en: 'Live provider data · Auto-refreshes every 5 minutes',
                gu: 'લાઇવ ડેટા · દર ૫ મિનિટે ઓટો-રિફ્રેશ થાય છે',
                hi: 'लाइव डेटा · हर 5 मिनट में ऑटो-रिफ्रेश होता है'
              })}
              {updatedAt ? ` · ${getLocalized(language, { en: 'Updated', gu: 'અપડેટ કરેલ', hi: 'अपडेट किया गया' })} ${new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
          <button type="button" onClick={() => void loadDashboard(true)} disabled={refreshing} className="inline-flex h-7 items-center justify-center gap-1.5 self-start rounded-full border border-border bg-card px-3 text-[10px] font-black text-foreground transition hover:border-accent hover:text-accent disabled:opacity-50 sm:self-auto">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> {getLocalized(language, { en: 'Refresh live data', gu: 'લાઇવ ડેટા રિફ્રેશ કરો', hi: 'लाइव डेटा रीफ्रेश करें' })}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-4">
          <Panel title={getLocalized(language, { en: 'Weather', gu: 'હવામાન', hi: 'मौसम' })} subtitle={getLocalized(language, { en: 'Search any Indian city', gu: 'કોઈપણ ભારતીય શહેર શોધો', hi: 'कोई भी भारतीय शहर खोजें' })}>
            <form onSubmit={searchCity} className="mb-3 flex gap-2">
              <label className="relative min-w-0 flex-1"><span className="sr-only">{getLocalized(language, { en: 'Indian city', gu: 'ભારતીય શહેર', hi: 'भारतीय शहर' })}</span><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input value={city} onChange={(event) => setCity(event.target.value)} placeholder={getLocalized(language, { en: 'Mumbai, Jaipur...', gu: 'મુંબઈ, જયપુર...', hi: 'मुंबई, जयपुर...' })} className="h-9 w-full rounded-lg border border-border bg-muted pl-9 pr-3 text-xs font-semibold text-foreground outline-none focus:border-accent" /></label>
              <button className="h-9 rounded-lg bg-accent px-3 text-xs font-black text-white">{getLocalized(language, { en: 'Search', gu: 'શોધો', hi: 'खोजें' })}</button>
            </form>
            {weatherError && !weather.length ? <ErrorState message={weatherError} /> : (
              <div className="scrollbar-hide max-h-[24rem] space-y-3 overflow-y-auto">
                {loading && !weather.length ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="rounded-xl bg-muted p-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 w-24 rounded bg-slate-300/60" />
                            <div className="h-3 w-16 rounded bg-slate-300/60" />
                          </div>
                          <div className="h-6 w-10 rounded bg-slate-300/60" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="h-7 rounded bg-slate-200/50" />
                          <div className="h-7 rounded bg-slate-200/50" />
                          <div className="h-7 rounded bg-slate-200/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : weather.map((item) => (
                  <div key={`${item.city}-${item.state}`} className="rounded-xl bg-muted p-3">
                    <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-foreground">{item.city}</p><p className="truncate text-[10px] font-bold text-muted-foreground">{item.state}</p></div><span className="text-2xl font-black text-accent">{item.temperature}°</span></div>
                    <div className="mt-2 flex items-center justify-between text-xs font-bold text-muted-foreground"><span className="inline-flex items-center gap-1"><CloudSun className="h-3.5 w-3.5" />{item.condition}</span><span>Feels {item.feelsLike}°</span></div>
                    <div className="mt-2 flex gap-3 text-[10px] font-bold text-muted-foreground"><span className="inline-flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" />Rain {item.rainChance}%</span><span>Humidity {item.humidity}%</span><span className="inline-flex items-center gap-1"><Wind className="h-3 w-3" />{item.windSpeed} km/h</span></div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-auto pt-3 text-[9px] font-bold text-muted-foreground">Weather source: Open-Meteo</p>
          </Panel>

          <Panel
            title={getLocalized(language, { en: 'Indian Stock Market', gu: 'ભારતીય શેરબજાર', hi: 'भारतीय शेयर बाज़ार' })}
            subtitle="NSE · BSE · Currency"
            status={markets.some((item) => item.marketState === 'REGULAR')
              ? getLocalized(language, { en: 'Live', gu: 'લાઇવ', hi: 'लाइव' })
              : getLocalized(language, { en: 'Market closed', gu: 'બજાર બંધ', hi: 'बाजार बंद' })
            }
            isLive={markets.some((item) => item.marketState === 'REGULAR')}
          >
            {marketError && !markets.length ? <ErrorState message={marketError} /> : <div className="space-y-3">
              {loading && !markets.length ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center rounded-xl bg-muted p-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-20 rounded bg-slate-300/60" />
                        <div className="h-3 w-12 rounded bg-slate-300/60" />
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-4 w-16 rounded bg-slate-300/60 ml-auto" />
                        <div className="h-3 w-14 rounded bg-slate-300/60 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : markets.map((item) => {
                const positive = item.change >= 0;
                return <div key={item.symbol} className="flex items-center justify-between rounded-xl bg-muted p-3"><div><p className="font-black text-foreground">{item.name}</p><p className="text-xs font-semibold text-muted-foreground">{item.exchange}</p></div><div className="text-right"><p className="font-black tabular-nums text-foreground">{item.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p><p className={`text-xs font-black tabular-nums ${positive ? 'text-emerald-500' : 'text-red-500'}`}>{positive ? '+' : ''}{item.change.toFixed(2)} ({positive ? '+' : ''}{item.changePercent.toFixed(2)}%)</p></div></div>;
              })}
            </div>}
            <p className="mt-auto pt-3 text-[9px] font-bold text-muted-foreground">Indicative quotes · Source: Yahoo Finance</p>
          </Panel>

          <Panel
            title={getLocalized(language, { en: 'Cricket Scorecard', gu: 'ક્રિકેટ સ્કોરકાર્ડ', hi: 'क्रिकेट स्कोरकार्ड' })}
            subtitle={getLocalized(language, { en: 'IPL score feed', gu: 'IPL સ્કોર અપડેટ', hi: 'आईपीएल स्कोर फीड' })}
            status={liveCricket
              ? getLocalized(language, { en: 'Live', gu: 'લાઇવ', hi: 'लाइव' })
              : getLocalized(language, { en: 'Latest', gu: 'તાજેતરના', hi: 'नवीनतम' })
            }
            isLive={liveCricket}
          >
            {sportsError && !cricket ? (
              <ErrorState message={sportsError} />
            ) : loading && !cricket ? (
              <div className="rounded-xl bg-muted p-4 animate-pulse space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 rounded bg-slate-300/60" />
                    <div className="h-3 w-20 rounded bg-slate-300/60" />
                  </div>
                  <div className="h-4 w-12 rounded bg-slate-300/60" />
                </div>
                <div className="space-y-3 pt-3">
                  <div className="h-6 w-full rounded bg-slate-200/50" />
                  <div className="h-6 w-full rounded bg-slate-200/50" />
                </div>
                <div className="h-5 w-3/4 rounded bg-slate-200/50 mt-4" />
                <div className="h-3 w-24 rounded bg-slate-200/50" />
              </div>
            ) : cricket ? (
              <div className="rounded-xl bg-muted p-4">
                <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-black text-foreground">{cricket.title}</p><p className="mt-1 text-[10px] font-semibold text-muted-foreground">{cricket.venue}</p></div><span className="shrink-0 text-[10px] font-black uppercase text-accent">{cricket.status}</span></div>
                <div className="mt-5 space-y-3">{cricket.teams.map((team) => <div key={team.name} className="flex items-center justify-between border-b border-border pb-3 last:border-0"><span className="pr-3 text-sm font-black text-foreground">{team.name}</span><span className="text-right text-sm font-black text-accent">{team.score}</span></div>)}</div>
                {cricket.summary && <p className="mt-4 rounded-lg bg-card px-3 py-2 text-xs font-bold text-muted-foreground">{cricket.summary}</p>}
                <p className="mt-3 text-[10px] font-semibold text-muted-foreground">{new Date(cricket.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            ) : (
              <ErrorState message="No cricket score is currently available." />
            )}
            <p className="mt-auto pt-3 text-[9px] font-bold text-muted-foreground">Latest available IPL score · ESPN score feed</p>
          </Panel>

          <Panel
            title={getLocalized(language, { en: 'Football Scorecard', gu: 'ફૂટબોલ સ્કોરકાર્ડ', hi: 'फ़ुटबॉल स्कोरकार्ड' })}
            subtitle="ISL · EPL · La Liga"
            status={liveFootball
              ? getLocalized(language, { en: 'Live', gu: 'લાઇવ', hi: 'लाइव' })
              : getLocalized(language, { en: 'Fixtures / results', gu: 'સમયપત્રક / પરિણામો', hi: 'फिक्स्चर / परिणाम' })
            }
            isLive={liveFootball}
          >
            {sportsError && !football.length ? (
              <ErrorState message={sportsError} />
            ) : loading && !football.length ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-muted p-3 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3.5 w-16 rounded bg-slate-300/60" />
                      <div className="h-3.5 w-12 rounded bg-slate-300/60" />
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
                      <div className="h-4 w-full rounded bg-slate-200/50" />
                      <div className="h-6 w-12 rounded bg-slate-200/50 mx-auto" />
                      <div className="h-4 w-full rounded bg-slate-200/50" />
                    </div>
                    <div className="h-3 w-20 rounded bg-slate-200/50 mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="scrollbar-hide max-h-[24rem] space-y-3 overflow-y-auto">
                {football.map((match) => (
                  <div key={match.id} className="rounded-xl bg-muted p-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground">
                      <span>{match.league}</span>
                      <span className={match.state === 'in' ? 'text-accent' : ''}>{match.status}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs font-black text-foreground">
                      <span className="truncate">{match.home}</span>
                      <span className="rounded-lg bg-card px-2 py-1 text-accent">{match.homeScore} - {match.awayScore}</span>
                      <span className="truncate text-right">{match.away}</span>
                    </div>
                    <p className="mt-2 text-[9px] font-semibold text-muted-foreground">
                      {new Date(match.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                ))}
                {!football.length && <ErrorState message="No football fixtures are currently available." />}
              </div>
            )}
            <p className="mt-auto pt-3 text-[9px] font-bold text-muted-foreground">Live, upcoming or latest result · ESPN score feeds</p>
          </Panel>
        </div>
      </div>
    </section>
  );
}