import { prisma } from "@/server/database/prisma";
import type { Role } from "@/server/constants/roles";

// ---------------------------------------------------------------------------
// User Repository — only Prisma, no business logic
// ---------------------------------------------------------------------------

export const UserRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: {
    email: string;
    passwordHash: string;
    role?: Role;
    status?: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: (data.role ?? "REPORTER") as Role,
        status: (data.status ?? "ACTIVE") as "ACTIVE",
      },
    });
  },

  update(id: string, data: Partial<{ passwordHash: string; status: "ACTIVE" | "SUSPENDED" | "DELETED" | "PENDING_VERIFICATION"; role: Role }>) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: "DELETED" },
    });
  },

  list(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    return Promise.all([
      prisma.user.findMany({ skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.user.count(),
    ]);
  },

  listWithSessionsAndAuthors(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    return Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
          sessions: {
            where: {
              expiresAt: { gt: new Date() },
              revokedAt: null,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);
  },

  findByIdWithAuthor(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { author: true },
    });
  },
};

