import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AppAccessTokenPayload } from "../types/appAuth.types";

/** Separate secret from `jwt.util.ts`'s staff tokens — a leaked patient
 *  token must never verify as, or be confused with, a staff session. */
export function signAppAccessToken(payload: AppAccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_APP_ACCESS_SECRET, {
    expiresIn: env.JWT_APP_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAppAccessToken(token: string): AppAccessTokenPayload {
  return jwt.verify(token, env.JWT_APP_ACCESS_SECRET) as AppAccessTokenPayload;
}
