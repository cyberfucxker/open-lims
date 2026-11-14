import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as homeFaqService from "../../services/homeFaq.service";

/** Patient-app twin of `homeFaq.controller.ts#list` — same service, active
 *  FAQs only, unpaginated (a Home FAQ accordion is meant to be short), and
 *  wrapped in the app's own response envelope. */
export const listHomeFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await homeFaqService.listActiveHomeFaqs();

  res.status(200).json(AppApiResponse.success("FAQs fetched successfully", faqs));
});
