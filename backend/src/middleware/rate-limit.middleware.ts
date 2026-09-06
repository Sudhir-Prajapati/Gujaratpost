import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';
import { TooManyRequestsError } from '../utils/errors.js';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
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

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${options.keyPrefix}:${ip}`;

    try {
      const count = await redisClient.incr(key);

      if (count === 1) {
        // First request in the time window, establish TTL
        await redisClient.expire(key, options.windowSeconds);
      }

      if (count > options.maxRequests) {
        const ttl = await redisClient.ttl(key);
        res.setHeader('Retry-After', ttl > 0 ? ttl : options.windowSeconds);
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

// Pre-configured Public API rate limiter: 300 requests per minute (Scraping & DDoS protection)
export const publicApiRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 300,
  keyPrefix: 'rate_limit:public',
});

// Pre-configured Admin API rate limiter: 100 requests per minute
export const adminApiRateLimiter = rateLimiter({
  windowSeconds: 60, // 1 minute
  maxRequests: 100,
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
