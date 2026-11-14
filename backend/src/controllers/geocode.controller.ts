import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as geocodeService from "../services/app/geocode.service";

/** Admin-side twin of `app/geocode.controller.ts` — the SAME Nominatim proxy
 *  service (there's only one, and only one place that owns the required
 *  Referer/User-Agent headers), re-wrapped in the internal `ApiResponse`
 *  envelope (`{success,…}`) instead of the patient app's `AppApiResponse`
 *  (`{status,…}`). Backs the Diagnostic Center form's map picker, which needs
 *  the same "search a place / resolve a pin" pair the patient app's address
 *  picker uses. */

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as { q: string };
  const results = await geocodeService.searchAddress(q);

  res.status(200).json(ApiResponse.success("Search results fetched successfully", results));
});

export const reverse = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lon } = req.query as { lat: string; lon: string };
  const result = await geocodeService.reverseGeocode(Number(lat), Number(lon));

  res.status(200).json(ApiResponse.success("Address resolved successfully", result));
});
