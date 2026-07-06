import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/database/prisma";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { AuditService } from "@/server/audit/audit.service";

// List videos for admin panel
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const type = searchParams.get("type") || ""; // video | short | podcast | interview
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { titleGu: { contains: query } },
        { titleHi: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.video.count({ where }),
    ]);

    return ApiSuccess({
      videos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, "Videos fetched successfully");
  } catch (err) {
    return ApiError(err);
  }
}

// Add a new video to the platform
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const {
      title,
      titleGu,
      titleHi,
      youtubeId,
      type = "video", // video | short | podcast | interview
      description = "",
      duration = "0:00",
      isFeatured = false,
      channel = "Gujarat Post News",
    } = body;

    if (!title || !youtubeId) {
      throw new Error("Title and YouTube Video ID are required");
    }

    // Auto-generate thumbnail and embedUrl
    const thumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;

    const video = await prisma.video.create({
      data: {
        title,
        titleGu: titleGu || title,
        titleHi: titleHi || title,
        youtubeId,
        type,
        description,
        thumbnail,
        embedUrl,
        duration,
        isFeatured,
        channel,
      },
    });

    // Write audit log
    await AuditService.logEvent("VIDEO_CREATED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Video",
      entityId: video.id,
    });

    return ApiSuccess(video, "Video created successfully");
  } catch (err) {
    return ApiError(err);
  }
}
