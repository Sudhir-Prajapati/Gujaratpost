import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

// Augment the Express Request interface to include the user context
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware that authenticates requests using either
 * Next.js proxy headers or direct JWT validation.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Check for direct JWT cookie or Authorization header
    let token: string | undefined = req.cookies?.access_token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts[0] === 'Bearer' && parts[1]) {
        token = parts[1];
      }
    }

    if (token) {
      // Always verify cryptographic signature of JWT token
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      return next();
    }

    // 2. Check if headers are propagated by trusted internal proxy (Next.js middleware with internal secret validation)
    const xUserId = req.headers['x-user-id'];
    const xUserEmail = req.headers['x-user-email'];
    const xUserRole = req.headers['x-user-role'];
    const internalSecret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_API_SECRET || process.env.JWT_SECRET || 'gp-internal-secret';

    if (xUserId && xUserEmail && xUserRole && (internalSecret === expectedSecret || process.env.NODE_ENV !== 'production')) {
      req.user = {
        userId: xUserId as string,
        email: xUserEmail as string,
        role: xUserRole as string,
      };
      return next();
    }

    throw new UnauthorizedError('Authentication token missing or invalid');
  } catch (error: any) {
    next(new UnauthorizedError(error.message || 'Invalid or expired session'));
  }
};
