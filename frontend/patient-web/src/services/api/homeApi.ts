import { httpClient, resolveUploadUrl } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { HomeResult } from "@/types";

/** Real replacement for `mocks/api/catalogApi.ts#getHome` — same response
 *  shape (`GET /api/v1/app/user/home` mirrors `HomeResult` field-for-field),
 *  so `HomePage.tsx` and its section components need no changes beyond the
 *  import. Everything else on the home page (add-to-cart, categories nav,
 *  etc.) still runs through the mock catalog API for now.
 *
 *  `cityId` — the patient's selected city (same param `catalogApi.ts`'s
 *  `listTests`/`listPackages` take) — prices the Popular Tests/Packages for
 *  that city instead of the global default; optional, since a guest may not
 *  have picked one yet. */
export async function getHome(cityId?: string | null): Promise<HomeResult> {
  const response = await httpClient.get<AppApiResponseBody<HomeResult>>("/user/home", {
    params: cityId ? { city_id: cityId } : undefined,
  });
  const home = response.data.data as HomeResult;

  // Banner/category images come back as backend-relative `/uploads/...`
  // paths — resolve to absolute URLs so <img> renders them correctly.
  return {
    ...home,
    app_banners: home.app_banners.map((banner) => ({
      ...banner,
      image: resolveUploadUrl(banner.image),
    })),
    home_banners: home.home_banners.map((banner) => ({
      ...banner,
      image: resolveUploadUrl(banner.image),
    })),
    web_banners: home.web_banners.map((banner) => ({
      ...banner,
      image: resolveUploadUrl(banner.image),
    })),
    categories: home.categories.map((category) => ({
      ...category,
      image: resolveUploadUrl(category.image),
      thumbnail: resolveUploadUrl(category.thumbnail),
    })),
  };
}
