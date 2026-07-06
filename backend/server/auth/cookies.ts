import { cookies } from "next/headers";
import { env } from "@/server/config/env";
import { AUTH_CONFIG } from "@/server/config/auth";

const isProduction = env.NODE_ENV === "production";

/** Set both access_token and refresh_token as HTTP-only cookies. */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe = true
): Promise<void> {
  const jar = await cookies();

  jar.set(AUTH_CONFIG.COOKIE_ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_CONFIG.ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  jar.set(AUTH_CONFIG.COOKIE_REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    ...(rememberMe
      ? { maxAge: AUTH_CONFIG.REFRESH_TOKEN_MAX_AGE_SECONDS }
      : {}),
  });
}

/** Delete both auth cookies from the client. */
export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_CONFIG.COOKIE_ACCESS_TOKEN, "", { maxAge: 0, path: "/" });
  jar.set(AUTH_CONFIG.COOKIE_REFRESH_TOKEN, "", { maxAge: 0, path: "/" });
}

/** Read the raw access token string from cookies. */
export async function getAccessTokenCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_CONFIG.COOKIE_ACCESS_TOKEN)?.value;
}

/** Read the raw refresh token string from cookies. */
export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(AUTH_CONFIG.COOKIE_REFRESH_TOKEN)?.value;
}
