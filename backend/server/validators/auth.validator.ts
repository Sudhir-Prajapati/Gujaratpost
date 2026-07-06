import { z } from "zod";

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z
    .enum([
      "SUPER_ADMIN",
      "EDITOR",
      "REPORTER",
      "SEO",
      "ADVERTISEMENT",
      "PHOTOGRAPHER",
    ])
    .optional(),
});

export type RegisterSchema = z.infer<typeof RegisterSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export type LoginSchema = z.infer<typeof LoginSchema>;

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

// ---------------------------------------------------------------------------
// Verify Email
// ---------------------------------------------------------------------------
export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// ---------------------------------------------------------------------------
// Change Password
// ---------------------------------------------------------------------------
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});
