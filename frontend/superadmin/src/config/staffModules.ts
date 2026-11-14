import type { AuthUser } from "@/types/auth";

/** Superadmin modules grantable to a MANAGER login — keys mirror the backend's
 *  `STAFF_MODULES` (`staffModule.middleware.ts`). `paths` are the route
 *  prefixes the module's pages live under. */
export const STAFF_MODULES = [
  {
    key: "orders",
    label: "Orders",
    description: "View orders, create orders, assign phlebos, change status",
    paths: ["/orders"],
  },
  {
    key: "phlebos",
    label: "Phlebotomists",
    description: "Add and edit phlebos, activate/deactivate them",
    paths: ["/phlebos"],
  },
  {
    key: "whatsapp",
    label: "WhatsApp Assistant",
    description: "Read WhatsApp chats, reply as the team, work the handoff queue, view the AI log",
    paths: ["/whatsapp"],
  },
] as const;

export type StaffModuleKey = (typeof STAFF_MODULES)[number]["key"];

/** Reachable by any signed-in staff user regardless of modules. */
const ALWAYS_ALLOWED = ["/change-password"];

export function isManager(user: AuthUser | null | undefined): boolean {
  return user?.role === "MANAGER";
}

function grantedModules(user: AuthUser) {
  return STAFF_MODULES.filter((m) => user.staffModules?.includes(m.key));
}

/** Whether `pathname` is open to this user. Non-managers are not restricted here. */
export function canAccessPath(user: AuthUser | null | undefined, pathname: string): boolean {
  if (!user || !isManager(user)) return true;
  const allowed = [...ALWAYS_ALLOWED, ...grantedModules(user).flatMap((m) => [...m.paths])];
  return allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** A manager's landing page: their first granted module. */
export function managerHome(user: AuthUser): string {
  return grantedModules(user)[0]?.paths[0] ?? "/change-password";
}
