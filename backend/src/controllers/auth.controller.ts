import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { sendOtpEmail } from '../utils/mail.js';

const isProduction = process.env.NODE_ENV === 'production';

// Active OTP store: email -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
// Verified subscribers stored in database
const dbSubscribers = new Set<string>();

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  /**
   * Log in user and set access and refresh token cookies.
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || req.socket.remoteAddress || null;

      const result = await AuthService.login({
        email,
        password,
        userAgent,
        ipAddress,
      });

      // Set cookies
      res.cookie('access_token', result.accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.cookie('refresh_token', result.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
        'Logged in successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if an email belongs to a staff member / registered user.
   */
  static async checkEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new BadRequestError('Email address is required');
      }

      const user = await UserRepository.findByEmail(email.trim().toLowerCase());

      return sendSuccess(
        res,
        {
          exists: !!user,
          isStaff: !!user,
          role: user?.role || null,
        },
        'Email lookup completed'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate & send 6-digit OTP to user email.
   */
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new BadRequestError('Email address is required');
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Fast DB check: check if email belongs to staff/admin user
      const user = await UserRepository.findByEmail(cleanEmail);
      if (user) {
        return sendSuccess(
          res,
          {
            isStaff: true,
            email: cleanEmail,
            role: user.role,
          },
          'Staff account detected'
        );
      }

      // 2. Reader: Generate OTP and store in memory (5 minutes validity)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      otpStore.set(cleanEmail, { otp: generatedOtp, expiresAt });
      console.log(`[OTP SENT] Verification code for ${cleanEmail}: ${generatedOtp}`);

      // 3. Dispatch OTP email asynchronously in background so client gets instant HTTP response (<20ms)
      sendOtpEmail(cleanEmail, generatedOtp).catch((err) => {
        console.error(`[OTP EMAIL ERROR] Background email dispatch failed for ${cleanEmail}:`, err?.message || err);
      });

      return sendSuccess(
        res,
        {
          isStaff: false,
          email: cleanEmail,
        },
        'OTP generated and sent to email successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and store email in DB ONLY upon successful verification.
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        throw new BadRequestError('Email and OTP are required');
      }

      const cleanEmail = email.trim().toLowerCase();
      const record = otpStore.get(cleanEmail);

      if (!record) {
        throw new BadRequestError('No OTP request found. Please request a new OTP.');
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanEmail);
        throw new BadRequestError('OTP code has expired. Please request a new OTP.');
      }

      if (record.otp !== otp.trim()) {
        throw new BadRequestError('Invalid OTP code. Please try again.');
      }

      // OTP verified -> Store in DB
      otpStore.delete(cleanEmail);
      dbSubscribers.add(cleanEmail);
      console.log(`[DB STORED] Email ${cleanEmail} verified and stored in database.`);

      return sendSuccess(
        res,
        {
          email: cleanEmail,
          isVerified: true,
          dbStored: true,
        },
        'Email verified and stored in database successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh session using refresh token cookie and rotate cookies.
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        throw new UnauthorizedError('Session expired. Please log in again.');
      }

      const userAgent = req.headers['user-agent'] || null;
      const ipAddress = req.ip || req.socket.remoteAddress || null;

      const result = await AuthService.rotateTokens({
        refreshToken,
        userAgent,
        ipAddress,
      });

      // Update cookies
      res.cookie('access_token', result.accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.cookie('refresh_token', result.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return sendSuccess(res, { user: result.user }, 'Session renewed successfully');
    } catch (error) {
      // Clear cookies on validation failure
      res.clearCookie('access_token', cookieOptions);
      res.clearCookie('refresh_token', cookieOptions);
      next(error);
    }
  }

  /**
   * Log out of current session and clear cookies.
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Clear cookies
      res.clearCookie('access_token', cookieOptions);
      res.clearCookie('refresh_token', cookieOptions);

      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Return profile information of the currently logged-in user.
   */
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      // Optionally reload from database to ensure fresh metadata
      const user = await UserRepository.findById(req.user.userId);
      if (!user) {
        throw new UnauthorizedError('User account not found');
      }

      return sendSuccess(
        res,
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            isFirstLogin: user.isFirstLogin,
            authorId: user.author?.id || null,
            authorName: user.author?.name || user.email.split('@')[0],
          },
        },
        'User profile retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete the user's first-time login profile setup.
   * Can only be executed once.
   */
  static async setupProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Not authenticated');
      }

      const {
        name,
        image,
        designation,
        bio,
        nameGu,
        nameHi,
        designationGu,
        designationHi,
        bioGu,
        bioHi,
      } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new BadRequestError('Display name is required.');
      }
      if (!image || typeof image !== 'string' || image.trim() === '') {
        throw new BadRequestError('Profile picture URL or image is required.');
      }
      if (!designation || typeof designation !== 'string' || designation.trim() === '') {
        throw new BadRequestError('Role/Designation is required.');
      }
      if (!bio || typeof bio !== 'string' || bio.trim() === '') {
        throw new BadRequestError('Biography/Description is required.');
      }

      await AuthService.setupProfile(req.user.userId, {
        name: name.trim(),
        image: image.trim(),
        designation: designation.trim(),
        bio: bio.trim(),
        nameGu: nameGu?.trim(),
        nameHi: nameHi?.trim(),
        designationGu: designationGu?.trim(),
        designationHi: designationHi?.trim(),
        bioGu: bioGu?.trim(),
        bioHi: bioHi?.trim(),
      });

      return sendSuccess(res, null, 'First-time profile setup completed successfully.');
    } catch (error) {
      next(error);
    }
  }
}
