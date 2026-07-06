// ---------------------------------------------------------------------------
// Authentication Configuration Constants
// ---------------------------------------------------------------------------

export const AUTH_CONFIG = {
  // Access token lifetime (used both for JWT expiry and maxAge cookie)
  ACCESS_TOKEN_EXPIRY: "15m",
  ACCESS_TOKEN_MAX_AGE_SECONDS: 15 * 60, // 15 minutes

  // Refresh token lifetime
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  REFRESH_TOKEN_MAX_AGE_SECONDS: 7 * 24 * 60 * 60, // 7 days

  // Cookie names
  COOKIE_ACCESS_TOKEN: "access_token",
  COOKIE_REFRESH_TOKEN: "refresh_token",

  // Rate limiting (Redis-backed)
  RATE_LIMIT_MAX_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_SECONDS: 15 * 60, // 15 minutes

  // Password reset token lifetime
  PASSWORD_RESET_EXPIRY_MINUTES: 60, // 1 hour

  // Email verification token lifetime
  EMAIL_VERIFY_EXPIRY_HOURS: 24, // 24 hours

  // Bcrypt salt rounds
  BCRYPT_ROUNDS: 10,
} as const;
