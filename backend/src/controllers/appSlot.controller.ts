import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as appSlotService from "../services/appSlot.service";
import type { AppSlotWriteData, BulkApplySlotsData } from "../types/appSlot.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, centerId, isBlocked } = req.query as Record<string, string | undefined>;

  const result = await appSlotService.listAppSlots({
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    centerId,
    isBlocked,
  });

  res.status(200).json(ApiResponse.success("Slots retrieved successfully", result));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AppSlotWriteData;

  const slot = await appSlotService.createAppSlot(values);

  res.status(201).json(ApiResponse.success("Slot created successfully", slot));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as AppSlotWriteData;

  const slot = await appSlotService.updateAppSlot(req.params.id, values);

  res.status(200).json(ApiResponse.success("Slot updated successfully", slot));
});

export const setBlocked = asyncHandler(async (req: Request, res: Response) => {
  const { isBlocked } = req.body as { isBlocked: boolean };

  const slot = await appSlotService.setAppSlotBlocked(req.params.id, isBlocked);

  res.status(200).json(ApiResponse.success("Slot status updated successfully", slot));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await appSlotService.deleteAppSlot(req.params.id);

  res.status(200).json(ApiResponse.success("Slot deleted successfully"));
});

export const bulkApply = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as BulkApplySlotsData;

  const result = await appSlotService.bulkApplySlots(values);

  res.status(200).json(ApiResponse.success("Slots applied successfully", result));
});
