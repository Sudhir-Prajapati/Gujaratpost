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
    crimeRes,
    nationalRes,
    worldRes,
    entertainRes,
    healthRes,
    techRes,
    factcheckRes,
    sportsRes,
    politicsRes,
  ] = await Promise.all([
    getPublicArticles({ limit: 60, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getHeroSettings().catch(() => null),
    getPublicCategories({ showInHome: true }).catch(() => []),
    getPublicVideos('video').catch(() => []),
    withTimeout(getMarketRates().catch(() => null), 150, null),
    withTimeout(getPublicWeather('ahmedabad').catch(() => null), 150, null),
    getPublicReels().catch(() => []),
    // Category-specific articles for instant SSR rendering
    getPublicArticles({ categorySlug: 'crime', limit: 25 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'national', limit: 10 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'world', limit: 10 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'manoranjan', limit: 4 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'health', limit: 4 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'technology', limit: 4 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'factcheck', limit: 9 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'sports', limit: 7 }).catch(() => ({ articles: [] })),
    getPublicArticles({ categorySlug: 'politics', limit: 8 }).catch(() => ({ articles: [] })),
  ]);

  const articles = (articlesRes && Array.isArray(articlesRes.articles)) ? articlesRes.articles : [];
  const videos = Array.isArray(videosRes) ? videosRes : [];
  const reels = Array.isArray(reelsRes) ? reelsRes : [];

  const initialCategoryArticles: Record<string, any[]> = {
    crime: crimeRes.articles || [],
    national: nationalRes.articles || [],
    world: worldRes.articles || [],
    manoranjan: entertainRes.articles || [],
    entertainment: entertainRes.articles || [],
    health: healthRes.articles || [],
    technology: techRes.articles || [],
    factcheck: factcheckRes.articles || [],
    'fact-check': factcheckRes.articles || [],
    sports: sportsRes.articles || [],
    politics: politicsRes.articles || [],
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
