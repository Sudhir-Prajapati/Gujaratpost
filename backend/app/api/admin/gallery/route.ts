import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/database/prisma";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { AuditService } from "@/server/audit/audit.service";

// List gallery photos for admin panel
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query) {
      where.OR = [
        { alt: { contains: query } },
        { caption: { contains: query } },
        { captionGu: { contains: query } },
        { captionHi: { contains: query } },
        { photographer: { contains: query } },
      ];
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where }),
    ]);

    return ApiSuccess({
      photos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, "Gallery photos fetched successfully");
  } catch (err) {
    return ApiError(err);
  }
}

// Add a new photo to the gallery
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const {
      src,
      alt,
      caption,
      captionGu,
      captionHi,
      category = "",
      photographer = "",
      copyright = "",
    } = body;

    if (!src) {
      throw new Error("Image source URL is required");
    }

    const photo = await prisma.photo.create({
      data: {
        src,
        alt: alt || "Gallery Image",
        caption: caption || "",
        captionGu: captionGu || caption || "",
        captionHi: captionHi || caption || "",
        category,
        photographer,
        copyright,
      },
    });

    // Write audit log
    await AuditService.logEvent("GALLERY_UPLOAD", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Photo",
      entityId: photo.id,
    });

    return ApiSuccess(photo, "Photo added to gallery successfully");
  } catch (err) {
    return ApiError(err);
  }
}
