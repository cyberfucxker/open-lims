import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { verifyAppAccessToken } from "../utils/appJwt.util";
import { resolvePlatform } from "../utils/platform.util";

/** Patient App equivalent of `auth.middleware.ts#authenticate` — verifies
 *  the Bearer token against the app's own JWT secret and attaches
 *  `req.appUser`. Entirely separate from staff `req.user`/`authenticate`. */
export function authenticateAppUser(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyAppAccessToken(token);
    req.appUser = { id: payload.sub, mobile: payload.mobile, platform: resolvePlatform(req) };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized("Access token has expired"));
      return;
    }
    next(ApiError.unauthorized("Invalid access token"));
  }
}

/** Guest-friendly variant for browse-only endpoints (Home, catalog lists) —
 *  attaches `req.appUser` when a valid Bearer token is present (so a logged-in
 *  patient still gets personalised bits like `is_added_to_cart`), but never
 *  rejects: no header, or an invalid/expired token, just proceeds with
 *  `req.appUser` left unset. Actions that require a real identity (add to
 *  cart, checkout, ...) still use `authenticateAppUser` — this is only for
 *  reads a guest should be able to make. */
export function attachAppUserIfPresent(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAppAccessToken(token);
    req.appUser = { id: payload.sub, mobile: payload.mobile, platform: resolvePlatform(req) };
  } catch {
    // Invalid/expired token on an optional-auth route: treat as guest rather
    // than rejecting — the client isn't asserting a session here, so there's
    // nothing to be "wrong" about.
  }
  next();
}
