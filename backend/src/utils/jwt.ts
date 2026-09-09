import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function getJwtSecret(): string {
  const rawSecret = process.env.JWT_SECRET || 'fallback-super-secret-key-at-least-32-characters-long';
  return rawSecret.replace(/^["']|["']$/g, '');
}

function getJwtAccessExpiry(): string {
  return process.env.JWT_ACCESS_EXPIRY || '24h';
}

function getJwtRefreshExpiry(): string {
  return process.env.JWT_REFRESH_EXPIRY || '30d';
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string;
}

/**
 * Signs an access JWT with standard or custom expiry (e.g. 24h or 7d).
 */
export const signAccessToken = (payload: TokenPayload, customExpiry?: string): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: (customExpiry || getJwtAccessExpiry()) as any,
  });
};

/**
 * Verifies an access JWT.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
};

/**
 * Signs a refresh JWT with standard or custom expiry and returns the token and its unique JTI.
 */
export const signRefreshToken = (userId: string, customExpiry?: string): { token: string; jti: string } => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ userId, jti }, getJwtSecret(), {
    expiresIn: (customExpiry || getJwtRefreshExpiry()) as any,
  });
  return { token, jti };
};

/**
 * Decodes a refresh JWT (even if expired or invalid signature, for safety checks).
 */
export const decodeRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    return jwt.decode(token) as RefreshTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Verifies a refresh JWT.
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, getJwtSecret()) as RefreshTokenPayload;
};
