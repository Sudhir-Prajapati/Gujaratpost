import { env } from "@/server/config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

function log(level: LogLevel, message: string, meta?: unknown): void {
  const isDev = env.NODE_ENV === "development";
  const timestamp = new Date().toISOString();
  const color = LEVEL_COLORS[level];
  const prefix = isDev
    ? `${color}[${level.toUpperCase()}]${RESET} ${timestamp}`
    : JSON.stringify({ level, timestamp, message, ...(meta ? { meta } : {}) });

  if (isDev) {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    console.log(`${prefix} — ${message}${metaStr}`);
  } else {
    console.log(prefix);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};
