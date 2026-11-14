import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as liveCapacityService from "../services/liveCapacity.service";

export const get = asyncHandler(async (req: Request, res: Response) => {
  const { cityId, date } = req.query as Record<string, string>;

  const result = await liveCapacityService.getLiveCapacity(cityId, date);

  res.status(200).json(ApiResponse.success("Live capacity retrieved successfully", result));
});
