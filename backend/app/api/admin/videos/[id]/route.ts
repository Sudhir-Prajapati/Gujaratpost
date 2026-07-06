import { NextRequest } from "next/server";
import { prisma } from "@/server/database/prisma";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { AuditService } from "@/server/audit/audit.service";
import { NotFoundError } from "@/server/utils/errors";

// Update a video details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const existing = await prisma.video.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Video");

    const {
      title,
      titleGu,
      titleHi,
      youtubeId,
      type,
      description,
      duration,
      isFeatured,
      channel,
    } = body;

    // Auto-update thumbnail & embedUrl if youtubeId is modified
    let thumbnail = existing.thumbnail;
    let embedUrl = existing.embedUrl;
    if (youtubeId && youtubeId !== existing.youtubeId) {
      thumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
      embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
    }

    const updated = await prisma.video.update({
      where: { id },
      data: {
        title,
        titleGu,
        titleHi,
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
    await AuditService.logEvent("VIDEO_UPDATED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Video",
      entityId: id,
    });

    return ApiSuccess(updated, "Video updated successfully");
  } catch (err) {
    return ApiError(err);
  }
}

// Soft-delete a video
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const existing = await prisma.video.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Video");

    const deleted = await prisma.video.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Write audit log
    await AuditService.logEvent("VIDEO_DELETED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Video",
      entityId: id,
    });

    return ApiSuccess(null, "Video deleted successfully");
  } catch (err) {
    return ApiError(err);
  }
}
