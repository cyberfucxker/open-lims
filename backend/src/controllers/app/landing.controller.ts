import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { getPublicLandingPage } from "../../services/landingPage.service";

/** Guest-browsable — ad traffic lands here logged out. A logged-in visitor
 *  additionally gets each package's `is_added_to_cart`. */
export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const data = await getPublicLandingPage(req.params.slug, req.appUser?.id ?? null);
  res.status(200).json(AppApiResponse.success("Offer fetched successfully", data));
});
