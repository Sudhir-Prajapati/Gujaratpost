export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  EDITOR: "EDITOR",
  REPORTER: "REPORTER",
  SEO: "SEO",
  ADVERTISEMENT: "ADVERTISEMENT",
  PHOTOGRAPHER: "PHOTOGRAPHER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Ordered from most privileged to least privileged. */
export const ROLE_HIERARCHY: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.EDITOR,
  ROLES.REPORTER,
  ROLES.SEO,
  ROLES.ADVERTISEMENT,
  ROLES.PHOTOGRAPHER,
];
