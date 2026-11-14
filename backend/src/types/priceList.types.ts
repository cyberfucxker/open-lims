import type { PriceListItemType } from "@prisma/client";
import type { ListMasterParams } from "./master.types";

export interface PriceListDto {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListWriteData {
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface ListPriceListsResult {
  rows: PriceListDto[];
  total: number;
}

export type ListPriceListsParams = ListMasterParams & {
  ownership?: "template" | "franchise";
};

export interface PriceListItemDto {
  testId: string;
  testName: string;
  departmentName: string;
  catalogPrice: number;
  overridePrice: number | null;
}

export interface PriceListItemWriteData {
  testId: string;
  price: number;
}

// ---------------------------------------------------------------------------
// Full-catalogue pricing view — TEST + PACKAGE + PARAMETER together, unlike
// the TEST-only `PriceListItemDto` above (kept as-is for the older sheet).
// Same shape as `FranchisePriceListDto` in `franchise.types.ts`: this is the
// admin-facing twin, addressed by price-list id instead of by the caller's
// own organization.
// ---------------------------------------------------------------------------

export interface PriceListItemsViewItemDto {
  itemType: PriceListItemType;
  itemId: string;
  name: string;
  /** Catalogue selling price — what applies with no override. */
  catalogPrice: number;
  /** This price list's override for the item, or null when unset. */
  overridePrice: number | null;
  effectivePrice: number;
  /** Whether this item is offered under this price list — false excludes it
   *  from a city's catalogue if this list is that city's parent franchise's
   *  (see `City.parentOrganizationId`). Defaults to true. */
  isOffered: boolean;
}

export interface PriceListItemsViewDto {
  id: string;
  name: string;
  itemsByType: {
    TEST: PriceListItemsViewItemDto[];
    PACKAGE: PriceListItemsViewItemDto[];
    PARAMETER: PriceListItemsViewItemDto[];
  };
}

export interface PriceListItemsViewWriteData {
  itemType: PriceListItemType;
  itemId: string;
  price: number;
  isOffered: boolean;
}
