import type { Role } from "@/server/constants/roles";

// ---------------------------------------------------------------------------
// JWT Token Payload (embedded in the JWT)
// ---------------------------------------------------------------------------
export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Session input (used when creating a session record)
// ---------------------------------------------------------------------------
export interface SessionCreateInput {
  userId: string;
  deviceName?: string;
  browser?: string;
  ipAddress?: string;
  country?: string;
}

// ---------------------------------------------------------------------------
// Login result returned from AuthService
// ---------------------------------------------------------------------------
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

// ---------------------------------------------------------------------------
// Auth service method inputs
// ---------------------------------------------------------------------------
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  role?: Role;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}
