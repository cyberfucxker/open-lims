import type { WebBannerPlacement } from "@prisma/client";

/** Admin-side shape for a website hero slide (Superadmin CMS > Web Banner).
 *  Deliberately carries the linked package's name/slug for the list UI but
 *  NO price — pricing is city-dependent and only resolved on the patient
 *  side (see `home.service.ts`), so an admin list showing one fixed price
 *  would be misleading in exactly the way this whole model exists to fix. */
export interface WebBannerDto {
  id: string;
  /** Which masthead this belongs to — the Home hero or a city landing page.
   *  See `WebBannerPlacement` in the schema for why the two lists are
   *  separate. */
  placement: WebBannerPlacement;
  badge: string | null;
  /** Null only on a HOME banner, which is artwork with no copy of its own. */
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  packageId: string | null;
  /** Denormalised for the admin list/form — null when no package is linked,
   *  or when the linked one was deleted (the FK nulls out, see the model). */
  packageName: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebBannerWriteData {
  placement: WebBannerPlacement;
  badge?: string | null;
  /** Required for CITY, ignored (and stored null) for HOME — enforced in
   *  `webBanner.validation.ts`, which is the only layer that can express a
   *  rule conditional on another field. */
  title?: string | null;
  subtitle?: string | null;
  imageUrl: string;
  packageId?: string | null;
  linkUrl?: string | null;
  isActive?: boolean;
}

export interface ListWebBannersParams {
  placement?: WebBannerPlacement;
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListWebBannersResult {
  rows: WebBannerDto[];
  total: number;
}
