import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { PackageCatalogItem } from "@/types";

export type OfferState = "LIVE" | "UPCOMING" | "EXPIRED" | "OFF";

/** `GET /api/v1/app/landing/:slug` — an ad landing page set up in Superadmin
 *  (CMS → Landing Pages). Packages come back only while the offer is LIVE,
 *  priced exactly like the rest of the website for the page's city. */
export interface OfferPage {
  slug: string;
  state: OfferState;
  title: string;
  city: { id: string; name: string; slug: string; is_active: boolean };
  desktop_banner_url: string | null;
  mobile_banner_url: string | null;
  valid_to: string;
  packages: PackageCatalogItem[];
}

export const landingApi = {
  async getOffer(slug: string): Promise<OfferPage> {
    const response = await httpClient.get<AppApiResponseBody<OfferPage>>(`/landing/${slug}`);
    return response.data.data as OfferPage;
  },
};
