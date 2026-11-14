import { isManager, managerHome } from "@/config/staffModules";
import type { AuthUser, Role } from "@/types/auth";

/**
 * Where each role lands: the post-login destination, and where the role gate
 * sends someone who reaches a route their role may not see.
 *
 * Kept out of `ProtectedRoute.tsx` so that file exports only its component —
 * mixing constants in breaks React Fast Refresh for the whole module.
 */
export const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/",
  FRANCHISE: "/franchise",
};

export function homeForRole(role: Role | undefined): string {
  return (role && HOME_BY_ROLE[role]) ?? "/";
}

/** Like `homeForRole`, but a MANAGER's home depends on their modules. */
export function homeForUser(user: AuthUser): string {
  return isManager(user) ? managerHome(user) : homeForRole(user.role);
}
