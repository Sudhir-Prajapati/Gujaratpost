import { ArticleRepository } from "@/server/repositories/article.repository";
import { SearchRepository } from "@/server/repositories/search.repository";
import { NotFoundError } from "@/server/utils/errors";

export const ArticleService = {
  async getArticleById(id: string) {
    const article = await ArticleRepository.findById(id);
    if (!article) throw new NotFoundError("Article");
    return article;
  },

  async getArticleBySlug(slug: string) {
    const article = await ArticleRepository.findBySlug(slug);
    if (!article) throw new NotFoundError("Article");
    return article;
  },

  async incrementViews(id: string) {
    return ArticleRepository.incrementViews(id);
  },

  async getLatestArticles(limit: number = 10) {
    return ArticleRepository.findLatest(limit);
  },

  async getTrendingArticles(limit: number = 10) {
    return ArticleRepository.findTrending(limit);
  },

  async getFeaturedArticles(limit: number = 24) {
    return ArticleRepository.findFeatured(limit);
  },

  async getRelatedArticles(articleId: string, categoryId: string, limit: number = 4) {
    return ArticleRepository.findRelated(articleId, categoryId, limit);
  },

  async searchArticles(params: {
    query?: string;
    categorySlug?: string;
    tagSlug?: string;
    authorId?: string;
    page?: number;
    limit?: number;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
  }) {
    return SearchRepository.search(params);
  },
};
