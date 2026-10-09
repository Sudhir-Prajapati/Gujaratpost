/**
 * Wraps a Prisma operation with automatic retry logic for transient errors.
 * Handles: connection pool timeout (P2024), connection refused (P1001), etc.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;

      // Retryable Prisma error codes
      const retryableCodes = [
        'P1001', // Can't reach DB server
        'P1002', // DB server timed out
        'P2024', // Connection pool timeout
        'P2028', // Transaction API error
      ];

      const isRetryable =
        retryableCodes.includes(err?.code) ||
        err?.message?.includes('connection pool') ||
        err?.message?.includes('timed out') ||
        err?.message?.includes("Can't reach database");

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      const jitter = Math.floor(Math.random() * 250);
      const backoff = delayMs * attempt + jitter;
      console.warn(`[DB] Attempt ${attempt}/${maxRetries} failed (${err?.code || 'unknown'}). Retrying in ${backoff}ms...`);
      await new Promise((res) => setTimeout(res, backoff));
    }
  }

  throw lastError;
}
