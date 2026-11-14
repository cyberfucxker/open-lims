import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type {
  AddToCartRequest,
  PackageCatalogItem,
  PackageDetail,
  PaginatedCatalog,
  TestCatalogItem,
  TestDetail,
} from "@/types";

/** Backend default is already 20 (see `catalog.service.ts#paginate`) — kept
 *  here too so a caller that omits `pageSize` gets a request that says so
 *  explicitly, rather than relying on both ends agreeing on an implicit
 *  default forever. */
const DEFAULT_PAGE_SIZE = 20;

/** Real replacements for `mocks/api/catalogApi.ts` — same response/request
 *  shapes field-for-field (`GET /api/v1/app/user/tests`, `/user/packages`,
 *  `/tests/:id/details`, `/packages/:id/details`, `POST /user/add-cart`), so
 *  callers need no changes beyond the import. */
export const catalogApi = {
  /** `cityId` scopes the list/prices to that city's parent franchise, if the
   *  city has one set — see `useCityStore`. Omit for the full global
   *  catalogue (no city picked yet, or a city with no parent).
   *  `categoryId` is the Home screen's lifestyle/condition tile id
   *  (`AppCategory.id`, same one `getHome()`'s `categories[]` carries) —
   *  omit for every category. `page`/`pageSize` — 20 per page by default;
   *  this list also includes every directly-bookable Parameter alongside
   *  curated Tests (see the backend route's doc-comment), so page counts run
   *  well past what a hand-curated Tests list alone would suggest. */
  async listTests(
    cityId?: string | null,
    categoryId?: string | null,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search?: string | null,
  ): Promise<PaginatedCatalog<TestCatalogItem>> {
    const response = await httpClient.get<AppApiResponseBody<PaginatedCatalog<TestCatalogItem>>>(
      "/user/tests",
      {
        params: {
          city_id: cityId || undefined,
          category_id: categoryId || undefined,
          page,
          page_size: pageSize,
          search: search || undefined,
        },
      },
    );
    return response.data.data ?? { items: [], total: 0, page, page_size: pageSize, total_pages: 1 };
  },

  async listPackages(
    cityId?: string | null,
    categoryId?: string | null,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search?: string | null,
  ): Promise<PaginatedCatalog<PackageCatalogItem>> {
    const response = await httpClient.get<AppApiResponseBody<PaginatedCatalog<PackageCatalogItem>>>(
      "/user/packages",
      {
        params: {
          city_id: cityId || undefined,
          category_id: categoryId || undefined,
          page,
          page_size: pageSize,
          search: search || undefined,
        },
      },
    );
    return response.data.data ?? { items: [], total: 0, page, page_size: pageSize, total_pages: 1 };
  },

  /** Home page's search-as-you-type dropdown — top 5 Tests + top 5 Packages
   *  matching `query`. `tests` already includes every directly-bookable,
   *  curated `isCommonlyUsed` Parameter alongside real Tests, exactly like
   *  `listTests` above (same backend query) — nothing extra to filter on
   *  this end. */
  async searchSuggestions(
    query: string,
    cityId?: string | null,
  ): Promise<{ tests: TestCatalogItem[]; packages: PackageCatalogItem[] }> {
    const response = await httpClient.get<
      AppApiResponseBody<{ tests: TestCatalogItem[]; packages: PackageCatalogItem[] }>
    >("/user/search-suggestions", {
      params: { q: query, city_id: cityId || undefined },
    });
    return response.data.data ?? { tests: [], packages: [] };
  },

  async getTestDetail(id: string): Promise<TestDetail> {
    const response = await httpClient.get<AppApiResponseBody<TestDetail>>(`/tests/${id}/details`);
    return response.data.data as TestDetail;
  },

  async getPackageDetail(id: string): Promise<PackageDetail> {
    const response = await httpClient.get<AppApiResponseBody<PackageDetail>>(
      `/packages/${id}/details`,
    );
    return response.data.data as PackageDetail;
  },

  /** Backs the SEO landing route `/{citySlug}/tests/{testSlug}` — same shape
   *  as `getTestDetail`, plus `city`, priced for that city. */
  async getTestDetailBySlug(citySlug: string, testSlug: string): Promise<TestDetail> {
    const response = await httpClient.get<AppApiResponseBody<TestDetail>>(
      `/city/${citySlug}/tests/${testSlug}/details`,
    );
    return response.data.data as TestDetail;
  },

  /** Backs the SEO landing route `/{citySlug}/packages/{packageSlug}`. */
  async getPackageDetailBySlug(citySlug: string, packageSlug: string): Promise<PackageDetail> {
    const response = await httpClient.get<AppApiResponseBody<PackageDetail>>(
      `/city/${citySlug}/packages/${packageSlug}/details`,
    );
    return response.data.data as PackageDetail;
  },

  async addToCart(payload: AddToCartRequest): Promise<null> {
    await httpClient.post("/user/add-cart", payload);
    return null;
  },
};
