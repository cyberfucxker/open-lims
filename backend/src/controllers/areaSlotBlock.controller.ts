import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as areaSlotBlockService from "../services/areaSlotBlock.service";
import type {
  AreaSlotBlockWriteData,
  BulkCreateAreaSlotBlocksData,
  BulkDeleteAreaSlotBlocksData,
  ListAreaSlotBlocksParams,
} from "../types/areaSlotBlock.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { areaId, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

  const params: ListAreaSlotBlocksParams = { areaId, dateFrom, dateTo };

  const rows = await areaSlotBlockService.listAreaSlotBlocks(params);

  res.status(200).json(ApiResponse.success("Area slot blocks retrieved successfully", rows));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AreaSlotBlockWriteData;

  const block = await areaSlotBlockService.createAreaSlotBlock(values);

  res.status(201).json(ApiResponse.success("Area slot blocked successfully", block));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await areaSlotBlockService.deleteAreaSlotBlock(req.params.id);

  res.status(200).json(ApiResponse.success("Area slot block removed successfully"));
});

export const createBulk = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as BulkCreateAreaSlotBlocksData;

  const blocks = await areaSlotBlockService.createAreaSlotBlocksBulk(values);

  res
    .status(201)
    .json(ApiResponse.success(`${blocks.length} slot(s) blocked successfully`, blocks));
});

export const removeBulk = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkDeleteAreaSlotBlocksData;

  const count = await areaSlotBlockService.deleteAreaSlotBlocksBulk(ids);

  res
    .status(200)
    .json(ApiResponse.success(`${count} area slot block(s) removed successfully`, { count }));
});
