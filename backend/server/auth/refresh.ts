import crypto from "crypto";

/** Generate a cryptographically secure random 256-bit refresh token (hex). */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Hash a refresh token with SHA-256 for safe database storage. */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a short numeric OTP (One-Time Password).
 * @param digits — number of digits (default 6)
 */
export function generateOTP(digits = 6): string {
  const max = Math.pow(10, digits);
  const raw = crypto.randomInt(0, max);
  return String(raw).padStart(digits, "0");
}
