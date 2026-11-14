import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as slotBlockService from "../services/slotBlock.service";
import type {
  BulkCreateSlotBlocksData,
  BulkDeleteSlotBlocksData,
  ListSlotBlocksParams,
  SlotBlockWriteData,
} from "../types/slotBlock.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { cityId, dateFrom, dateTo } = req.query as Record<string, string | undefined>;

  const params: ListSlotBlocksParams = { cityId, dateFrom, dateTo };

  const rows = await slotBlockService.listSlotBlocks(params);

  res.status(200).json(ApiResponse.success("Slot blocks retrieved successfully", rows));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SlotBlockWriteData;

  const block = await slotBlockService.createSlotBlock(values);

  res.status(201).json(ApiResponse.success("Slot blocked successfully", block));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await slotBlockService.deleteSlotBlock(req.params.id);

  res.status(200).json(ApiResponse.success("Slot block removed successfully"));
});

export const createBulk = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as BulkCreateSlotBlocksData;

  const blocks = await slotBlockService.createSlotBlocksBulk(values);

  res
    .status(201)
    .json(ApiResponse.success(`${blocks.length} slot(s) blocked successfully`, blocks));
});

export const removeBulk = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkDeleteSlotBlocksData;

  const count = await slotBlockService.deleteSlotBlocksBulk(ids);

  res
    .status(200)
    .json(ApiResponse.success(`${count} slot block(s) removed successfully`, { count }));
});
