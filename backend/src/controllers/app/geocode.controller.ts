import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as geocodeService from "../../services/app/geocode.service";

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as { q: string };
  const results = await geocodeService.searchAddress(q);
  res.status(200).json(AppApiResponse.success("Search results fetched", results));
});

export const reverse = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lon } = req.query as { lat: string; lon: string };
  const result = await geocodeService.reverseGeocode(Number(lat), Number(lon));
  res.status(200).json(AppApiResponse.success("Address resolved", result));
});
