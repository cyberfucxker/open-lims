import type { Request } from "express";
import type { AppPlatform } from "@prisma/client";

/** Reads the Flutter app's `platform` header (`android`/`ios`) — anything
 *  missing or unrecognized (including a genuine web client) falls back to
 *  WEB, matching the Superadmin display convention. */
export function resolvePlatform(req: Request): AppPlatform {
  const header = req.headers.platform;
  const value = (Array.isArray(header) ? header[0] : header)?.toLowerCase();

  if (value === "android") return "ANDROID";
  if (value === "ios") return "IOS";
  return "WEB";
}
