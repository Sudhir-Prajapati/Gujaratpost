import 'dotenv/config';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTls = redisUrl.startsWith('rediss://');

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: isTls,
    rejectUnauthorized: false,
    keepAlive: 10000,
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      // Exponential backoff capped at 10 seconds
      return Math.min(retries * 1000 + 1000, 10000);
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

// Helper function to initialize Redis connection
export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error: any) {
      console.warn('Could not establish initial connection to Redis. Running in database-only mode:', error?.message || error);
    }
  }
};
