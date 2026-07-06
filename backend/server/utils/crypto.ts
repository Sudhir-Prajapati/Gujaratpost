import crypto from "crypto";

/** Generate a URL-safe random token string. */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** Hash any string with SHA-256, returns a hex digest. */
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** Generate a numeric OTP of the specified length. */
export function generateOTP(digits = 6): string {
  const max = Math.pow(10, digits);
  return String(crypto.randomInt(0, max)).padStart(digits, "0");
}

/** Constant-time string comparison to prevent timing attacks. */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
