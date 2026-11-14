import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as homeService from "../../services/app/home.service";

// Guest-browsable — `req.appUser` is only set when the caller sent a valid
// Bearer token (see `attachAppUserIfPresent`); a guest simply gets `null`.
export const getHome = asyncHandler(async (req: Request, res: Response) => {
  // `city_id` — same optional query param the catalogue routes take (see
  // `catalog.controller.ts#cityIdFromQuery`) — prices/flags the Popular
  // Tests/Packages for that city instead of the global default.
  const { city_id } = req.query as Record<string, string | undefined>;
  const home = await homeService.getHome(req.appUser?.id ?? null, city_id ?? null);
  res.status(200).json(AppApiResponse.success("Home data fetched successfully", home));
});
