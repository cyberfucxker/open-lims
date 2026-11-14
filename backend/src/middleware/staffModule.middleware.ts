import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";

/** Superadmin modules that can be granted to a MANAGER login. Add a key here
 *  (and to the superadmin's `STAFF_MODULES`) to make another module grantable. */
export const STAFF_MODULES = ["orders", "phlebos", "whatsapp"] as const;
export type StaffModule = (typeof STAFF_MODULES)[number];

export function parseStaffModules(value: unknown): StaffModule[] {
  if (!Array.isArray(value)) return [];
  return value.filter((m): m is StaffModule => STAFF_MODULES.includes(m as StaffModule));
}

/**
 * Lets ADMIN through unconditionally, and a MANAGER only when the module is
 * in their `staffModules` — anyone else (FRANCHISE included) is refused.
 * Used in place of `requireRole("ADMIN")` on exactly the routes a module's
 * pages need, so a manager can never reach an admin-only route by URL.
 *
 * The MANAGER check reads the user row on every request rather than trusting
 * the JWT, so deactivating a manager or revoking a module takes effect
 * immediately instead of when their access token expires.
 */
export function requireStaffModule(...modules: StaffModule[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }

    const role = req.user.role.toUpperCase();
    if (role === "ADMIN") {
      next();
      return;
    }
    if (role !== "MANAGER") {
      next(ApiError.forbidden("You do not have permission to perform this action"));
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { isActive: true, staffModules: true },
      });
      const granted = parseStaffModules(user?.staffModules);
      if (!user?.isActive || !modules.some((m) => granted.includes(m))) {
        next(ApiError.forbidden("You do not have access to this module"));
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * For a read-only route a module's pages depend on (a dropdown's data source)
 * on a router that is otherwise ADMIN-only: registered as a separate route
 * *before* the original one. A MANAGER with one of the modules is served by
 * this route; every other caller is handed to the original route via
 * `next("route")`, so its existing guards apply to them unchanged.
 */
export function managerReadAccess(...modules: StaffModule[]) {
  const guard = requireStaffModule(...modules);
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role.toUpperCase() !== "MANAGER") {
      next("route");
      return;
    }
    void guard(req, res, next);
  };
}
