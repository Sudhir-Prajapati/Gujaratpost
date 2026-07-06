import { NextRequest } from "next/server";
import { ArticleService } from "@/server/services/article.service";
import { AuditService } from "@/server/audit/audit.service";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { prisma } from "@/server/database/prisma";
import { ArticleStatus } from "@prisma/client";

// Get paginated/searchable articles for admin panel
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
    const statusParam = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const userId = req.headers.get("x-user-id") || undefined;
    const userRole = req.headers.get("x-user-role") || undefined;

    let finalAuthorId = authorId;

    if (userRole === "REPORTER" && userId) {
      const userObj = await prisma.user.findUnique({
        where: { id: userId },
        select: { authorId: true }
      });
      if (userObj?.authorId) {
        finalAuthorId = userObj.authorId;
      } else {
        finalAuthorId = "none"; // if not linked, they shouldn't view anything
      }
    }

    const status = statusParam as ArticleStatus | undefined;

    const result = await ArticleService.searchArticles({
      query,
      categorySlug,
      authorId: finalAuthorId,
      page,
      limit,
      status,
    });

    return ApiSuccess(result, "Articles fetched successfully");
  } catch (err) {
    return ApiError(err);
  }
}

// Create a new article
export async function POST(req: NextRequest) {
  try {
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
      readingTime = 3,
      isTrending = false,
      isBreaking = false,
      isFeatured = false,
      isPublished = false,
      priority = 0,
      status = "DRAFT",
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      metaRobots,
      tags = [], // array of objects, e.g. [{ name: "Breaking News", nameGu: "...", nameHi: "..." }]
    } = body;

    let finalAuthorId = authorId;
    let finalStatus = status;
    let finalIsPublished = isPublished;

    if (userRole === "REPORTER" && userId) {
      const userObj = await prisma.user.findUnique({
        where: { id: userId },
        select: { authorId: true }
      });
      if (!userObj?.authorId) {
        throw new Error("Your account is not linked to an Author profile. Cannot create articles.");
      }
      finalAuthorId = userObj.authorId;
      finalStatus = "DRAFT";
      finalIsPublished = false;
    }

    // Create Tag connections: find or create each tag dynamically
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

    const article = await prisma.article.create({
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
        category: { connect: { id: categoryId } },
        author: { connect: { id: finalAuthorId } },
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
        createdByUser: userId ? { connect: { id: userId } } : undefined,
        publishedByUser: finalStatus === "PUBLISHED" && userId ? { connect: { id: userId } } : undefined,
        tags: {
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
    await AuditService.logEvent("ARTICLE_CREATED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Article",
      entityId: article.id,
    });

    return ApiSuccess(article, "Article created successfully");
  } catch (err: any) {
    try {
      require("fs").appendFileSync(
        require("path").join(process.cwd(), "public", "debug_error.log"),
        `[${new Date().toISOString()}] POST Article Error:\n${err?.stack || err}\n\n`
      );
    } catch {}
    return ApiError(err);
  }
}

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
