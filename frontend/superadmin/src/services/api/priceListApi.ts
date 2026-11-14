import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface PriceList {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListFormValues {
  name: string;
  description?: string | null;
  active: boolean;
}

export interface ListPriceListsParams {
  search?: string;
  active?: "true" | "false" | "all";
  includeDeleted?: boolean;
  /** Admin templates vs a franchise's private clones. Omitted = both. */
  ownership?: "template" | "franchise";
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListPriceListsResult {
  rows: PriceList[];
  total: number;
}

export async function fetchPriceLists(
  params: ListPriceListsParams = {},
): Promise<ListPriceListsResult> {
  const response = await httpClient.get<ApiResponseBody<ListPriceListsResult>>("/price-lists", {
    params: {
      search: params.search || undefined,
      active: params.active && params.active !== "all" ? params.active : undefined,
      includeDeleted: params.includeDeleted ? "true" : undefined,
      ownership: params.ownership,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
  return response.data.data as ListPriceListsResult;
}

export async function createPriceListApi(values: PriceListFormValues): Promise<PriceList> {
  const response = await httpClient.post<ApiResponseBody<PriceList>>("/price-lists", values);
  return response.data.data as PriceList;
}

export async function updatePriceListApi(
  id: string,
  values: PriceListFormValues,
): Promise<PriceList> {
  const response = await httpClient.put<ApiResponseBody<PriceList>>(`/price-lists/${id}`, values);
  return response.data.data as PriceList;
}

export async function deletePriceListApi(id: string): Promise<void> {
  await httpClient.delete(`/price-lists/${id}`, { suppressErrorToast: true });
}

export async function restorePriceListApi(id: string): Promise<PriceList> {
  const response = await httpClient.patch<ApiResponseBody<PriceList>>(`/price-lists/${id}/restore`);
  return response.data.data as PriceList;
}

export async function setPriceListStatusApi(id: string, active: boolean): Promise<PriceList> {
  const response = await httpClient.patch<ApiResponseBody<PriceList>>(`/price-lists/${id}/status`, {
    active,
  });
  return response.data.data as PriceList;
}

// --- Full-catalogue pricing (TEST + PACKAGE + PARAMETER) --------------------
//
// The item-level editor for ANY price list by id — template or a franchise's
// clone. Distinct from the row-level CRUD above (name/description/active
// only) and from the franchise portal's `franchiseApi.ts` (which resolves
// "my own" list from the session instead of taking an id).

export type PriceListItemType = "TEST" | "PACKAGE" | "PARAMETER";

export interface PriceListPricingItem {
  itemType: PriceListItemType;
  itemId: string;
  name: string;
  /** Catalogue selling price — what applies with no override. */
  catalogPrice: number;
  /** This price list's override for the item, or null when unset. */
  overridePrice: number | null;
  effectivePrice: number;
  /** Whether this item is offered under this price list — false excludes it
   *  from a city's catalogue if this list is that city's parent franchise's.
   *  Defaults to true. */
  isOffered: boolean;
  /** A parameter — either a PARAMETER row, or a TEST that is really a single
   *  parameter made bookable. Editors list these under "Parameters"; a TEST
   *  one is still saved as `TEST`. */
  isParameter: boolean;
}

/** Regroups `itemsByType` into the editor's tabs: parameter-backed Tests move
 *  from "Tests" to "Parameters". Only the grouping changes — each item keeps
 *  its own `itemType`, which is what gets saved. */
export function groupItemsForEditor<
  T extends { itemType: PriceListItemType; isParameter: boolean; name: string },
>(itemsByType: Record<PriceListItemType, T[]>): Record<PriceListItemType, T[]> {
  return {
    TEST: itemsByType.TEST.filter((i) => !i.isParameter),
    PACKAGE: itemsByType.PACKAGE,
    PARAMETER: [...itemsByType.PARAMETER, ...itemsByType.TEST.filter((i) => i.isParameter)].sort(
      (a, b) => a.name.localeCompare(b.name),
    ),
  };
}

export interface PriceListPricing {
  id: string;
  name: string;
  itemsByType: Record<PriceListItemType, PriceListPricingItem[]>;
}

export async function fetchPriceListPricing(id: string): Promise<PriceListPricing> {
  const response = await httpClient.get<ApiResponseBody<PriceListPricing>>(
    `/price-lists/${id}/pricing`,
  );
  return response.data.data as PriceListPricing;
}

export async function savePriceListPricing(
  id: string,
  items: { itemType: PriceListItemType; itemId: string; price: number; isOffered: boolean }[],
): Promise<PriceListPricing> {
  const response = await httpClient.put<ApiResponseBody<PriceListPricing>>(
    `/price-lists/${id}/pricing`,
    { items },
  );
  return response.data.data as PriceListPricing;
}
