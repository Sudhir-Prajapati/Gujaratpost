import { Resend } from "resend";
import { env } from "@/server/config/env";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Provider-agnostic MailService interface
// ---------------------------------------------------------------------------
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface MailService {
  send(options: SendEmailOptions): Promise<{ id?: string }>;
}

// ---------------------------------------------------------------------------
// Resend implementation
// ---------------------------------------------------------------------------
class ResendMailService implements MailService {
  private client: Resend;
  private fromAddress: string;

  constructor() {
    this.client = new Resend(env.RESEND_API_KEY);
    this.fromAddress = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;
  }

  async send(options: SendEmailOptions): Promise<{ id?: string }> {
    try {
      const { data, error } = await this.client.emails.send({
        from: options.from ?? this.fromAddress,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        logger.error("[mail] Resend error", error);
        return {};
      }

      logger.info("[mail] Email sent", { id: data?.id, to: options.to });
      return { id: data?.id };
    } catch (err) {
      logger.error("[mail] Unexpected error", err);
      return {};
    }
  }
}

// Singleton mail service — swap implementation here (e.g. SendGrid, Nodemailer)
export const mail: MailService = new ResendMailService();

// ---------------------------------------------------------------------------
// Templated helpers
// ---------------------------------------------------------------------------
const appUrl = env.NEXT_PUBLIC_APP_URL;

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const link = `${appUrl}/reset-password?token=${token}`;
  await mail.send({
    to,
    subject: "Reset Your Gujarat Post Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="background:#c0392b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Reset Password</a>
      <p>If you did not request this, ignore this email.</p>
    `,
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const link = `${appUrl}/verify-email?token=${token}`;
  await mail.send({
    to,
    subject: "Verify Your Gujarat Post Email",
    html: `
      <h2>Verify Your Email Address</h2>
      <p>Click the link below to verify your email. This link expires in 24 hours.</p>
      <a href="${link}" style="background:#c0392b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a>
    `,
  });
}

export async function sendLoginNotificationEmail(
  to: string,
  device: string,
  ip: string
): Promise<void> {
  await mail.send({
    to,
    subject: "New Login Detected — Gujarat Post",
    html: `
      <h2>New Login to Your Account</h2>
      <p>A new login was detected on your Gujarat Post account.</p>
      <ul>
        <li><strong>Device:</strong> ${device}</li>
        <li><strong>IP Address:</strong> ${ip}</li>
        <li><strong>Time:</strong> ${new Date().toISOString()}</li>
      </ul>
      <p>If this was not you, please change your password immediately.</p>
    `,
  });
}
