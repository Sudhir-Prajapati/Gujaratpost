import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ApiSuccess, ApiError } from "@/server/utils/response";
import { prisma } from "@/server/database/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-key-at-least-32-characters-long"
);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;

    if (!token) {
      return ApiSuccess({ authenticated: false }, "Not authenticated");
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = (payload as any).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          authorId: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!user) {
        return ApiSuccess({ authenticated: false }, "User not found");
      }

      return ApiSuccess(
        {
          authenticated: true,
          user: {
            userId: user.id,
            email: user.email,
            role: user.role,
            authorId: user.authorId,
            authorName: user.author?.name || null,
          },
        },
        "Authenticated successfully"
      );
    } catch (e) {
      return ApiSuccess({ authenticated: false }, "Invalid token");
    }
  } catch (err) {
    return ApiError(err);
  }
}
