import { NextRequest } from "next/server";
import { requireAuth } from "./auth";
import { ForbiddenError } from "@/server/utils/errors";
import { hasPermission } from "@/server/auth/permissions";
import type { Permission } from "@/server/constants/permissions";
import type { Role } from "@/server/constants/roles";
import type { TokenPayload } from "@/server/types/auth";

/**
 * Ensures the authenticated user holds a specific permission.
 * Usage: const user = await requirePermission(req, "articles:publish");
 */
export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<TokenPayload> {
  const payload = await requireAuth(req);

  if (!hasPermission(payload.role as Role, permission)) {
    throw new ForbiddenError(
      `You do not have the '${permission}' permission`
    );
  }

  return payload;
}
