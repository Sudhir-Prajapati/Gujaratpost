import 'dotenv/config';
import { createClient } from 'redis';

const hasRedisUrl = Boolean(process.env.REDIS_URL);
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isTls = redisUrl.startsWith('rediss://');

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: isTls,
    rejectUnauthorized: false,
    keepAlive: 10000,
    connectTimeout: 3000,
    reconnectStrategy: (retries) => {
      // Stop reconnecting after 3 failed attempts to avoid hanging or infinite retry loops
      if (retries >= 3) {
        return false;
      }
      return 1000;
    },
  },
  pingInterval: 15000,
});

let lastRedisErrorMsg = '';
let lastRedisErrorTime = 0;

redisClient.on('error', (err: any) => {
  const msg = err?.message || String(err);
  const now = Date.now();
  // Throttle duplicate warning logs to once every 10 seconds
  if (msg !== lastRedisErrorMsg || now - lastRedisErrorTime > 10000) {
    lastRedisErrorMsg = msg;
    lastRedisErrorTime = now;
    if (process.env.NODE_ENV === 'development') {
      console.warn('Redis Notice:', msg);
    }
  }
});

redisClient.on('connect', () => {
  console.log('Redis connection established.');
});

// Helper function to initialize Redis connection safely without blocking server startup
export const connectRedis = async (): Promise<void> => {
  // In production without REDIS_URL, don't attempt local Redis
  if (!hasRedisUrl && process.env.NODE_ENV === 'production') {
    console.log('ℹ️  No REDIS_URL configured in production. Operating in database-only mode.');
    return;
  }

  if (!redisClient.isOpen) {
    try {
      // Race connection with a 3-second timeout so it never blocks
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timed out after 3s')), 3000)),
      ]);
    } catch (error: any) {
      console.warn('Could not establish initial connection to Redis. Running in database-only mode:', error?.message || error);
    }
  }
};
