import HeroSection from "@/components/sections/HeroSection";
import { getPublicArticles, getHeroSettings, getPublicCategories, getPublicVideos, getMarketRates, getPublicWeather } from "@/lib/api";

// Next.js ISR cache revalidation interval (30 seconds)
export const revalidate = 30;

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);

export default async function HomePage() {
  const [articlesRes, heroSettings, categories, videosRes, marketRatesRes, weatherRes] = await Promise.all([
    getPublicArticles({ limit: 60, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getHeroSettings().catch(() => null),
    getPublicCategories({ showInHome: true }).catch(() => []),
    getPublicVideos('video').catch(() => []),
    withTimeout(getMarketRates().catch(() => null), 150, null),
    withTimeout(getPublicWeather('ahmedabad').catch(() => null), 150, null),
  ]);

  const articles = (articlesRes && Array.isArray(articlesRes.articles)) ? articlesRes.articles : [];
  const videos = Array.isArray(videosRes) ? videosRes : [];

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
      />
    </div>
  );
}
