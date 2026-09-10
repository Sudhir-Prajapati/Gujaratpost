import HeroSection from "@/components/sections/HeroSection";
import { getPublicArticles, getHeroSettings, getPublicCategories, getPublicVideos } from "@/lib/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [articlesRes, heroSettings, categories, videosRes] = await Promise.all([
    getPublicArticles({ limit: 60, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getHeroSettings().catch(() => null),
    getPublicCategories({ showInHome: true }).catch(() => []),
    getPublicVideos('video').catch(() => []),
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
      />
    </div>
  );
}
