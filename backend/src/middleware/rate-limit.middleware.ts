import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';
import { TooManyRequestsError } from '../utils/errors.js';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
}

/**
 * Extracts accurate client IP behind Cloudflare, reverse proxies (Render, Nginx, AWS), or direct connection.
 */
export function getClientIp(req: Request): string {
  // 1. Cloudflare connecting IP (always the direct client IP when proxied through Cloudflare)
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cfIp.trim();
  }

  // 2. True-Client-IP (Cloudflare Enterprise / Akamai)
  const trueClientIp = req.headers['true-client-ip'];
  if (typeof trueClientIp === 'string' && trueClientIp.trim()) {
    return trueClientIp.trim();
  }

  // 3. X-Real-IP
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  // 4. X-Forwarded-For: client, proxy1, proxy2
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.trim()) {
    const ips = xForwardedFor.split(',').map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      return ips[0];
    }
  }

  // 5. Express req.ip or socket fallback
  return req.ip || req.socket.remoteAddress || 'unknown-ip';
}

/**
 * Creates an IP-based rate limiting middleware using Redis.
 */
export const rateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // If Redis is not connected, fall-through (fail-soft to ensure service availability)
    if (!redisClient.isOpen) {
      return next();
    }

    const ip = getClientIp(req);

    // Bypass rate limiting for internal/localhost/SSR calls
    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip === '::ffff:127.0.0.1'
    ) {
      return next();
    }

    const key = `${options.keyPrefix}:${ip}`;

    try {
      const count = await redisClient.incr(key);

      if (count === 1) {
        // First request in the time window, establish TTL
        await redisClient.expire(key, options.windowSeconds);
      } else {
        // Defensive check: ensure the key has an expiry even under race conditions
        const currentTtl = await redisClient.ttl(key);
        if (currentTtl === -1) {
          await redisClient.expire(key, options.windowSeconds);
        }
      }

      if (count > options.maxRequests) {
        let ttl = await redisClient.ttl(key);

        // TTL=-1 means key exists but has NO expiry — fix it immediately
        if (ttl === -1) {
          await redisClient.expire(key, options.windowSeconds);
          ttl = options.windowSeconds;
        }

        // TTL=-2 means key doesn't exist — shouldn't happen but handle gracefully
        if (ttl < 0) ttl = options.windowSeconds;

        res.setHeader('Retry-After', ttl);
        return next(new TooManyRequestsError(`Too many requests. Please try again in ${ttl} seconds.`));
      }

      next();
    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      next(); // Fail-soft
    }
  };
};

// Pre-configured login rate limiter: 5 attempts per 15 minutes (Brute-force protection)
export const loginRateLimiter = rateLimiter({
  windowSeconds: 900, // 15 minutes
  maxRequests: 5,
  keyPrefix: 'rate_limit:login',
});

// Pre-configured Public API rate limiter: 5000 requests per minute
// Public news endpoints are heavily cached and read-only.
// 5,000 req/min ensures users browsing news and mobile networks with CGNAT (Jio, Airtel) are never blocked.
export const publicApiRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 5000,
  keyPrefix: 'rate_limit:public',
});

// Pre-configured Admin API rate limiter: 300 requests per minute
export const adminApiRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 300,
  keyPrefix: 'rate_limit:admin',
});

// Pre-configured OTP Send rate limiter: 3 requests per 10 minutes (SMS/Email spam protection)
export const otpRateLimiter = rateLimiter({
  windowSeconds: 600, // 10 minutes
  maxRequests: 3,
  keyPrefix: 'rate_limit:otp_send',
});

// Pre-configured OTP Verify rate limiter: 5 attempts per 10 minutes (OTP Brute-force protection)
export const otpVerifyRateLimiter = rateLimiter({
  windowSeconds: 600, // 10 minutes
  maxRequests: 5,
  keyPrefix: 'rate_limit:otp_verify',
});
