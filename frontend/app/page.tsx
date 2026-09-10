import HeroSection from "@/components/sections/HeroSection";
import { getPublicArticles, getHeroSettings, getPublicCategories } from "@/lib/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // Videos are NOT fetched here — YouTubeLatest/Shorts are 'use client' components
  // that fetch data after mount. Fetching videos during SSR caused 12s timeouts.
  const [articlesRes, heroSettings, categories] = await Promise.all([
    getPublicArticles({ limit: 60, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getHeroSettings().catch(() => null),
    getPublicCategories({ showInHome: true }).catch(() => []),
  ]);

  const articles = (articlesRes && Array.isArray(articlesRes.articles)) ? articlesRes.articles : [];

  return (
    <div>
      {/* Main 3-column portal layout containing all active sections */}
      <HeroSection
        initialArticles={articles}
        initialVideos={[]}
        initialHeroSettings={heroSettings}
        initialCategories={Array.isArray(categories) ? categories : []}
      />
    </div>
  );
}
