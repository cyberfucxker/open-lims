import type { PriceListItemType } from "@prisma/client";
import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as priceListService from "../services/priceList.service";
import type { ListPriceListsParams, PriceListWriteData } from "../types/priceList.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, ownership, includeDeleted, sortBy, sortDir, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListPriceListsParams = {
    search,
    active,
    ownership: ownership as ListPriceListsParams["ownership"],
    includeDeleted,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await priceListService.listPriceLists(params);

  res.status(200).json(ApiResponse.success("Price lists retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const priceList = await priceListService.getPriceList(req.params.id);

  res.status(200).json(ApiResponse.success("Price list retrieved successfully", priceList));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PriceListWriteData;

  const priceList = await priceListService.createPriceList(values);

  res.status(201).json(ApiResponse.success("Price list created successfully", priceList));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PriceListWriteData;

  const priceList = await priceListService.updatePriceList(req.params.id, values);

  res.status(200).json(ApiResponse.success("Price list updated successfully", priceList));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await priceListService.deletePriceList(req.params.id);

  res.status(200).json(ApiResponse.success("Price list deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const priceList = await priceListService.restorePriceList(req.params.id);

  res.status(200).json(ApiResponse.success("Price list restored successfully", priceList));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const priceList = await priceListService.setPriceListStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Price list status updated successfully", priceList));
});

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await priceListService.getPriceListItems(req.params.id);

  res.status(200).json(ApiResponse.success("Price list items retrieved successfully", items));
});

export const setItems = asyncHandler(async (req: Request, res: Response) => {
  const items = req.body as { testId: string; price: number }[];

  const result = await priceListService.setPriceListItems(req.params.id, items);

  res.status(200).json(ApiResponse.success("Price list items updated successfully", result));
});

export const getItemsView = asyncHandler(async (req: Request, res: Response) => {
  const view = await priceListService.getPriceListItemsView(req.params.id);

  res.status(200).json(ApiResponse.success("Price list pricing retrieved successfully", view));
});

export const setItemsView = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as {
    items: { itemType: PriceListItemType; itemId: string; price: number; isOffered?: boolean }[];
  };

  // Old clients that don't yet send `isOffered` mean "offered" — same default
  // as an absent row (see `PriceListItem.isOffered`'s doc-comment).
  const view = await priceListService.setPriceListItemsView(
    req.params.id,
    items.map((item) => ({ ...item, isOffered: item.isOffered ?? true })),
  );

  res.status(200).json(ApiResponse.success("Price list pricing updated successfully", view));
});
