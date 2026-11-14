import type { Role } from "@/types/auth";

/** Single place that maps a role to its landing dashboard. */
export function dashboardPathForRole(role: Role): string {
  return role === "ADMIN" ? "/admin/dashboard" : "/portal/dashboard";
}
