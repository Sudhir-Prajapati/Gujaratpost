import { NextRequest, NextResponse } from "next/server";
import { ArticleService } from "@/server/services/article.service";
import { ArticleRepository } from "@/server/repositories/article.repository";
import { AuditService } from "@/server/audit/audit.service";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { prisma } from "@/server/database/prisma";
import { NotFoundError, ForbiddenError } from "@/server/utils/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await ArticleService.getArticleById(id);
    return ApiSuccess(article, "Article retrieved successfully");
  } catch (err) {
    return ApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;
    const userRole = req.headers.get("x-user-role") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const {
      slug,
      title,
      titleGu,
      titleHi,
      excerpt,
      excerptGu,
      excerptHi,
      content,
      contentGu,
      contentHi,
      featuredImage,
      thumbnail,
      categoryId,
      authorId,
      readingTime,
      isTrending,
      isBreaking,
      isFeatured,
      isPublished,
      priority,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      metaRobots,
      tags = [],
    } = body;

    // Check if article exists
    const existing = await prisma.article.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundError("Article");

    let finalAuthorId = authorId;
    let finalStatus = status;
    let finalIsPublished = isPublished;

    if (userRole === "REPORTER" && userId) {
      const userObj = await prisma.user.findUnique({
        where: { id: userId },
        select: { authorId: true }
      });
      if (!userObj?.authorId) {
        throw new ForbiddenError("Your account is not linked to an Author profile. Cannot edit articles.");
      }

      // 1. Verify reporter owns this article
      if (existing.authorId !== userObj.authorId) {
        throw new ForbiddenError("Forbidden: You can only edit your own articles");
      }

      // 2. Prevent changing author to someone else
      finalAuthorId = userObj.authorId;

      // 3. Prevent publishing
      finalStatus = "DRAFT";
      finalIsPublished = false;
    }

    // Process Tags: find or create each tag dynamically
    const tagConnectOrCreate = [];
    for (const tag of tags) {
      const tagSlug = slugify(tag.name);
      tagConnectOrCreate.push({
        where: { slug: tagSlug },
        create: {
          slug: tagSlug,
          name: tag.name,
          nameGu: tag.nameGu || tag.name,
          nameHi: tag.nameHi || tag.name,
        },
      });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        slug,
        title,
        titleGu,
        titleHi,
        excerpt,
        excerptGu,
        excerptHi,
        content,
        contentGu,
        contentHi,
        featuredImage,
        thumbnail,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        author: finalAuthorId ? { connect: { id: finalAuthorId } } : undefined,
        readingTime,
        isTrending,
        isBreaking,
        isFeatured,
        isPublished: finalIsPublished,
        priority,
        status: finalStatus,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        metaRobots,
        updatedByUser: userId ? { connect: { id: userId } } : undefined,
        publishedByUser: finalStatus === "PUBLISHED" && existing.status !== "PUBLISHED" && userId ? { connect: { id: userId } } : undefined,
        tags: {
          set: [], // Resets tags mapping
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });

    // Write audit log
    const auditAction = finalStatus === "PUBLISHED" && existing.status !== "PUBLISHED" ? "ARTICLE_PUBLISHED" : "ARTICLE_CREATED";
    await AuditService.logEvent(auditAction as any, {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Article",
      entityId: updated.id,
    });

    return ApiSuccess(updated, "Article updated successfully");
  } catch (err: any) {
    try {
      require("fs").appendFileSync(
        require("path").join(process.cwd(), "public", "debug_error.log"),
        `[${new Date().toISOString()}] PUT Article Error:\n${err?.stack || err}\n\n`
      );
    } catch {}
    return ApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id") || undefined;
    const userRole = req.headers.get("x-user-role") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (userRole === "REPORTER") {
      throw new ForbiddenError("Reporters are not allowed to delete articles");
    }

    const article = await prisma.article.findUnique({
      where: { id },
    });
    if (!article) throw new NotFoundError("Article");

    // Soft delete article
    await ArticleRepository.softDelete(id);

    // Write audit log
    await AuditService.logEvent("ARTICLE_DELETED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Article",
      entityId: id,
    });

    return ApiSuccess(null, "Article soft-deleted successfully");
  } catch (err) {
    return ApiError(err);
  }
}

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
