import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { PhleboAccessTokenPayload } from "../types/phleboAuth.types";

/** Separate secret from `jwt.util.ts` (staff) and `appJwt.util.ts` (patient) —
 *  a leaked phlebo token must never verify as either of those sessions. */
export function signPhleboAccessToken(payload: PhleboAccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_PHLEBO_ACCESS_SECRET, {
    expiresIn: env.JWT_PHLEBO_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyPhleboAccessToken(token: string): PhleboAccessTokenPayload {
  return jwt.verify(token, env.JWT_PHLEBO_ACCESS_SECRET) as PhleboAccessTokenPayload;
}
