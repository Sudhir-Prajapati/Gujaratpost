import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { UserRepository } from '../repositories/user.repository.js';
import { SessionRepository } from '../repositories/session.repository.js';
import { comparePasswords } from '../utils/bcrypt.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeRefreshToken,
  TokenPayload,
} from '../utils/jwt.js';
import { UnauthorizedError, BadRequestError } from '../utils/errors.js';
import { AccountStatus } from '@prisma/client';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    isFirstLogin: boolean;
  };
}

export class AuthService {
  private static hashJti(jti: string): string {
    return crypto.createHash('sha256').update(jti).digest('hex');
  }

  /**
   * Log in a user and establish a new session.
   */
  static async login(params: {
    email: string;
    password: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const { email, password, userAgent, ipAddress, rememberMe } = params;

    // 1. Find user by email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Validate password
    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Check account status
    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedError('Your account has been suspended. Please contact support.');
    }

    // 4. Check admin role — only staff with a valid admin role can access the portal
    const ALLOWED_ADMIN_ROLES = ['SUPER_ADMIN', 'EDITOR', 'REPORTER', 'SEO', 'ADVERTISEMENT', 'PHOTOGRAPHER'];
    if (!ALLOWED_ADMIN_ROLES.includes(user.role)) {
      throw new UnauthorizedError('Access denied. You do not have permission to access the admin portal.');
    }

    // 5. Generate Access and Refresh Tokens — user is verified as an authorized admin
    const userPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // If "Remember me for 7 days" is selected: 7 days, otherwise 24 hours
    const expiryStr = rememberMe ? '7d' : '24h';
    const accessToken = signAccessToken(userPayload, expiryStr);
    const { token: refreshToken, jti } = signRefreshToken(user.id, expiryStr);
    const hashedJti = this.hashJti(jti);

    // Refresh Token / Session expires in 7 days (or 24 hours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 7 : 1));

    // 6. Save session in database & cache
    await SessionRepository.createSession({
      userId: user.id,
      tokenHash: hashedJti,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      },
    };
  }

  /**
   * Rotate access and refresh tokens using the old refresh token.
   */
  static async rotateTokens(params: {
    refreshToken: string;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<AuthResponse> {
    const { refreshToken, userAgent, ipAddress } = params;

    // 1. Decode token to extract payload without verification first (to obtain userId for security checks)
    const decoded = decodeRefreshToken(refreshToken);
    if (!decoded || !decoded.userId || !decoded.jti) {
      throw new UnauthorizedError('Invalid session token');
    }

    const { userId, jti } = decoded;
    const hashedJti = this.hashJti(jti);

    // 2. Verify token signature and expiry
    try {
      verifyRefreshToken(refreshToken);
    } catch (error: any) {
      // If expired or invalid, make sure we clean up the session from database
      await SessionRepository.deleteSession(hashedJti);
      throw new UnauthorizedError('Session expired. Please log in again.');
    }

    // 3. Find active session in cache/database
    const session = await SessionRepository.getSession(hashedJti);

    // 4. SECURE TOKEN ROTATION / REUSE DETECTION
    if (!session) {
      // The token is signed & has a valid userId, but its ID (jti) is missing from the database.
      // This indicates that the refresh token was already used/rotated previously, or deleted.
      // This means a REUSE attack could be occurring. For safety, revoke ALL user sessions.
      await SessionRepository.revokeAllUserSessions(userId);
      throw new UnauthorizedError('Access compromised. All active sessions have been revoked. Please log in again.');
    }

    // Double check session ownership
    if (session.userId !== userId) {
      throw new UnauthorizedError('Session validation failed');
    }

    // 5. Load user info to sign new Access Token
    const user = await UserRepository.findById(userId);
    if (!user || user.status === AccountStatus.SUSPENDED) {
      await SessionRepository.deleteSession(hashedJti);
      throw new UnauthorizedError('User account is invalid or suspended');
    }

    // 6. Delete the old session (one-time use rotation)
    await SessionRepository.deleteSession(hashedJti);

    // 7. Generate new Access and Refresh tokens
    const userPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = signAccessToken(userPayload);
    const { token: newRefreshToken, jti: newJti } = signRefreshToken(user.id);
    const hashedNewJti = this.hashJti(newJti);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 8. Save the new session
    await SessionRepository.createSession({
      userId: user.id,
      tokenHash: hashedNewJti,
      userAgent,
      ipAddress,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      },
    };
  }

  /**
   * Log out of the current session by invalidating the refresh token.
   */
  static async logout(refreshToken: string): Promise<void> {
    const decoded = decodeRefreshToken(refreshToken);
    if (decoded && decoded.jti) {
      const hashedJti = this.hashJti(decoded.jti);
      await SessionRepository.deleteSession(hashedJti);
    }
  }

  /**
   * Complete the user's first-time login profile setup.
   * Can only be executed ONCE per user account.
   */
  static async setupProfile(
    userId: string,
    profileData: {
      name: string;
      image: string;
      designation: string;
      bio: string;
      nameGu?: string;
      nameHi?: string;
      designationGu?: string;
      designationHi?: string;
      bioGu?: string;
      bioHi?: string;
    }
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch user to verify setup eligibility
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestError('User account not found.');
      }

      // 2. STRICTION: Reject setup if isFirstLogin is already false (Only one-time allowed)
      if (!user.isFirstLogin) {
        throw new BadRequestError('Profile setup has already been completed.');
      }

      // 3. Fallback translations (copy English to Hindi and Gujarati if missing)
      const nameGu = profileData.nameGu || profileData.name;
      const nameHi = profileData.nameHi || profileData.name;
      const designationGu = profileData.designationGu || profileData.designation;
      const designationHi = profileData.designationHi || profileData.designation;
      const bioGu = profileData.bioGu || profileData.bio;
      const bioHi = profileData.bioHi || profileData.bio;

      // 4. Create Author Profile
      await UserRepository.createAuthorProfile(
        {
          userId,
          name: profileData.name,
          nameGu,
          nameHi,
          image: profileData.image,
          designation: profileData.designation,
          designationGu,
          designationHi,
          bio: profileData.bio,
          bioGu,
          bioHi,
        },
        tx
      );

      // 5. De-flag the user's first-login flag
      await UserRepository.updateFirstLoginStatus(userId, false, tx);
    });
  }
}
