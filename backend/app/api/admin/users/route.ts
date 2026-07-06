import { NextRequest } from "next/server";
import { requireRole } from "@/server/middleware/role";
import { UserRepository } from "@/server/repositories/user.repository";
import { UserManagementService } from "@/server/services/user-management.service";
import { CreateUserSchema } from "@/server/validators/user.validator";
import { AuditService } from "@/server/audit/audit.service";
import { ApiSuccess, ApiError, ApiPaginated } from "@/server/utils/response";
import { ValidationError } from "@/server/utils/errors";

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize - only SUPER_ADMIN can manage users
    await requireRole(req, "SUPER_ADMIN");

    // 2. Parse pagination query
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // 3. Fetch list
    const [users, total] = await UserRepository.listWithSessionsAndAuthors(page, limit);

    // 4. Format
    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      author: u.author,
      sessionCount: u.sessions.length,
    }));

    return ApiPaginated(formatted, total, page, limit);
  } catch (err) {
    return ApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize
    const operator = await requireRole(req, "SUPER_ADMIN");

    // 2. Parse body & validate
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.format());
    }

    // 3. Create user and author profile transactionally
    const user = await UserManagementService.createUser(parsed.data);

    // 4. Audit
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    await AuditService.logEvent("USER_CREATED", {
      userId: operator.userId,
      ipAddress,
      userAgent: req.headers.get("user-agent") || undefined,
      entity: "User",
      entityId: user.id,
    });

    // 5. Respond
    return ApiSuccess(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        author: user.author,
      },
      "User account and profile created successfully",
      201
    );
  } catch (err) {
    return ApiError(err);
  }
}
