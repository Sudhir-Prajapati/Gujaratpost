import { NextRequest } from "next/server";
import { requireRole } from "@/server/middleware/role";
import { UserRepository } from "@/server/repositories/user.repository";
import { UserManagementService } from "@/server/services/user-management.service";
import { UpdateUserSchema } from "@/server/validators/user.validator";
import { AuditService } from "@/server/audit/audit.service";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { ValidationError, NotFoundError } from "@/server/utils/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, "SUPER_ADMIN");
    const { id } = await params;

    const user = await UserRepository.findByIdWithAuthor(id);
    if (!user) {
      throw new NotFoundError("User");
    }

    return ApiSuccess(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        author: user.author,
      },
      "User retrieved successfully"
    );
  } catch (err) {
    return ApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const operator = await requireRole(req, "SUPER_ADMIN");
    const { id } = await params;

    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.format());
    }

    const updatedUser = await UserManagementService.updateUser(id, parsed.data);

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await AuditService.logEvent("USER_UPDATED", {
      userId: operator.userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "User",
      entityId: updatedUser.id,
    });

    return ApiSuccess(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        author: updatedUser.author,
      },
      "User updated successfully"
    );
  } catch (err) {
    return ApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const operator = await requireRole(req, "SUPER_ADMIN");
    const { id } = await params;

    // Prevent self-deletion
    if (operator.userId === id) {
      throw new ValidationError("Super Admin cannot delete their own account");
    }

    const deletedUser = await UserManagementService.deleteUser(id);

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await AuditService.logEvent("USER_DELETED", {
      userId: operator.userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "User",
      entityId: id,
    });

    return ApiSuccess(
      {
        id: deletedUser.id,
        email: deletedUser.email,
        status: deletedUser.status,
      },
      "User account deactivated and linked author profile soft-deleted"
    );
  } catch (err) {
    return ApiError(err);
  }
}
