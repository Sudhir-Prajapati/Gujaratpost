import { NextRequest } from "next/server";
import { requireAuth } from "./auth";
import { ForbiddenError } from "@/server/utils/errors";
import { isRoleAtLeast } from "@/server/auth/permissions";
import type { Role } from "@/server/constants/roles";
import type { TokenPayload } from "@/server/types/auth";

/**
 * Ensures the authenticated user has at least the minimum required role.
 * Usage: const user = await requireRole(req, "EDITOR");
 */
export async function requireRole(
  req: NextRequest,
  minimumRole: Role
): Promise<TokenPayload> {
  const payload = await requireAuth(req);

  if (!isRoleAtLeast(payload.role as Role, minimumRole)) {
    throw new ForbiddenError(
      `This action requires at least the ${minimumRole} role`
    );
  }

  return payload;
}
