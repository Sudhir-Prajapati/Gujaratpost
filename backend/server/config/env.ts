import { z } from "zod";

const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Resend (Email)
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM_EMAIL: z.string().default("noreply@gujaratpost.com"),
  RESEND_FROM_NAME: z.string().default("Gujarat Post"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Parse once at module load — throws immediately if required vars are missing
const _env = EnvSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌  Invalid environment variables:\n",
    _env.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment configuration. Check your .env file.");
}

export const env = _env.data;
export type Env = typeof env;
