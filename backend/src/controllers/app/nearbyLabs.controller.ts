import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as nearbyLabsService from "../../services/app/nearbyLabs.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { lat, long } = req.query as { lat?: string; long?: string };

  const centers = await nearbyLabsService.listCenters(
    lat !== undefined ? Number(lat) : undefined,
    long !== undefined ? Number(long) : undefined,
  );

  res.status(200).json(AppApiResponse.success("Centers fetched successfully", centers));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const center = await nearbyLabsService.getCenterDetail(req.params.id);
  res.status(200).json(AppApiResponse.success("Center details fetched successfully", center));
});
