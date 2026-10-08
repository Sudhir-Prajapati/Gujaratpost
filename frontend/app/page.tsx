import HeroSection from "@/components/sections/HeroSection";
import { getPublicArticles, getHeroSettings, getPublicCategories, getPublicVideos, getMarketRates, getPublicWeather, getPublicReels } from "@/lib/api";

// Next.js ISR cache revalidation interval (30 seconds)
export const revalidate = 30;

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);

export default async function HomePage() {
  // Fetch all data in parallel — main articles, hero settings, categories, videos,
  // reels, AND category-specific articles — so every section loads data immediately on render.
  const [
    articlesRes,
    heroSettings,
    categories,
    videosRes,
    marketRatesRes,
    weatherRes,
    reelsRes,
    gujaratRes,
    crimeRes,
    nationalRes,
    worldRes,
    entertainRes,
    healthRes,
    techRes,
    factcheckRes,
    sportsRes,
    politicsRes,
    businessRes,
  ] = await Promise.all([
    getPublicArticles({ limit: 60, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getHeroSettings().catch(() => null),
    getPublicCategories({ showInHome: true }).catch(() => []),
    getPublicVideos('video').catch(() => []),
    withTimeout(getMarketRates().catch(() => null), 150, null),
    withTimeout(getPublicWeather('ahmedabad').catch(() => null), 150, null),
    getPublicReels().catch(() => []),
    // Category-specific articles for instant SSR rendering
    getPublicArticles({ categorySlug: 'gujarat', limit: 25, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'crime', limit: 25, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'national', limit: 12, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'world', limit: 12, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'manoranjan', limit: 6, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'health', limit: 6, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'technology', limit: 6, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'fact-check', limit: 20, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'sports', limit: 8, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'politics', limit: 10, sort: 'latest' }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'business', limit: 8, sort: 'latest' }).catch(() => ({ articles: [] })),
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

  const articles = (articlesRes && Array.isArray(articlesRes.articles)) ? sortByLatest(articlesRes.articles) : [];
  const videos = Array.isArray(videosRes) ? videosRes : [];
  const reels = Array.isArray(reelsRes) ? reelsRes : [];

  const initialCategoryArticles: Record<string, any[]> = {
    gujarat: sortByLatest(gujaratRes.articles || []),
    crime: sortByLatest(crimeRes.articles || []),
    national: sortByLatest(nationalRes.articles || []),
    world: sortByLatest(worldRes.articles || []),
    manoranjan: sortByLatest(entertainRes.articles || []),
    entertainment: sortByLatest(entertainRes.articles || []),
    health: sortByLatest(healthRes.articles || []),
    technology: sortByLatest(techRes.articles || []),
    factcheck: sortByLatest(factcheckRes.articles || []),
    'fact-check': sortByLatest(factcheckRes.articles || []),
    sports: sortByLatest(sportsRes.articles || []),
    politics: sortByLatest(politicsRes.articles || []),
    business: sortByLatest(businessRes.articles || []),
  };

  return (
    <div>
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
