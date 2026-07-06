import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/database/prisma";
import { ApiSuccess, ApiError } from "@/server/utils/response";

export async function GET(req: NextRequest) {
  try {
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      pendingReviewCount,
      viewsAggregate,
      authorsCount,
      categoriesCount,
      galleryCount,
      videosCount,
      activeSessionsCount,
      recentLogs,
      recentDrafts,
      pendingReporterArticles,
      recentlyPublished,
      trendingArticles,
    ] = await Promise.all([
      prisma.article.count({ where: { deletedAt: null } }),
      prisma.article.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.article.count({ where: { status: "DRAFT", deletedAt: null } }),
      prisma.article.count({
        where: {
          status: "DRAFT",
          author: {
            user: {
              role: "REPORTER",
            },
          },
          deletedAt: null,
        },
      }),
      prisma.article.aggregate({
        where: { deletedAt: null },
        _sum: {
          views: true,
        },
      }),
      prisma.author.count({ where: { deletedAt: null } }),
      prisma.category.count({ where: { deletedAt: null } }),
      prisma.photo.count({ where: { deletedAt: null } }),
      prisma.video.count({ where: { deletedAt: null } }),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.article.findMany({
        where: { status: "DRAFT", deletedAt: null },
        include: { author: true, category: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.article.findMany({
        where: {
          status: "DRAFT",
          author: {
            user: {
              role: "REPORTER",
            },
          },
          deletedAt: null,
        },
        include: { author: true, category: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        include: { author: true, category: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
      }),
      prisma.article.findMany({
        where: { isTrending: true, deletedAt: null },
        include: { author: true, category: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
      }),
    ]);

    const stats = {
      articles: {
        total: totalArticles,
        published: publishedArticles,
        draft: draftArticles,
        pendingReview: pendingReviewCount,
      },
      views: viewsAggregate._sum.views ?? 0,
      authors: authorsCount,
      categories: categoriesCount,
      galleryImages: galleryCount,
      videos: videosCount,
      activeSessions: activeSessionsCount,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
        userEmail: log.user?.email ?? "System",
        userRole: log.user?.role ?? "N/A",
      })),
      recentDrafts,
      pendingReporterArticles,
      recentlyPublished,
      trendingArticles,
    };

    return ApiSuccess(stats, "Stats retrieved successfully");
  } catch (err) {
    return ApiError(err);
  }
}
