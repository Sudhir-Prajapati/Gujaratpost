import { prisma } from "@/server/database/prisma";
import { Prisma } from "@prisma/client";

const defaultInclude = {
  author: true,
  category: true,
  tags: true,
};

export const ArticleRepository = {
  async findById(id: string) {
    return prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: defaultInclude,
    });
  },

  async findBySlug(slug: string) {
    return prisma.article.findFirst({
      where: { slug, deletedAt: null },
      include: defaultInclude,
    });
  },

  async findLatest(limit: number = 10) {
    return prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
        deletedAt: null,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: limit,
      include: defaultInclude,
    });
  },

  async findTrending(limit: number = 10) {
    return prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
        isTrending: true,
        deletedAt: null,
      },
      orderBy: [
        { priority: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
      include: defaultInclude,
    });
  },

  async findFeatured(limit: number = 24) {
    return prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
        isFeatured: true,
        deletedAt: null,
      },
      orderBy: [
        { priority: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
      include: defaultInclude,
    });
  },

  async findRelated(articleId: string, categoryId: string, limit: number = 4) {
    return prisma.article.findMany({
      where: {
        categoryId,
        id: { not: articleId },
        status: "PUBLISHED",
        isPublished: true,
        deletedAt: null,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: limit,
      include: defaultInclude,
    });
  },

  async incrementViews(id: string) {
    return prisma.article.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  },

  async create(data: Prisma.ArticleCreateInput) {
    return prisma.article.create({
      data,
      include: defaultInclude,
    });
  },

  async update(id: string, data: Prisma.ArticleUpdateInput) {
    return prisma.article.update({
      where: { id },
      data,
      include: defaultInclude,
    });
  },

  async softDelete(id: string) {
    return prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
