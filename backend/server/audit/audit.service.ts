import { prisma } from "@/server/database/prisma";
import { logger } from "@/server/utils/logger";

// ---------------------------------------------------------------------------
// Audit Event Types
// ---------------------------------------------------------------------------
export type AuditAction =
  | "USER_REGISTERED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT_SUCCESS"
  | "TOKEN_REFRESHED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_SUCCESS"
  | "EMAIL_VERIFIED"
  | "SESSION_REVOKED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_DELETED"
  | "ROLE_CHANGED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "ARTICLE_CREATED"
  | "ARTICLE_PUBLISHED"
  | "ARTICLE_DELETED"
  | "GALLERY_UPLOAD"
  | "GALLERY_UPDATED"
  | "GALLERY_DELETED"
  | "VIDEO_CREATED"
  | "VIDEO_UPDATED"
  | "VIDEO_DELETED";

// ---------------------------------------------------------------------------
// Audit Service
// ---------------------------------------------------------------------------
export const AuditService = {
  async logEvent(
    action: AuditAction,
    options: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      entity?: string;
      entityId?: string;
    } = {}
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          userId: options.userId,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          entity: options.entity,
          entityId: options.entityId,
        },
      });
    } catch (err) {
      // Never let audit logging break the main flow
      logger.error("[AuditService] Failed to write audit log", {
        action,
        err,
      });
    }
  },
};
