import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt.util";

/**
 * Verifies the `Authorization: Bearer <accessToken>` header and attaches
 * `req.user`. Does not touch the database — the JWT signature and expiry
 * are the only source of truth for a request's identity, which is what
 * keeps access-token checks fast on every request.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      organizationId: payload.organizationId,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized("Access token has expired"));
      return;
    }
    next(ApiError.unauthorized("Invalid access token"));
  }
}
