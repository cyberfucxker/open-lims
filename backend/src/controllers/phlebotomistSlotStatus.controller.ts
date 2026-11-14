import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as phlebotomistSlotStatusService from "../services/phlebotomistSlotStatus.service";

export const get = asyncHandler(async (req: Request, res: Response) => {
  const { cityId, date } = req.query as Record<string, string>;

  const result = await phlebotomistSlotStatusService.getPhlebotomistSlotStatus(cityId, date);

  res
    .status(200)
    .json(ApiResponse.success("Phlebotomist slot status retrieved successfully", result));
});
