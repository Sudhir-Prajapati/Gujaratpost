import { ROLES, type Role } from "@/server/constants/roles";
import { PERMISSIONS, type Permission } from "@/server/constants/permissions";

/**
 * Returns true if the given role has permission to perform the action.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = PERMISSIONS[role] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}

/**
 * Returns true if roleA is hierarchically equal to or above roleB.
 */
export function isRoleAtLeast(roleA: Role, roleB: Role): boolean {
  const hierarchy: Role[] = [
    ROLES.SUPER_ADMIN,
    ROLES.EDITOR,
    ROLES.REPORTER,
    ROLES.SEO,
    ROLES.ADVERTISEMENT,
    ROLES.PHOTOGRAPHER,
  ];
  return hierarchy.indexOf(roleA) <= hierarchy.indexOf(roleB);
}
