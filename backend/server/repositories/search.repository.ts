import { prisma } from "@/server/database/prisma";
import { Prisma } from "@prisma/client";

const defaultInclude = {
  author: true,
  category: true,
  tags: true,
};

export const SearchRepository = {
  async search(params: {
    query?: string;
    categorySlug?: string;
    tagSlug?: string;
    authorId?: string;
    page?: number;
    limit?: number;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
  }) {
    const {
      query,
      categorySlug,
      tagSlug,
      authorId,
      page = 1,
      limit = 10,
      status,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
      if (status === "PUBLISHED") {
        where.isPublished = true;
      }
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (tagSlug) {
      where.tags = {
        some: {
          slug: tagSlug,
        },
      };
    }

    if (query) {
      const searchTerms = query.trim().split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        where.AND = searchTerms.map((term) => ({
          OR: [
            { title: { contains: term } },
            { titleGu: { contains: term } },
            { titleHi: { contains: term } },
            { excerpt: { contains: term } },
            { excerptGu: { contains: term } },
            { excerptHi: { contains: term } },
            { content: { contains: term } },
            { contentGu: { contains: term } },
            { contentHi: { contains: term } },
            { author: { name: { contains: term } } },
            { author: { nameGu: { contains: term } } },
            { author: { nameHi: { contains: term } } },
          ],
        }));
      }
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: [
          { isBreaking: "desc" },
          { publishedAt: "desc" },
        ],
        skip,
        take: limit,
        include: defaultInclude,
      }),
      prisma.article.count({ where }),
    ]);

    return {
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
