import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as slotAvailabilitySettingsService from "../services/slotAvailabilitySettings.service";
import type { SlotAvailabilitySettingsWriteData } from "../repositories/slotAvailabilitySettings.repository";

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await slotAvailabilitySettingsService.getSlotAvailabilitySettings();

  res
    .status(200)
    .json(ApiResponse.success("Slot availability settings retrieved successfully", settings));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as SlotAvailabilitySettingsWriteData;

  const settings = await slotAvailabilitySettingsService.updateSlotAvailabilitySettings(values);

  res
    .status(200)
    .json(ApiResponse.success("Slot availability settings updated successfully", settings));
});
