import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { UserRepository } from "@/server/repositories/user.repository";
import { SessionRepository } from "@/server/repositories/session.repository";
import { AuditService } from "@/server/audit/audit.service";
import { signAccessToken } from "@/server/auth/jwt";
import { setAuthCookies, clearAuthCookies, getRefreshTokenCookie } from "@/server/auth/cookies";
import { comparePassword, hashPassword } from "@/server/auth/password";
import { generateRefreshToken, hashRefreshToken } from "@/server/auth/refresh";
import { checkRateLimit, resetRateLimit } from "@/server/auth/rate-limit";
import { LoginSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema, ChangePasswordSchema } from "@/server/validators/auth.validator";
import { ApiSuccess, ApiCreated, ApiError } from "@/server/utils/response";
import { TooManyRequestsError, UnauthorizedError, ForbiddenError, ConflictError, NotFoundError, ValidationError } from "@/server/utils/errors";
import { logger } from "@/server/utils/logger";
import { generateSecureToken, sha256 } from "@/server/utils/crypto";
import { sendPasswordResetEmail, sendLoginNotificationEmail } from "@/server/utils/mail";
import { AUTH_CONFIG } from "@/server/config/auth";
import { redis } from "@/server/auth/rate-limit";

// ---------------------------------------------------------------------------
// Helper: parse device/browser info from User-Agent
// ---------------------------------------------------------------------------
function parseDevice(userAgent: string): { browser: string; deviceName: string } {
  const ua = new UAParser(userAgent);
  const browser = ua.getBrowser().name ?? "Unknown Browser";
  const os = ua.getOS().name ?? "";
  const model = ua.getDevice().model ?? "";
  const deviceName = model ? `${model} (${os})` : os || "Unknown Device";
  return { browser, deviceName };
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------
export const AuthService = {

  // ── Register ──────────────────────────────────────────────────────────────
  async register(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const parsed = RegisterSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.format());

      const { email, password, role } = parsed.data;

      const existing = await UserRepository.findByEmail(email);
      if (existing) throw new ConflictError("A user with this email already exists");

      const passwordHash = await hashPassword(password);
      const user = await UserRepository.create({ email, passwordHash, role, status: "ACTIVE" });

      await AuditService.logEvent("USER_REGISTERED", {
        userId: user.id,
        ipAddress: getIp(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      });

      logger.info("[AuthService] User registered", { email, role: user.role });
      return ApiCreated({ id: user.id, email: user.email, role: user.role }, "Registration successful");
    } catch (err) {
      return ApiError(err);
    }
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(req: NextRequest): Promise<NextResponse> {
    const ip = getIp(req);
    try {
      // Rate limit
      const rl = await checkRateLimit(ip);
      if (!rl.success) throw new TooManyRequestsError(rl.retryAfterSeconds ?? 900);

      const body = await req.json();
      const parsed = LoginSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.format());

      const { email, password, rememberMe } = parsed.data;

      // Verify user
      const user = await UserRepository.findByEmail(email);
      if (!user) throw new UnauthorizedError("Invalid email or password");

      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) throw new UnauthorizedError("Invalid email or password");

      if (user.status !== "ACTIVE") throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);

      // Create session
      const userAgent = req.headers.get("user-agent") ?? "";
      const { browser, deviceName } = parseDevice(userAgent);
      const rawToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawToken);
      const country = req.headers.get("cf-ipcountry") ?? "IN";

      await SessionRepository.create({ userId: user.id, tokenHash, browser, deviceName, ipAddress: ip, country });

      const accessToken = await signAccessToken({ userId: user.id, email: user.email, role: user.role });
      await setAuthCookies(accessToken, rawToken, rememberMe);

      // Audit + notifications
      await AuditService.logEvent("LOGIN_SUCCESS", { userId: user.id, ipAddress: ip, userAgent });
      await resetRateLimit(ip);

      // Background login notification (non-blocking)
      sendLoginNotificationEmail(user.email, deviceName, ip).catch(() => {});

      logger.info("[AuthService] Login success", { email });
      return ApiSuccess({ id: user.id, email: user.email, role: user.role }, "Login successful");
    } catch (err) {
      logger.warn("[AuthService] Login failed", { ip });
      return ApiError(err);
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  async logout(req: NextRequest): Promise<NextResponse> {
    try {
      const rawToken = await getRefreshTokenCookie();
      if (rawToken) {
        const tokenHash = hashRefreshToken(rawToken);
        const session = await SessionRepository.findByHash(tokenHash);
        if (session) {
          await SessionRepository.deleteById(session.id);
          await AuditService.logEvent("LOGOUT_SUCCESS", {
            userId: session.userId,
            ipAddress: getIp(req),
            userAgent: req.headers.get("user-agent") ?? undefined,
          });
        }
      }
      await clearAuthCookies();
      return ApiSuccess(null, "Logout successful");
    } catch (err) {
      await clearAuthCookies();
      return ApiError(err);
    }
  },

  // ── Refresh ───────────────────────────────────────────────────────────────
  async refresh(req: NextRequest): Promise<NextResponse> {
    try {
      const rawToken = await getRefreshTokenCookie();
      if (!rawToken) throw new UnauthorizedError();

      const tokenHash = hashRefreshToken(rawToken);
      const session = await SessionRepository.findByHash(tokenHash);

      if (!session || session.expiresAt < new Date()) {
        if (session) await SessionRepository.deleteById(session.id);
        await clearAuthCookies();
        throw new UnauthorizedError("Session expired. Please login again.");
      }

      if (session.user.status !== "ACTIVE") {
        await SessionRepository.deleteById(session.id);
        await clearAuthCookies();
        throw new ForbiddenError("Account is inactive");
      }

      // Rotate token
      const userAgent = req.headers.get("user-agent") ?? "";
      const { browser, deviceName } = parseDevice(userAgent);
      const ip = getIp(req);
      const newRawToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(newRawToken);

      await Promise.all([
        SessionRepository.deleteById(session.id),
        SessionRepository.create({
          userId: session.user.id,
          tokenHash: newTokenHash,
          browser,
          deviceName,
          ipAddress: ip,
          country: session.country ?? "IN",
        }),
      ]);

      const accessToken = await signAccessToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      });

      await setAuthCookies(accessToken, newRawToken, true);
      await AuditService.logEvent("TOKEN_REFRESHED", { userId: session.user.id, ipAddress: ip });

      return ApiSuccess({ id: session.user.id, email: session.user.email, role: session.user.role }, "Token refreshed");
    } catch (err) {
      return ApiError(err);
    }
  },

  // ── Forgot Password ───────────────────────────────────────────────────────
  async forgotPassword(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const parsed = ForgotPasswordSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.format());

      const { email } = parsed.data;
      const user = await UserRepository.findByEmail(email);

      // Always return success to prevent email enumeration
      if (user && user.status === "ACTIVE") {
        const rawToken = generateSecureToken(32);
        const tokenHash = sha256(rawToken);
        const expiry = AUTH_CONFIG.PASSWORD_RESET_EXPIRY_MINUTES * 60; // seconds

        await redis.set(`pwd_reset:${tokenHash}`, user.id, "EX", expiry);
        await sendPasswordResetEmail(email, rawToken);
        await AuditService.logEvent("PASSWORD_RESET_REQUESTED", { userId: user.id, ipAddress: getIp(req) });
      }

      return ApiSuccess(null, "If that email exists, a password reset link has been sent.");
    } catch (err) {
      return ApiError(err);
    }
  },

  // ── Reset Password ────────────────────────────────────────────────────────
  async resetPassword(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const parsed = ResetPasswordSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.format());

      const { token, password } = parsed.data;
      const tokenHash = sha256(token);
      const userId = await redis.get(`pwd_reset:${tokenHash}`);
      if (!userId) throw new UnauthorizedError("Invalid or expired reset token");

      const passwordHash = await hashPassword(password);
      await UserRepository.update(userId, { passwordHash });

      // Invalidate token + all sessions
      await redis.del(`pwd_reset:${tokenHash}`);
      await SessionRepository.deleteAllForUser(userId);
      await clearAuthCookies();

      await AuditService.logEvent("PASSWORD_RESET_SUCCESS", { userId, ipAddress: getIp(req) });
      logger.info("[AuthService] Password reset", { userId });
      return ApiSuccess(null, "Password reset successfully. Please login again.");
    } catch (err) {
      return ApiError(err);
    }
  },

  // ── Change Password ───────────────────────────────────────────────────────
  async changePassword(req: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const body = await req.json();
      const parsed = ChangePasswordSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError("Validation failed", parsed.error.format());

      const { currentPassword, newPassword } = parsed.data;
      const user = await UserRepository.findById(userId);
      if (!user) throw new NotFoundError("User");

      const valid = await comparePassword(currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedError("Current password is incorrect");

      const passwordHash = await hashPassword(newPassword);
      await UserRepository.update(userId, { passwordHash });

      // Revoke all sessions
      await SessionRepository.deleteAllForUser(userId);
      await clearAuthCookies();

      await AuditService.logEvent("PASSWORD_CHANGED", { userId, ipAddress: getIp(req) });
      return ApiSuccess(null, "Password changed. Please login again.");
    } catch (err) {
      return ApiError(err);
    }
  },
};
