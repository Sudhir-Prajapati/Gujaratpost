import type { Role } from "./roles";

// ---------------------------------------------------------------------------
// Granular permission actions
// ---------------------------------------------------------------------------
export type Permission =
  | "*"                     // Wildcard — all permissions
  | "articles:create"
  | "articles:edit"
  | "articles:delete"
  | "articles:publish"
  | "articles:read"
  | "categories:manage"
  | "gallery:upload"
  | "gallery:delete"
  | "gallery:read"
  | "users:read"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "ads:manage"
  | "seo:manage"
  | "settings:manage"
  | "logs:read"
  | "roles:manage";

// ---------------------------------------------------------------------------
// Role → Permissions Map
// ---------------------------------------------------------------------------
export const PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ["*"],

  EDITOR: [
    "articles:create",
    "articles:edit",
    "articles:delete",
    "articles:publish",
    "articles:read",
    "categories:manage",
    "gallery:upload",
    "gallery:delete",
    "gallery:read",
  ],

  REPORTER: [
    "articles:create",
    "articles:edit",
    "articles:read",
    "gallery:read",
  ],

  SEO: [
    "seo:manage",
    "articles:read",
  ],

  ADVERTISEMENT: [
    "ads:manage",
  ],

  PHOTOGRAPHER: [
    "gallery:upload",
    "gallery:read",
  ],
};
