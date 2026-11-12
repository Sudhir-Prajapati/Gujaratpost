import HeroSection from "@/components/sections/HeroSection";
import ElectionBanner from "@/components/layout/ElectionBanner";
import BreakingNewsShowcase from "@/components/sections/BreakingNewsShowcase";
import { getPublicArticles, getHeroSettings, getPublicCategories, getPublicVideos, getMarketRates, getPublicWeather, getPublicReels } from "@/lib/api";

// Next.js ISR cache revalidation interval (30 seconds)
export const revalidate = 30;

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);

export default async function HomePage() {
  // Fetch core home datasets in parallel using a single unified articles query.
  // This eliminates 11 redundant database queries and prevents backend connection timeouts.
  const [
    articlesRes,
    techArticlesRes,
    factCheckArticlesRes,
    crimeArticlesRes,
    heroSettings,
    categories,
    videosRes,
    marketRatesRes,
    weatherRes,
    reelsRes,
  ] = await Promise.all([
    getPublicArticles({ limit: 80, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    withTimeout(getPublicArticles({ categorySlug: 'technology', limit: 12, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })), 2500, { articles: [], total: 0, totalPages: 1 }),
    withTimeout(getPublicArticles({ categorySlug: 'fact-check', limit: 15, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })), 2500, { articles: [], total: 0, totalPages: 1 }),
    withTimeout(getPublicArticles({ categorySlug: 'crime', limit: 25, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })), 2500, { articles: [], total: 0, totalPages: 1 }),
    getHeroSettings(true).catch(() => null),
    getPublicCategories({ showInHome: true }).catch(() => []),
    getPublicVideos('video').catch(() => []),
    withTimeout(getMarketRates().catch(() => null), 1500, null),
    withTimeout(getPublicWeather('ahmedabad').catch(() => null), 1500, null),
    getPublicReels().catch(() => []),
  ]);

  const sortByLatest = <T extends any>(list: T[]): T[] => {
    return [...(list || [])].sort((a: any, b: any) => {
      const aNum = typeof a?.articleNumber === 'number' ? a.articleNumber : (parseInt(a?.articleNumber, 10) || 0);
      const bNum = typeof b?.articleNumber === 'number' ? b.articleNumber : (parseInt(b?.articleNumber, 10) || 0);
      if (bNum !== aNum) return bNum - aNum;
      const aTime = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
      const bTime = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  };
  const sortByDate = <T extends any>(list: T[]): T[] =>
    [...(list || [])].sort((a: any, b: any) =>
      new Date(b?.publishedAt || b?.createdAt || 0).getTime() - new Date(a?.publishedAt || a?.createdAt || 0).getTime()
    );

  const articles = (articlesRes && Array.isArray(articlesRes.articles)) ? sortByLatest(articlesRes.articles) : [];
  const videos = Array.isArray(videosRes) ? videosRes : [];
  const reels = Array.isArray(reelsRes) ? reelsRes : [];

  const getArticleCategoryTokens = (a: any): string[] => {
    if (!a) return [];
    const tokens: string[] = [];
    const add = (v: any) => {
      if (typeof v === 'string' && v.trim()) tokens.push(v.toLowerCase().trim());
    };

    // Primary category tokens
    add(a.categoryId);
    add(a.categorySlug);
    if (typeof a.category === 'string') {
      add(a.category);
    } else if (a.category && typeof a.category === 'object') {
      add(a.category.id);
      add(a.category.slug);
      add(a.category.name);
      add(a.category.nameGu);
      add(a.category.nameHi);
    }
    add(a.categoryName);
    add(a.categoryGu);
    add(a.categoryHi);
    add(a.location);

    // Multi-categories array
    if (Array.isArray(a.categories)) {
      for (const item of a.categories) {
        if (!item) continue;
        add(item.id);
        add(item.categoryId);
        add(item.slug);
        add(item.name);
        add(item.nameGu);
        add(item.nameHi);
        if (item.category && typeof item.category === 'object') {
          add(item.category.id);
          add(item.category.slug);
          add(item.category.name);
          add(item.category.nameGu);
          add(item.category.nameHi);
        }
      }
    }

    return tokens;
  };

  const isCat = (a: any, ...slugs: string[]): boolean => {
    const tokens = getArticleCategoryTokens(a);
    return slugs.some((target) => {
      const t = target.toLowerCase().trim();
      return tokens.some((token) => token === t);
    });
  };

  // Efficiently partition articles by category from the unified query
  const initialCategoryArticles: Record<string, any[]> = {
    gujarat: sortByLatest(articles.filter((a) => isCat(a, 'gujarat', 'state'))),
    crime: sortByLatest([
      ...articles.filter((a) => isCat(a, 'crime', 'ક્રાઇમ')),
      ...(((crimeArticlesRes as any)?.articles) || [])
    ].filter((a, idx, self) => (a.id || a.slug) && self.findIndex((b) => (b.id && b.id === a.id) || (b.slug && b.slug === a.slug)) === idx)),
    national: sortByLatest(articles.filter((a) => isCat(a, 'national', 'india', 'ભારત'))),
    world: sortByLatest(articles.filter((a) => isCat(a, 'world', 'international', 'videsh', 'વિદેશ', 'વિશ્વ'))),
    manoranjan: sortByDate(articles.filter((a) => isCat(a, 'manoranjan', 'entertainment', 'મનોરંજન'))),
    entertainment: sortByDate(articles.filter((a) => isCat(a, 'manoranjan', 'entertainment', 'મનોરંજન'))),
    health: sortByLatest(articles.filter((a) => isCat(a, 'health', 'હેલ્થ', 'આરોગ્ય'))),
    technology: sortByLatest([
      ...articles.filter((a) => isCat(a, 'technology', 'tech', 'ટેકનોલોજી')),
      ...(((techArticlesRes as any)?.articles) || [])
    ].filter((a, idx, self) => (a.id || a.slug) && self.findIndex((b) => (b.id && b.id === a.id) || (b.slug && b.slug === a.slug)) === idx)),
    factcheck: sortByLatest([
      ...articles.filter((a) => isCat(a, 'fact-check', 'factcheck', 'ફેક્ટ')),
      ...(((factCheckArticlesRes as any)?.articles) || [])
    ].filter((a, idx, self) => (a.id || a.slug) && self.findIndex((b) => (b.id && b.id === a.id) || (b.slug && b.slug === a.slug)) === idx)),
    'fact-check': sortByLatest([
      ...articles.filter((a) => isCat(a, 'fact-check', 'factcheck', 'ફેક્ટ')),
      ...(((factCheckArticlesRes as any)?.articles) || [])
    ].filter((a, idx, self) => (a.id || a.slug) && self.findIndex((b) => (b.id && b.id === a.id) || (b.slug && b.slug === a.slug)) === idx)),
    sports: sortByLatest(articles.filter((a) => isCat(a, 'sports', 'સ્પોર્ટ્સ', 'રમત'))),
    politics: sortByLatest(articles.filter((a) => isCat(a, 'politics', 'rajkaran', 'રાજકારણ'))),
    business: sortByLatest(articles.filter((a) => isCat(a, 'business', 'વેપાર', 'બિઝનેસ'))),
  };

  let electionBannerInitial: any = null;
  let breakingBannerInitial: any = null;
  if (heroSettings) {
    const isEnabled = (heroSettings as any)?.electionBannerEnabled ?? (heroSettings as any)?.setting?.electionBannerEnabled ?? false;
    const rawJson = (heroSettings as any)?.electionBannerJson || (heroSettings as any)?.setting?.electionBannerJson;
    let parsed: any = {};
    if (typeof rawJson === 'string' && rawJson.trim()) {
      try { parsed = JSON.parse(rawJson); } catch {}
    } else if (typeof rawJson === 'object' && rawJson !== null) {
      parsed = rawJson;
    }
    electionBannerInitial = {
      enabled: Boolean(isEnabled),
      title: parsed.title || 'ગુજરાત ચૂંટણી 2026',
      showLive: parsed.showLive !== undefined ? Boolean(parsed.showLive) : true,
      mapIconUrl: parsed.mapIconUrl || '',
      totalSeats: parsed.totalSeats !== undefined ? parsed.totalSeats : 182,
      majorityTarget: parsed.majorityTarget !== undefined ? parsed.majorityTarget : 92,
      showOnAllPages: Boolean(parsed.showOnAllPages),
      parties: (Array.isArray(parsed.parties) && parsed.parties.length > 0 ? parsed.parties : [
        { id: 'bjp', name: 'BJP', nameGu: 'BJP', logoUrl: '', seats: 100, color: '#FF6B00' },
        { id: 'cong', name: 'Congress', nameGu: 'Congress', logoUrl: '', seats: 55, color: '#19AAED' },
        { id: 'aap', name: 'AAP', nameGu: 'AAP', logoUrl: '', seats: 15, color: '#0066CC' },
        { id: 'oth', name: 'અન્ય', nameGu: 'અન્ય', logoUrl: '', seats: 12, color: '#6B7280' },
      ]).map((p: any) => ({
        ...p,
        logoUrl: p.logoUrl && p.logoUrl.includes('wikimedia.org') ? '' : (p.logoUrl || ''),
      })),
    };

    // TV Breaking News Showcase Banner (Populated directly from admin hero settings)
    const isBreakingEnabled = (heroSettings as any)?.breakingBannerEnabled ?? (heroSettings as any)?.setting?.breakingBannerEnabled ?? false;
    const rawBreakingJson = (heroSettings as any)?.breakingBannerJson || (heroSettings as any)?.setting?.breakingBannerJson;
    let parsedBreaking: any = {};
    if (typeof rawBreakingJson === 'string' && rawBreakingJson.trim()) {
      try { parsedBreaking = JSON.parse(rawBreakingJson); } catch {}
    } else if (typeof rawBreakingJson === 'object' && rawBreakingJson !== null) {
      parsedBreaking = rawBreakingJson;
    }

    breakingBannerInitial = {
      enabled: Boolean(isBreakingEnabled),
      badgeText: parsedBreaking?.badgeText || 'BREAKING NEWS',
      liveUpdateText: parsedBreaking?.liveUpdateText || '',
      intervalSeconds: Number(parsedBreaking?.intervalSeconds) || 4,
      slides: Array.isArray(parsedBreaking?.slides) && parsedBreaking.slides.length > 0
        ? parsedBreaking.slides
        : [
            {
              id: 'slide-1',
              image: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=1200&q=80',
              link: '',
              texts: [
                'ગુજરાતમાં આગામી ૪૮ કલાક ભારે વરસાદની હવામાન વિભાગની આગાહી',
                'દિલ્હીમાં પ્રદૂષણનો સ્તર વધ્યો, GRAP લાગુ',
                'શેર બજારમાં સેન્સેક્સ 700 પોઇન્ટ વધ્યો',
              ],
            },
            {
              id: 'slide-2',
              image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
              link: '',
              texts: [
                'દક્ષિણ ગુજરાત અને સૌરાષ્ટ્રના દરિયાકાંઠાના વિસ્તારોમાં યલો એલર્ટ જાહેર કરાયું',
                'માછીમારોને આગામી સૂચના સુધી દરિયો ન ખેડવા હવામાન કેન્દ્રની ચેતવણી',
              ],
            },
          ],
    };
  }

  return (
    <div>
      <ElectionBanner initialConfig={electionBannerInitial} />
      <BreakingNewsShowcase initialConfig={breakingBannerInitial} />
      {/* Main 3-column portal layout containing all active sections */}
      <HeroSection
        initialArticles={articles}
        initialVideos={videos}
        initialHeroSettings={heroSettings}
        initialCategories={Array.isArray(categories) ? categories : []}
        initialMarketRates={marketRatesRes}
        initialWeatherData={weatherRes}
        initialCategoryArticles={initialCategoryArticles}
        initialReels={reels}
      />
    </div>
  );
}
