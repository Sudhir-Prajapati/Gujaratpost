const indices = [
  { symbol: '^BSESN', name: 'Sensex', exchange: 'BSE' },
  { symbol: '^NSEI', name: 'Nifty 50', exchange: 'NSE' },
  { symbol: '^NSEBANK', name: 'Bank Nifty', exchange: 'NSE' },
  { symbol: 'INR=X', name: 'USD / INR', exchange: 'FX' },
];

interface ChartResponse {
  chart: { result?: Array<{ meta: { regularMarketPrice?: number; chartPreviousClose?: number; regularMarketTime?: number; currency?: string; marketState?: string } }> };
}

async function quote(item: (typeof indices)[number]) {
  let data: ChartResponse | null = null;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try {
      const response = await fetch(`https://${host}/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=1d&range=2d`, {
        next: { revalidate: 60 },
        headers: { 'User-Agent': 'Mozilla/5.0 GujaratPost/1.0' },
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) { data = (await response.json()) as ChartResponse; break; }
    } catch { /* Try the backup Yahoo host. */ }
  }
  if (!data) return null;
  const meta = data.chart.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) return null;
  const previous = meta.chartPreviousClose ?? meta.regularMarketPrice;
  const change = meta.regularMarketPrice - previous;
  return {
    ...item,
    value: meta.regularMarketPrice,
    change,
    changePercent: previous ? (change / previous) * 100 : 0,
    currency: meta.currency ?? 'INR',
    marketState: meta.marketState ?? 'CLOSED',
    observedAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
  };
}

export async function GET() {
  const markets = (await Promise.all(indices.map(quote))).filter(Boolean);
  return Response.json({ markets, available: markets.length > 0, error: markets.length ? null : 'Market provider did not respond in time', updatedAt: new Date().toISOString(), source: 'Yahoo Finance' });
}
