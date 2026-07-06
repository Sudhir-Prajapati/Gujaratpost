import { prisma } from "@/server/database/prisma";
import { AUTH_CONFIG } from "@/server/config/auth";
import { hashRefreshToken } from "./refresh";
import type { SessionCreateInput } from "@/server/types/auth";

/** Create a new device session and return the raw refresh token. */
export async function createSession(input: SessionCreateInput): Promise<string> {
  const { generateRefreshToken } = await import("./refresh");
  const rawToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(
    Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash,
      deviceName: input.deviceName,
      browser: input.browser,
      ipAddress: input.ipAddress,
      country: input.country,
      expiresAt,
    },
  });

  return rawToken;
}

/** Find a session by its raw refresh token. */
export async function findSessionByToken(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  return prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
}

/**
 * Rotate a session: atomically delete the old record and create a new one.
 * Returns the new raw refresh token.
 */
export async function rotateSession(
  oldSessionId: string,
  input: SessionCreateInput
): Promise<string> {
  const { generateRefreshToken } = await import("./refresh");
  const newRawToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRawToken);
  const expiresAt = new Date(
    Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.$transaction([
    prisma.session.delete({ where: { id: oldSessionId } }),
    prisma.session.create({
      data: {
        userId: input.userId,
        tokenHash: newTokenHash,
        deviceName: input.deviceName,
        browser: input.browser,
        ipAddress: input.ipAddress,
        country: input.country,
        expiresAt,
      },
    }),
  ]);

  return newRawToken;
}

/** Delete a session by its internal ID. */
export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
    // Ignore if already deleted
  });
}

/** Delete all sessions for a user (force-logout all devices). */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
