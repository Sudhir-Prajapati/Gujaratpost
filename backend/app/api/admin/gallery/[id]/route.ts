import { NextRequest } from "next/server";
import { prisma } from "@/server/database/prisma";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { AuditService } from "@/server/audit/audit.service";
import { NotFoundError } from "@/server/utils/errors";

// Update a gallery photo details (rename / description)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const existing = await prisma.photo.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Photo");

    const {
      src,
      alt,
      caption,
      captionGu,
      captionHi,
      category,
      photographer,
      copyright,
    } = body;

    const updated = await prisma.photo.update({
      where: { id },
      data: {
        src,
        alt,
        caption,
        captionGu,
        captionHi,
        category,
        photographer,
        copyright,
      },
    });

    // Write audit log
    await AuditService.logEvent("GALLERY_UPDATED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Photo",
      entityId: id,
    });

    return ApiSuccess(updated, "Photo details updated successfully");
  } catch (err) {
    return ApiError(err);
  }
}

// Soft-delete a gallery photo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const existing = await prisma.photo.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Photo");

    const deleted = await prisma.photo.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Write audit log
    await AuditService.logEvent("GALLERY_DELETED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Photo",
      entityId: id,
    });

    return ApiSuccess(null, "Photo deleted successfully from gallery");
  } catch (err) {
    return ApiError(err);
  }
}
