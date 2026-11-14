import type { PriceListItemType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as priceListRepository from "../repositories/priceList.repository";
import { toPriceListDto, type PriceListWriteInput } from "../repositories/priceList.repository";
import { assertItemsExist, loadPriceableCatalog, toItemDto } from "./priceListCatalog.util";
import type {
  ListPriceListsParams,
  ListPriceListsResult,
  PriceListDto,
  PriceListItemDto,
  PriceListItemWriteData,
  PriceListItemsViewDto,
  PriceListItemsViewWriteData,
} from "../types/priceList.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Price list not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A price list with this name already exists");
      }
    }
    throw error;
  }
}

export async function listPriceLists(params: ListPriceListsParams): Promise<ListPriceListsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await priceListRepository.listPriceLists({
    search: params.search,
    active: params.active,
    ownership: params.ownership,
    includeDeleted: params.includeDeleted === "true",
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toPriceListDto), total };
}

export async function getPriceList(id: string): Promise<PriceListDto> {
  const priceList = await priceListRepository.findPriceListById(id);
  if (!priceList) {
    throw ApiError.notFound("Price list not found");
  }
  return toPriceListDto(priceList);
}

export async function createPriceList(values: PriceListWriteInput): Promise<PriceListDto> {
  const priceList = await withTranslatedErrors(() => priceListRepository.createPriceList(values));
  return toPriceListDto(priceList);
}

export async function updatePriceList(
  id: string,
  values: PriceListWriteInput,
): Promise<PriceListDto> {
  const priceList = await withTranslatedErrors(() =>
    priceListRepository.updatePriceList(id, values),
  );
  return toPriceListDto(priceList);
}

export async function deletePriceList(id: string): Promise<void> {
  await withTranslatedErrors(() => priceListRepository.softDeletePriceList(id));
}

export async function restorePriceList(id: string): Promise<PriceListDto> {
  const priceList = await withTranslatedErrors(() => priceListRepository.restorePriceList(id));
  return toPriceListDto(priceList);
}

export async function setPriceListStatus(id: string, active: boolean): Promise<PriceListDto> {
  const priceList = await withTranslatedErrors(() =>
    priceListRepository.setPriceListStatus(id, active),
  );
  return toPriceListDto(priceList);
}

export async function getPriceListItems(priceListId: string): Promise<PriceListItemDto[]> {
  await getPriceList(priceListId);
  return priceListRepository.listItemsForPriceList(priceListId);
}

export async function setPriceListItems(
  priceListId: string,
  items: PriceListItemWriteData[],
): Promise<PriceListItemDto[]> {
  await getPriceList(priceListId);
  await priceListRepository.replacePriceListItems(priceListId, items);
  return priceListRepository.listItemsForPriceList(priceListId);
}

// ---------------------------------------------------------------------------
// Full-catalogue pricing view — the admin-facing twin of
// `franchise.service.ts#getOwnPriceList`/`setOwnPriceListItems`, addressed by
// price-list id (any list — template or clone) rather than by the caller's
// own organization. Backs the superadmin price editor page, which needs
// TEST+PACKAGE+PARAMETER together, unlike the TEST-only `:id/items` endpoint
// above (kept unchanged for the older sheet).
// ---------------------------------------------------------------------------

export async function getPriceListItemsView(priceListId: string): Promise<PriceListItemsViewDto> {
  const priceList = await getPriceList(priceListId);

  const [catalog, overrideRows] = await Promise.all([
    loadPriceableCatalog(),
    priceListRepository.listAllItemsForPriceList(priceListId),
  ]);
  const overrides = new Map(
    overrideRows.map((row) => [
      `${row.itemType}:${row.itemId}`,
      { price: Number(row.price), isOffered: row.isOffered },
    ]),
  );

  const build = (itemType: PriceListItemType) =>
    catalog[itemType].map((row) =>
      toItemDto(itemType, row, overrides.get(`${itemType}:${row.id}`)),
    );

  return {
    id: priceList.id,
    name: priceList.name,
    itemsByType: {
      TEST: build("TEST"),
      PACKAGE: build("PACKAGE"),
      PARAMETER: build("PARAMETER"),
    },
  };
}

/** Replaces the FULL override set (all three item types) for any price list.
 *  No ownership check here — unlike the franchise self-service editor, an
 *  admin is allowed to edit any list, template or clone, by id. */
export async function setPriceListItemsView(
  priceListId: string,
  items: PriceListItemsViewWriteData[],
): Promise<PriceListItemsViewDto> {
  await getPriceList(priceListId);
  await assertItemsExist(items);
  await priceListRepository.replaceAllItemsForPriceList(priceListId, items);
  return getPriceListItemsView(priceListId);
}
