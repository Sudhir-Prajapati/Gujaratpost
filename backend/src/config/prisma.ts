import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Use a singleton to avoid multiple Prisma instances during hot-reload in dev
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log(`[Config] A .env file was found on the server filesystem at: ${envPath}`);
  }

  // Priority: AIVEN_DATABASE_URL (if provided) or DATABASE_URL
  let rawUrl = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
  const dbUrl = rawUrl ? rawUrl.replace(/^["']|["']$/g, '').trim() : undefined;

  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      console.log(`[Prisma] Initializing with database host: ${parsed.hostname}:${parsed.port || 'default'}`);
      if (process.env.NODE_ENV === 'production' && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')) {
        console.error('❌ [Render Config Error] DATABASE_URL is pointing to localhost (127.0.0.1:3306) on Render!');
        console.error('👉 Make sure you clicked "Save Changes" on the Render Environment tab, or check for a Secret File named .env');
      }
    } catch {
      console.log('[Prisma] Initializing with custom DATABASE_URL.');
    }
  } else {
    console.warn('[Prisma] WARNING: DATABASE_URL environment variable is NOT set!');
  }

  return new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'minimal',
  });
}

export const prisma: PrismaClient = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Graceful shutdown — release DB connections when the process exits
process.on('beforeExit', async () => {
  await prisma.$disconnect().catch(() => {});
});
process.on('SIGINT', async () => {
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
});
