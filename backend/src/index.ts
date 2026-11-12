import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import type { Server } from 'http';
import { connectRedis, redisClient } from './config/redis.js';
import { prisma } from './config/prisma.js';
import masterRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { autoPublishDueArticles } from './controllers/article.controller.js';
import { RssController } from './controllers/rss.controller.js';
import { fetchFreshLiveCenterData } from './routes/public.routes.js';
import { ensureHeroSettingsTableColumns } from './controllers/hero.controller.js';
import { ensureCategoryTableColumns } from './controllers/category.controller.js';



// Extend globalThis so TypeScript knows about our stored HTTP server reference
declare global {
  // eslint-disable-next-line no-var
  var __httpServer: Server | undefined;
}

/**
 * On Windows: kill any stale process currently holding the given port.
 * Safely ignores the current process and its parent process (e.g. nodemon).
 */
function killPortIfBusy(port: number): void {
  if (process.platform !== 'win32') return;
  try {
    const result = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (result) {
      const lines = result.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pidStr = parts[parts.length - 1];
        const pid = parseInt(pidStr, 10);
        if (!isNaN(pid) && pid > 0 && pid !== process.pid && pid !== process.ppid) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`🔧 Cleared stale process (PID ${pid}) from port ${port}.`);
          } catch {
            // Process might have already exited
          }
        }
      }
    }
  } catch {
    // Port is free — nothing to kill, ignore error
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
// Reload trigger: Redis caches cleared and server restarted at 2026-09-17T13:41:00Z


// Trust proxy header configuration (crucial for accurate IP rate limiting downstream)
app.set('trust proxy', true);

// Enable HTTP payload compression (Brotli/Gzip) according to Performance Standard Section 14
app.use(compression());

// Configure CORS to permit Next.js frontend calls & mobile apps with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, PWABuilder, native APKs)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files statically with correct MIME types (PDF, images) and CORS headers
const express_static = express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jfif')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    }
  },
});

app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  express_static(req, res, () => {
    // If not found at requested path, check fallback subdirectories (news vs gallery vs root)
    const baseFile = path.basename(req.path);
    if (baseFile && baseFile.length > 3) {
      const newsPath = path.join(process.cwd(), 'uploads', 'news', baseFile);
      if (fs.existsSync(newsPath)) {
        return res.sendFile(newsPath);
      }
      const galleryPath = path.join(process.cwd(), 'uploads', 'gallery', baseFile);
      if (fs.existsSync(galleryPath)) {
        return res.sendFile(galleryPath);
      }
      const rootPath = path.join(process.cwd(), 'uploads', baseFile);
      if (fs.existsSync(rootPath)) {
        return res.sendFile(rootPath);
      }
    }
    return res.status(404).send('Not Found');
  });
});

// Root endpoint status check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Gujarat Post Backend API is running successfully',
    endpoints: {
      health: '/api/health',
      publicArticles: '/api/public/articles',
    },
  });
});

// Legacy PHP RSS routes and direct public RSS feeds on root domain
app.get('/rss-feed-politics.php', RssController.getLegacyPoliticsRss);
app.get('/rss-feed-gallery.php', RssController.getLegacyGalleryRss);
app.get('/rss-feed-gallery', RssController.getLegacyGalleryRss);
app.get('/gallery-updates-gallery.xml', RssController.getLegacyGalleryRss);
app.get('/gallery-updates-gallery', RssController.getLegacyGalleryRss);
app.get('/gallery.xml', RssController.getLegacyGalleryRss);
app.get('/photos.xml', RssController.getLegacyGalleryRss);
app.get('/rss.xml', RssController.getPublicRss);
app.get('/rss/:category.xml', RssController.getPublicRss);
app.get('/rss/:category', RssController.getPublicRss);

// Mount all API routes under the /api prefix
app.use('/api', masterRouter);


// Centralized error handler middleware (must be defined last)
app.use(errorHandler);

