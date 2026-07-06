import { SignJWT, jwtVerify } from "jose";
import { env } from "@/server/config/env";
import { AUTH_CONFIG } from "@/server/config/auth";
import type { TokenPayload } from "@/server/types/auth";

const secret = new TextEncoder().encode(env.JWT_SECRET);

/** Sign a 15-minute access token. */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

/** Verify and decode an access token. Returns null on any failure. */
export async function verifyAccessToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
