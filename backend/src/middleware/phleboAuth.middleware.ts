import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { verifyPhleboAccessToken } from "../utils/phleboJwt.util";

/** Phlebo App equivalent of `appAuth.middleware.ts#authenticateAppUser` —
 *  verifies the Bearer token against the phlebo's own JWT secret and
 *  attaches `req.phlebo`. Entirely separate from `req.user`/`req.appUser`. */
export function authenticatePhlebo(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyPhleboAccessToken(token);
    req.phlebo = { id: payload.sub, mobile: payload.mobile };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized("Access token has expired"));
      return;
    }
    next(ApiError.unauthorized("Invalid access token"));
  }
}
