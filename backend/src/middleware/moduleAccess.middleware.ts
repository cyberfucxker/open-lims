import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import * as organizationRepository from "../repositories/organization.repository";
import type { OrganizationModule } from "../types/organization.types";

/**
 * Gates a Collection Center portal route behind the calling Organization's
 * `enabledModules` toggle. No-ops for ADMIN (full access, same as every
 * other module). For an Organization-linked user, 403s unless their
 * Organization is active, has login enabled, and has this module turned on
 * — mirrors the `requireRole` shape but reads from the Organization row
 * instead of the JWT, since an ADMIN can flip these toggles without the
 * portal user needing to log in again.
 */
export function requireModuleAccess(moduleKey: OrganizationModule) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(ApiError.unauthorized("Authentication required"));
      return;
    }

    if (req.user.role.toUpperCase() === "ADMIN") {
      next();
      return;
    }

    if (!req.user.organizationId) {
      next(ApiError.forbidden("This account is not linked to an organization"));
      return;
    }

    try {
      const organization = await organizationRepository.findOrganizationByIdIncludingDeleted(
        req.user.organizationId,
      );

      const enabledModules =
        (organization?.enabledModules as unknown as OrganizationModule[]) ?? [];

      if (
        !organization ||
        organization.deletedAt ||
        !organization.active ||
        !organization.loginEnabled ||
        !enabledModules.includes(moduleKey)
      ) {
        next(ApiError.forbidden("You do not have permission to perform this action"));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
