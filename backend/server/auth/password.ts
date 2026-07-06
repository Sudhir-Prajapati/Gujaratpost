import bcrypt from "bcryptjs";
import { AUTH_CONFIG } from "@/server/config/auth";

/** Hash a plain-text password with bcrypt. */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, AUTH_CONFIG.BCRYPT_ROUNDS);
}

/** Compare a plain-text password against a stored bcrypt hash. */
export async function comparePassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