// Boot the server and establish database connections
const bootstrap = async () => {
  try {
    // 1. Kill any stale process on the port (Windows dev only)
    killPortIfBusy(Number(PORT));

    // 2. Bind HTTP server IMMEDIATELY on 0.0.0.0:PORT
    const listenWithRetry = (portNum: number, attempts = 0) => {
      const server = app.listen(portNum, '0.0.0.0', () => {
        console.log(`🚀 Gujarat Post backend running on http://0.0.0.0:${portNum}`);
      });

      // Store server reference globally so graceful shutdown can close it
      globalThis.__httpServer = server;

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`\n⚠️  Port ${portNum} is currently in use.`);
          if (attempts < 5) {
            const delay = 2000 + attempts * 1000; // 2s, 3s, 4s, 5s, 6s
            console.log(`   Retrying in ${delay / 1000}s... (Attempt ${attempts + 1}/5)`);
            setTimeout(() => {
              killPortIfBusy(portNum); // try to clear port before each retry
              listenWithRetry(portNum, attempts + 1);
            }, delay);
          } else {
            console.error(`   Could not bind to port ${portNum} after multiple retries.`);
            process.exit(1);
          }
        } else {
          console.error('Server listen error:', err);
        }
      });
    };

    listenWithRetry(Number(PORT));

    // 3. Establish Redis connection in background (non-blocking)
    connectRedis()
      .then(() => {
        if (redisClient.isOpen) {
          console.log('Successfully connected to Redis database.');
        } else {
          console.warn('Redis is offline. Operating in database-only fallback mode.');
        }
      })
      .catch((err) => {
        console.warn('Redis connection notice (running without cache):', err?.message || err);
      });

    // 4. Validate Prisma connection to MySQL in background (non-blocking with retry)
    const connectPrismaWithRetry = async (attempt = 1, maxAttempts = 10) => {
      try {
        await prisma.$connect();
        console.log('Successfully connected to MySQL database via Prisma.');
        ensureHeroSettingsTableColumns().catch(() => {});
        ensureCategoryTableColumns().catch(() => {});
      } catch (dbErr: any) {
        if (attempt < maxAttempts) {
          setTimeout(() => connectPrismaWithRetry(attempt + 1, maxAttempts), 1500);
        } else {
          console.warn('MySQL connection warning after retries:', dbErr?.message || dbErr);
        }
      }
    };
    connectPrismaWithRetry();
  } catch (error) {
    console.error('Bootstrap warning:', error);
    // Start listening anyway so backend stays online
    const fallbackServer = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Gujarat Post backend running on http://0.0.0.0:${PORT}`);
    });
    globalThis.__httpServer = fallbackServer;
  }
};

bootstrap();

// ── Background: auto-publish scheduled articles every 5 minutes ──────────────
// This is the canonical location for this job. The inline call on the articles
// read-path (public.routes.ts) has been removed in Phase 1 so that DB writes
// never block read requests.
setInterval(async () => {
  try {
    await autoPublishDueArticles();
  } catch (err: any) {
    console.warn('Background autoPublish error (non-fatal):', err?.message || err);
  }
}, 5 * 60 * 1000); // every 5 minutes
// Run once immediately on startup so newly-due scheduled articles are published
// as soon as the server boots (without waiting for the first 5-minute tick).
autoPublishDueArticles().catch((err: any) => {
  console.warn('Startup autoPublish error (non-fatal):', err?.message || err);
});




// ── Background: Live Center external API refresh every 30 minutes ────────────
// Persists live data to MySQL hero_settings without exceeding daily rate limits (100 req/day).
setInterval(async () => {
  try {
    await fetchFreshLiveCenterData();
  } catch (err: any) {
    console.warn('Background liveCenter error (non-fatal):', err?.message || err);
  }
}, 30 * 60 * 1000); // every 30 minutes

// Run once 10 seconds after boot so initial DB snapshot is updated with live data
setTimeout(() => {
  fetchFreshLiveCenterData().catch((err: any) => {
    console.warn('Startup liveCenter error (non-fatal):', err?.message || err);
  });
}, 10000);

// Graceful shutdown handling — MUST close HTTP server first to release the port
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  try {
    // 1. Close HTTP server first so the port is released immediately
    const server = (globalThis as any).__httpServer;
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      console.log('HTTP server closed.');
    }

    // 2. Disconnect Prisma Client
    await prisma.$disconnect();
    console.log('MySQL connection closed.');

    // 3. Disconnect Redis Client
    if (redisClient.isOpen) {
      await redisClient.disconnect();
      console.log('Redis connection closed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => {
  gracefulShutdown('SIGUSR2');
});

// Prevent transient network glitches or socket drops from crashing the Node.js server
process.on('unhandledRejection', (reason: any) => {
  console.warn('⚠️  Captured unhandled rejection (server continues safely):', reason?.message || reason);
});

process.on('uncaughtException', (err: any) => {
  console.error('⚠️  Captured uncaught exception (server continues safely):', err?.message || err);
});
