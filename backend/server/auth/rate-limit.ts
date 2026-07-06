import { Redis } from "ioredis";
import { env } from "@/server/config/env";
import { AUTH_CONFIG } from "@/server/config/auth";

// ---------------------------------------------------------------------------
// Redis client singleton
// ---------------------------------------------------------------------------
const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// ---------------------------------------------------------------------------
// Rate Limiter — Redis sliding counter per IP
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

const PREFIX = "rl:login:";

/**
 * Checks and increments the rate-limit counter for the given IP.
 * Uses Redis INCR + EXPIRE so that the window resets automatically.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const key = `${PREFIX}${ip}`;

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      // First request in this window — set the TTL
      await redis.expire(key, AUTH_CONFIG.RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > AUTH_CONFIG.RATE_LIMIT_MAX_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      return {
        success: false,
        remaining: 0,
        retryAfterSeconds: ttl > 0 ? ttl : AUTH_CONFIG.RATE_LIMIT_WINDOW_SECONDS,
      };
    }

    return {
      success: true,
      remaining: AUTH_CONFIG.RATE_LIMIT_MAX_ATTEMPTS - count,
    };
  } catch (err) {
    console.warn(`[RateLimit] Redis is down or unreachable. Bypassing rate limit check. Error:`, err);
    return {
      success: true,
      remaining: 99,
    };
  }
}

/**
 * Resets the counter for an IP (call on successful login).
 */
export async function resetRateLimit(ip: string): Promise<void> {
  try {
    await redis.del(`${PREFIX}${ip}`);
  } catch (err) {
    console.warn(`[RateLimit] Redis is down or unreachable. Ignoring resetRateLimit. Error:`, err);
  }
}
