import { NextRequest } from "next/server";
import { prisma } from "@/server/database/prisma";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { AuditService } from "@/server/audit/audit.service";
import { NotFoundError } from "@/server/utils/errors";

// Update category details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Category");

    const {
      name,
      nameGu,
      nameHi,
      slug,
      icon,
      color,
      displayOrder,
      isActive,
    } = body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        nameGu,
        nameHi,
        slug,
        icon,
        color,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        isActive,
      },
    });

    // Write audit log
    await AuditService.logEvent("USER_UPDATED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Category",
      entityId: id,
    });

    return ApiSuccess(updated, "Category updated successfully");
  } catch (err) {
    return ApiError(err);
  }
}

// Soft-delete category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Category");

    const deleted = await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Write audit log
    await AuditService.logEvent("USER_DELETED", {
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Category",
      entityId: id,
    });

    return ApiSuccess(null, "Category deleted successfully");
  } catch (err) {
    return ApiError(err);
  }
}
