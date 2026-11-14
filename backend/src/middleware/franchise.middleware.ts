import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import * as organizationRepository from "../repositories/organization.repository";

/**
 * Gates every `/franchise/*` route and resolves the caller's scope.
 *
 * Two things happen here, and they are deliberately not split:
 *
 *  1. Authorization — the caller must hold the FRANCHISE role AND be linked to
 *     an organization that is live (active, not soft-deleted, login enabled).
 *     Read from the database rather than the JWT so an admin deactivating a
 *     franchise locks it out immediately, without waiting for the token to
 *     expire. Same reasoning as `moduleAccess.middleware.ts`.
 *
 *  2. Scope — `req.franchise` is populated with the organization id and its
 *     price list. Every franchise handler reads the scope from HERE and never
 *     from a request body, query string or path parameter. That is what makes
 *     cross-franchise access structurally impossible rather than a rule each
 *     handler has to remember: there is no code path where a client-supplied
 *     organization id reaches a query.
 *
 * ADMIN is deliberately NOT waved through, unlike `requireModuleAccess`. These
 * routes answer "my orders", "my prices" — questions an admin session has no
 * answer to. Admins use the equivalent unscoped `/organizations`, `/app-orders`
 * and `/price-lists` routes instead.
 */
export interface FranchiseScope {
  organizationId: string;
  /** The franchise's own private price list clone. Null when none has been
   *  assigned yet — pricing then falls back to catalogue prices. */
  priceListId: string | null;
  name: string;
  code: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      franchise?: FranchiseScope;
    }
  }
}

export async function requireFranchise(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(ApiError.unauthorized("Authentication required"));
    return;
  }

  if (req.user.role.toUpperCase() !== "FRANCHISE") {
    next(ApiError.forbidden("You do not have permission to perform this action"));
    return;
  }

  if (!req.user.organizationId) {
    next(ApiError.forbidden("This account is not linked to a franchise"));
    return;
  }

  try {
    const organization = await organizationRepository.findOrganizationByIdIncludingDeleted(
      req.user.organizationId,
    );

    if (
      !organization ||
      organization.deletedAt ||
      !organization.active ||
      !organization.loginEnabled
    ) {
      next(ApiError.forbidden("This franchise account is no longer active"));
      return;
    }

    req.franchise = {
      organizationId: organization.id,
      priceListId: organization.priceListId,
      name: organization.name,
      code: organization.code,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/** Narrows `req.franchise` for handlers, which run only behind the middleware
 *  above but cannot express that in the type system. */
export function franchiseScope(req: Request): FranchiseScope {
  if (!req.franchise) {
    throw ApiError.forbidden("This account is not linked to a franchise");
  }
  return req.franchise;
}
