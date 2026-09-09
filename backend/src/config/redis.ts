import 'dotenv/config';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    // Stop reconnecting after 3 failed attempts to allow graceful database-only operation
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        console.warn(`Redis connection failed after ${retries} retries. Gracefully running without cache.`);
        return false; // returning false stops reconnection attempts
      }
      return 1000; // retry after 1 second
    },
  },
});

redisClient.on('error', (err) => {
  // Silent error logger to avoid flooding console log outputs during offline periods
  if (process.env.NODE_ENV === 'development') {
    console.warn('Redis Cache Offline:', err.message || err);
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
    } catch (error) {
      console.warn('Could not establish initial connection to Redis. Running in database-only mode.');
    }
  }
};
