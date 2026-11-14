import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as masterService from "../../services/app/master.service";

export const listCities = asyncHandler(async (req: Request, res: Response) => {
  const { state_id, search, featured } = req.query as Record<string, string | undefined>;

  const cities = await masterService.listCities({
    stateId: state_id,
    search,
    featured: featured === "true" ? true : undefined,
  });

  res.status(200).json(AppApiResponse.success("Cities fetched successfully", cities));
});
