import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as catalogService from "../../services/app/catalog.service";
import type { AddToCartInput, PaginatedResult } from "../../services/app/catalog.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

/** `city_id` is how a patient's selected city (see the app's city picker)
 *  reaches the catalogue — optional, since a guest may not have picked one
 *  yet. Whatever it resolves to (or doesn't) is `catalogService`'s call. */
function cityIdFromQuery(req: Request): string | null {
  const { city_id } = req.query as Record<string, string | undefined>;
  return city_id ?? null;
}

/** `category_id` is the Home screen's "Test Based on Lifestyle & Conditions"
 *  tile id (`AppCategory.id`) — optional, so the unfiltered catalogue is
 *  still the default. */
function categoryIdFromQuery(req: Request): string | null {
  const { category_id } = req.query as Record<string, string | undefined>;
  return category_id ?? null;
}

/** `page`/`page_size` — optional, defaulting to page 1 of 20 (see
 *  `catalogService.paginate`'s doc-comment). Validated as positive integers
 *  by `listCatalogValidation`, so a bare parse here is safe. */
function paginationFromQuery(req: Request) {
  const { page, page_size } = req.query as Record<string, string | undefined>;
  return {
    page: page ? Number(page) : null,
    pageSize: page_size ? Number(page_size) : null,
  };
}

/** `search` matches by name (and, for tests, short name) — server-side now
 *  that the list itself is paginated, so a search box in the app can find a
 *  match beyond whatever page happens to be loaded. */
function searchFromQuery(req: Request): string | null {
  const { search } = req.query as Record<string, string | undefined>;
  return search?.trim() || null;
}

/** Every other App API field is snake_case (`test_name`, `is_added_to_cart`,
 *  …) — this app namespace never relies on an automatic case transform, each
 *  DTO just spells its own keys that way. `PaginatedResult` is shared,
 *  TS-facing, and deliberately camelCase like the rest of the codebase, so
 *  the snake_case conversion happens once, right here, at the response
 *  boundary. */
function toSnakeCasePage<T>(result: PaginatedResult<T>) {
  return {
    items: result.items,
    total: result.total,
    page: result.page,
    page_size: result.pageSize,
    total_pages: result.totalPages,
  };
}

// Guest-browsable — `req.appUser` is only set when the caller sent a valid
// Bearer token (see `attachAppUserIfPresent`); a guest simply gets `null`.
export const listTests = asyncHandler(async (req: Request, res: Response) => {
  const result = await catalogService.listTests(
    req.appUser?.id ?? null,
    cityIdFromQuery(req),
    categoryIdFromQuery(req),
    paginationFromQuery(req),
    searchFromQuery(req),
  );
  res
    .status(200)
    .json(AppApiResponse.success("Tests fetched successfully", toSnakeCasePage(result)));
});

export const listPackages = asyncHandler(async (req: Request, res: Response) => {
  const result = await catalogService.listPackages(
    req.appUser?.id ?? null,
    cityIdFromQuery(req),
    categoryIdFromQuery(req),
    paginationFromQuery(req),
    searchFromQuery(req),
  );
  res
    .status(200)
    .json(AppApiResponse.success("Packages fetched successfully", toSnakeCasePage(result)));
});

// Guest-browsable, same reasoning as listTests/listPackages above. `q` is
// required non-empty by `searchSuggestionsValidation` — this endpoint exists
// specifically for a live search-as-you-type dropdown, not a browsable list.
export const searchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as Record<string, string | undefined>;
  const result = await catalogService.searchSuggestions(
    req.appUser?.id ?? null,
    cityIdFromQuery(req),
    (q ?? "").trim(),
  );
  res.status(200).json(AppApiResponse.success("Search suggestions fetched successfully", result));
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as AddToCartInput;

  const result = await catalogService.addToCart(appUser.id, input);

  res.status(200).json(AppApiResponse.success("Item added to cart successfully", result));
});
