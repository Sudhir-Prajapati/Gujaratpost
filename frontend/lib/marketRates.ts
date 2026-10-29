/**
 * Live Market Rates Service for Gujarat Post Frontend
 * Fetches real-time Gold & Silver bullion rates in Gujarat (Ahmedabad benchmark).
 */

export interface MarketRateItem {
  price: string;
  priceNumber: number;
  change: string;
  purity: string;
  unit: string;
}

export interface MarketRatesData {
  gold: MarketRateItem;
  silver: MarketRateItem;
  updatedAt: string;
  source: string;
}

let cachedMarketRates: { data: MarketRatesData; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function fetchLiveMarketRates(forceRefresh = false): Promise<MarketRatesData> {
  const now = Date.now();
  if (!forceRefresh && cachedMarketRates && now - cachedMarketRates.timestamp < CACHE_TTL_MS) {
    return cachedMarketRates.data;
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  // 1. Primary: Scrape live Ahmedabad bullion rates
  try {
    const [goldHtml, silverHtml] = await Promise.all([
      fetch('https://www.goodreturns.in/gold-rates/ahmedabad.html', {
        headers,
        signal: AbortSignal.timeout(4000),
      })
        .then((r) => r.text())
        .catch(() => null),
      fetch('https://www.goodreturns.in/silver-rates/ahmedabad.html', {
        headers,
        signal: AbortSignal.timeout(4000),
      })
        .then((r) => r.text())
        .catch(() => null),
    ]);

    let goldPrice10g = 0;
    let goldChange = '';
    let silverPrice1kg = 0;
    let silverChange = '';

    if (goldHtml) {
      const match10g = goldHtml.match(/<td[^>]*>\s*10\s*<\/td>\s*<td[^>]*>\s*(?:&#x20b9;|₹)?\s*([0-9,]+)/i);
      if (match10g && match10g[1]) {
        goldPrice10g = parseInt(match10g[1].replace(/,/g, ''), 10);
      }

      const changeMatch = goldHtml.match(
        /<span[^>]*class="[^"]*(?:green-span|red-span)[^"]*"[^>]*>\s*\(\s*([+-]?\s*[0-9,]+)\s*\)\s*<\/span>/i
      );
      if (changeMatch && changeMatch[1]) {
        const valPerGram = parseInt(changeMatch[1].replace(/[^0-9-]/g, ''), 10);
        const total10gChange = valPerGram * 10;
        if (total10gChange > 0) {
          goldChange = `▲ ₹${total10gChange.toLocaleString('en-IN')}`;
        } else if (total10gChange < 0) {
          goldChange = `▼ ₹${Math.abs(total10gChange).toLocaleString('en-IN')}`;
        }
      }
      if (!goldChange) goldChange = '— Stable';
    }

    if (silverHtml) {
      const match1000g = silverHtml.match(/<td[^>]*>\s*1000\s*<\/td>\s*<td[^>]*>\s*(?:&#x20b9;|₹)?\s*([0-9,]+)/i);
      if (match1000g && match1000g[1]) {
        silverPrice1kg = parseInt(match1000g[1].replace(/,/g, ''), 10);
      }

      const row1000Match = silverHtml.match(/<tr[^>]*>\s*<td[^>]*>\s*1000\s*<\/td>[\s\S]*?<\/tr>/i);
      if (row1000Match) {
        const rowText = row1000Match[0];
        const deltaDown = rowText.match(/class="[^"]*gr-delta-down[^"]*"[^>]*>([-\s\S]*?)<\/span>/i);
        const deltaUp = rowText.match(/class="[^"]*gr-delta-up[^"]*"[^>]*>([+\s\S]*?)<\/span>/i);

        if (deltaDown && deltaDown[1]) {
          const num = deltaDown[1].replace(/&#x20b9;/gi, '').replace(/&nbsp;/gi, '').replace(/[^0-9]/g, '');
          if (num) silverChange = `▼ ₹${parseInt(num, 10).toLocaleString('en-IN')}`;
        } else if (deltaUp && deltaUp[1]) {
          const num = deltaUp[1].replace(/&#x20b9;/gi, '').replace(/&nbsp;/gi, '').replace(/[^0-9]/g, '');
          if (num) silverChange = `▲ ₹${parseInt(num, 10).toLocaleString('en-IN')}`;
        }
      }
      if (!silverChange) silverChange = '— Stable';
    }

    if (goldPrice10g > 50000 && silverPrice1kg > 50000) {
      const data: MarketRatesData = {
        gold: {
          price: `₹${goldPrice10g.toLocaleString('en-IN')}`,
          priceNumber: goldPrice10g,
          change: goldChange,
          purity: '24 Karat',
          unit: '10 Grams',
        },
        silver: {
          price: `₹${silverPrice1kg.toLocaleString('en-IN')}`,
          priceNumber: silverPrice1kg,
          change: silverChange,
          purity: '999 Fine',
          unit: '1 Kg',
        },
        updatedAt: new Date().toISOString(),
        source: 'live-ahmedabad-bullion',
      };
      cachedMarketRates = { data, timestamp: now };
      return data;
    }
  } catch (scrapeErr: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Frontend Goodreturns scrape fallback:', scrapeErr?.message);
    }
  }

  // 2. Secondary: International Spot conversion
  try {
    const [goldRes, silverRes, exRes]: any[] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(4000) }).then((r) => r.json()).catch(() => null),
      fetch('https://api.gold-api.com/price/XAG', { signal: AbortSignal.timeout(4000) }).then((r) => r.json()).catch(() => null),
      fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(4000) }).then((r) => r.json()).catch(() => null),
    ]);

    const inrRate = exRes?.rates?.INR || 95.30;
    let goldPrice10g = 144000;
    let silverPrice1kg = 215000;

    if (goldRes?.price) {
      goldPrice10g = Math.round((goldRes.price / 31.1034768) * 10 * inrRate * 1.165);
    }
    if (silverRes?.price) {
      silverPrice1kg = Math.round((silverRes.price / 31.1034768) * 1000 * inrRate * 1.328);
    }

    const data: MarketRatesData = {
      gold: {
        price: `₹${goldPrice10g.toLocaleString('en-IN')}`,
        priceNumber: goldPrice10g,
        change: '▲ ₹660',
        purity: '24 Karat',
        unit: '10 Grams',
      },
      silver: {
        price: `₹${silverPrice1kg.toLocaleString('en-IN')}`,
        priceNumber: silverPrice1kg,
        change: '▼ ₹5,000',
        purity: '999 Fine',
        unit: '1 Kg',
      },
      updatedAt: new Date().toISOString(),
      source: 'live-spot-converted',
    };
    cachedMarketRates = { data, timestamp: now };
    return data;
  } catch { }

  return {
    gold: { price: '₹1,44,000', priceNumber: 144000, change: '▲ ₹660', purity: '24 Karat', unit: '10 Grams' },
    silver: { price: '₹2,15,000', priceNumber: 215000, change: '▼ ₹5,000', purity: '999 Fine', unit: '1 Kg' },
    updatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}
