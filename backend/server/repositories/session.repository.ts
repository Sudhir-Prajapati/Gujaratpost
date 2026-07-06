import { prisma } from "@/server/database/prisma";
import { AUTH_CONFIG } from "@/server/config/auth";

// ---------------------------------------------------------------------------
// Session Repository — only Prisma, no business logic
// ---------------------------------------------------------------------------

export const SessionRepository = {
  create(data: {
    userId: string;
    tokenHash: string;
    deviceName?: string;
    browser?: string;
    ipAddress?: string;
    country?: string;
  }) {
    const expiresAt = new Date(
      Date.now() +
        AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );
    return prisma.session.create({
      data: { ...data, expiresAt },
    });
  },

  findByHash(tokenHash: string) {
    return prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  deleteById(id: string) {
    return prisma.session.delete({ where: { id } }).catch(() => null);
  },

  deleteAllForUser(userId: string) {
    return prisma.session.deleteMany({ where: { userId } });
  },

  listForUser(userId: string) {
    return prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastUsedAt: "desc" },
    });
  },

  updateLastUsed(id: string) {
    return prisma.session.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  },
};
