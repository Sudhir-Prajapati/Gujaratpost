import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/server/auth/jwt";
import { UnauthorizedError } from "@/server/utils/errors";
import type { TokenPayload } from "@/server/types/auth";

/**
 * Verify the JWT access token from the request cookie.
 * Returns the decoded payload or throws UnauthorizedError.
 */
export async function requireAuth(req: NextRequest): Promise<TokenPayload> {
  const token = req.cookies.get("access_token")?.value;
  if (!token) throw new UnauthorizedError("Authentication token missing");

  const payload = await verifyAccessToken(token);
  if (!payload) throw new UnauthorizedError("Invalid or expired token");

  return payload;
}
