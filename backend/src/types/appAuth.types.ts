import type { AppPlatform } from "@prisma/client";

export interface AppAccessTokenPayload {
  sub: string;
  mobile: string;
}

export interface AuthenticatedAppUser {
  id: string;
  mobile: string;
  /** Resolved from the request's `platform` header — see `utils/platform.util.ts`. */
  platform: AppPlatform;
}
