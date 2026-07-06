import { NextRequest, NextResponse } from "next/server";
import { ArticleService } from "@/server/services/article.service";
import { SearchRepository } from "@/server/repositories/search.repository";
import { ApiError } from "@/server/utils/response";

// Public API: no authentication required
// Returns published articles for the public website homepage sections

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // featured | trending | latest | category
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const query = searchParams.get("query") || undefined;

    let articles: any[] = [];
    let total = 0;
    let totalPages = 1;

    if (type === "featured") {
      articles = await ArticleService.getFeaturedArticles(limit);
    } else if (type === "trending") {
      articles = await ArticleService.getTrendingArticles(limit);
    } else if (type === "latest") {
      articles = await ArticleService.getLatestArticles(limit);
    } else if (type === "category" && categorySlug) {
      const result = await SearchRepository.search({
        categorySlug,
        status: "PUBLISHED",
        page,
        limit,
        query,
      });
      articles = result.articles;
      total = result.total;
      totalPages = result.totalPages;
    } else {
      // Default: latest published
      articles = await ArticleService.getLatestArticles(limit);
    }

    // Normalize article shape for frontend consumption
    const normalized = articles.map((art: any) => ({
      id: art.id,
      slug: art.slug,
      title: art.title,
      titleGu: art.titleGu,
      titleHi: art.titleHi,
      excerpt: art.excerpt,
      excerptGu: art.excerptGu,
      excerptHi: art.excerptHi,
      image: art.featuredImage || art.thumbnail || "",
      category: art.category?.name || "",
      categorySlug: art.category?.slug || "",
      categoryGu: art.category?.nameGu || "",
      categoryHi: art.category?.nameHi || "",
      tags: art.tags?.map((t: any) => t.name) || [],
      tagsGu: art.tags?.map((t: any) => t.nameGu || t.name) || [],
      tagsHi: art.tags?.map((t: any) => t.nameHi || t.name) || [],
      author: {
        id: art.author?.id || "",
        name: art.author?.name || "",
        nameGu: art.author?.nameGu || art.author?.name || "",
        nameHi: art.author?.nameHi || art.author?.name || "",
        image: art.author?.image || "",
        designation: art.author?.designation || "",
        designationGu: art.author?.designationGu || art.author?.designation || "",
        designationHi: art.author?.designationHi || art.author?.designation || "",
        bio: art.author?.bio || "",
        bioGu: art.author?.bioGu || art.author?.bio || "",
        bioHi: art.author?.bioHi || art.author?.bio || "",
      },
      publishedAt: art.publishedAt?.toISOString?.() || art.publishedAt || new Date().toISOString(),
      updatedAt: art.updatedAt?.toISOString?.() || art.updatedAt || new Date().toISOString(),
      readingTime: art.readingTime || 3,
      isTrending: art.isTrending || false,
      isBreaking: art.isBreaking || false,
      isFeatured: art.isFeatured || false,
      views: art.views || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        articles: normalized,
        total: total || normalized.length,
        totalPages,
        page,
      },
    });
  } catch (err) {
    return ApiError(err);
  }
}
