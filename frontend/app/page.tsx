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
  // Fetch core home datasets in parallel using a single unified articles query.
  // This eliminates 11 redundant database queries and prevents backend connection timeouts.
  const [
    articlesRes,
    heroSettings,
    categories,
    videosRes,
    marketRatesRes,
    weatherRes,
    reelsRes,
  ] = await Promise.all([
    getPublicArticles({ limit: 80, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getHeroSettings().catch(() => null),
    getPublicCategories({ showInHome: true }).catch(() => []),
    getPublicVideos('video').catch(() => []),
    withTimeout(getMarketRates().catch(() => null), 150, null),
    withTimeout(getPublicWeather('ahmedabad').catch(() => null), 150, null),
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
      return tokens.some((token) => token === t || token.includes(t));
    });
  };

  // Efficiently partition articles by category from the unified query
  const initialCategoryArticles: Record<string, any[]> = {
    gujarat: sortByLatest(articles.filter((a) => isCat(a, 'gujarat', 'state'))),
    crime: sortByLatest(articles.filter((a) => isCat(a, 'crime', 'ક્રાઇમ'))),
    national: sortByLatest(articles.filter((a) => isCat(a, 'national', 'india', 'ભારત'))),
    world: sortByLatest(articles.filter((a) => isCat(a, 'world', 'international', 'videsh', 'વિદેશ', 'વિશ્વ'))),
    manoranjan: sortByDate(articles.filter((a) => isCat(a, 'manoranjan', 'entertainment', 'મનોરંજન'))),
    entertainment: sortByDate(articles.filter((a) => isCat(a, 'manoranjan', 'entertainment', 'મનોરંજન'))),
    health: sortByLatest(articles.filter((a) => isCat(a, 'health', 'હેલ્થ', 'આરોગ્ય'))),
    technology: sortByLatest(articles.filter((a) => isCat(a, 'technology', 'tech', 'ટેકનોલોજી'))),
    factcheck: sortByLatest(articles.filter((a) => isCat(a, 'fact-check', 'factcheck', 'ફેક્ટ'))),
    'fact-check': sortByLatest(articles.filter((a) => isCat(a, 'fact-check', 'factcheck', 'ફેક્ટ'))),
    sports: sortByLatest(articles.filter((a) => isCat(a, 'sports', 'સ્પોર્ટ્સ', 'રમત'))),
    politics: sortByLatest(articles.filter((a) => isCat(a, 'politics', 'rajkaran', 'રાજકારણ'))),
    business: sortByLatest(articles.filter((a) => isCat(a, 'business', 'વેપાર', 'બિઝનેસ'))),
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
