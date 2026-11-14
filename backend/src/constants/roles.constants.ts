/**
 * Seed-time role identifiers. Roles themselves live in the `roles` table,
 * not as a hardcoded enum — adding a new role later is a data insert, not a
 * code change. These constants only name the two roles this project seeds
 * and are never used to gate authentication/authorization logic directly;
 * `requireRole()` compares against whatever role names are passed in.
 */
export const SEED_ROLES = {
  ADMIN: { name: "ADMIN", label: "Administrator" },
  FRANCHISE: { name: "FRANCHISE", label: "Franchise" },
} as const;
