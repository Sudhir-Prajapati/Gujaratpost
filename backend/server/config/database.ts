import { env } from "./env";

export const DATABASE_CONFIG = {
  url: env.DATABASE_URL,
  // Log levels per environment
  logLevels:
    env.NODE_ENV === "development"
      ? (["query", "error", "warn"] as const)
      : (["error"] as const),
} as const;
