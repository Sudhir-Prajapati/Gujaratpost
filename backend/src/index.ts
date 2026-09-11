import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { execSync } from 'child_process';
import type { Server } from 'http';
import { connectRedis, redisClient } from './config/redis.js';
import { prisma } from './config/prisma.js';
import masterRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

// Extend globalThis so TypeScript knows about our stored HTTP server reference
declare global {
  // eslint-disable-next-line no-var
  var __httpServer: Server | undefined;
}

/**
 * On Windows: kill any process currently holding the given port.
 * This prevents EADDRINUSE errors when nodemon restarts the backend.
 */
function killPortIfBusy(port: number): void {
  try {
    const result = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    if (result) {
      // Last column is PID
      const pid = result.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`🔧 Cleared stale process (PID ${pid}) from port ${port}.`);
      }
    }
  } catch {
    // Port is free — nothing to kill, ignore error
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
// Reload trigger: Redis and Prisma resilience applied


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
  express_static(req, res, next);
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

// Mount all API routes under the /api prefix
app.use('/api', masterRouter);

// Centralized error handler middleware (must be defined last)
app.use(errorHandler);

// Boot the server and establish database connections
const bootstrap = async () => {
  try {
    // 1. Establish Redis connection
    await connectRedis();
    if (redisClient.isOpen) {
      console.log('Successfully connected to Redis database.');
    } else {
      console.warn('Redis is offline. Operating in database-only fallback mode.');
    }

    // 2. Validate Prisma connection to MySQL
    await prisma.$connect().catch((dbErr) => {
      console.warn('MySQL initial connection warning (will retry automatically):', dbErr?.message || dbErr);
    });
    console.log('Successfully connected to MySQL database via Prisma.');

    // 3. Kill any stale process on the port, then start listening
    killPortIfBusy(Number(PORT));

    const listenWithRetry = (portNum: number, attempts = 0) => {
      const server = app.listen(portNum, '0.0.0.0', () => {
        console.log(`🚀 Gujarat Post backend running on port http://localhost:${portNum}`);
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
  } catch (error) {
    console.error('Bootstrap warning:', error);
    // Start listening anyway so backend stays online
    const fallbackServer = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Gujarat Post backend running on port http://localhost:${PORT}`);
    });
    globalThis.__httpServer = fallbackServer;
  }
};

bootstrap();

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
