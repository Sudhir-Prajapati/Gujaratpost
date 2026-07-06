import { PrismaClient } from "@prisma/client";
import { DATABASE_CONFIG } from "@/server/config/database";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: DATABASE_CONFIG.logLevels as unknown as ("query" | "error" | "warn" | "info")[],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
