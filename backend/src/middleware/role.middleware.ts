import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Restricts a route to a set of role names. Roles are looked up from the
 * database at seed/creation time and carried in the JWT as a plain string,
 * so authorizing a new role later — e.g. "LAB_TECHNICIAN" — is just
 * `requireRole("ADMIN", "LAB_TECHNICIAN")` on the route; nothing here or in
 * `authenticate()` needs to change.
 */
export function requireRole(...allowedRoles: string[]) {
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toUpperCase());

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }

    if (!normalizedAllowedRoles.includes(req.user.role.toUpperCase())) {
      next(ApiError.forbidden("You do not have permission to perform this action"));
      return;
    }

    next();
  };
}
