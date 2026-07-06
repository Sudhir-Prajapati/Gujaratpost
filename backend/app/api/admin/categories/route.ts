import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/database/prisma";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { AuditService } from "@/server/audit/audit.service";

// Get all categories (both active and inactive, but not deleted) for admin panel
export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { displayOrder: "asc" },
    });
    return ApiSuccess(categories, "Categories fetched successfully");
  } catch (err) {
    return ApiError(err);
  }
}

// Create a new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const {
      name,
      nameGu,
      nameHi,
      slug,
      icon = "",
      color = "#000000",
      displayOrder = 0,
      isActive = true,
    } = body;

    if (!name || !slug) {
      throw new Error("Category Name and Slug are required");
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameGu: nameGu || name,
        nameHi: nameHi || name,
        slug,
        icon,
        color,
        displayOrder: Number(displayOrder),
        isActive,
      },
    });

    // Write audit log
    await AuditService.logEvent("USER_UPDATED", { // Use a valid AuditAction since Category events aren't in schema, or map appropriately
      userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "Category",
      entityId: category.id,
    });

    return ApiSuccess(category, "Category created successfully");
  } catch (err) {
    return ApiError(err);
  }
}
