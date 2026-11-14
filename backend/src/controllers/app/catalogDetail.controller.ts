import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as catalogDetailService from "../../services/catalogDetail.service";

/** Patient-app twin of `test.controller.ts#getDetails` /
 *  `package.controller.ts#getDetails`. Same service call, so the two surfaces
 *  can't drift; the differences are only the wrapper and the scope:
 *
 *  - `AppApiResponse` instead of `ApiResponse` (the app's envelope).
 *  - `activeOnly: true`, so a retired Test or an inactive/soft-deleted Package
 *    reads as 404 to a patient even though an admin can still preview it.
 *
 *  Nothing is stripped from the payload, because `catalogDetail.types.ts` holds
 *  no admin-only fields by design — see its doc-comment. */

export const getTestDetails = asyncHandler(async (req: Request, res: Response) => {
  const detail = await catalogDetailService.getTestDetail(
    { id: req.params.id },
    { activeOnly: true },
  );

  res.status(200).json(
    AppApiResponse.success("Test details fetched successfully", {
      ...detail,
      content: catalogDetailService.fillLocation(detail.content, null),
    }),
  );
});

export const getPackageDetails = asyncHandler(async (req: Request, res: Response) => {
  const detail = await catalogDetailService.getPackageDetail(
    { id: req.params.id },
    { activeOnly: true },
  );

  res.status(200).json(AppApiResponse.success("Package details fetched successfully", detail));
});

/** City+slug twins for the SEO landing routes (`/{citySlug}/tests/{testSlug}`
 *  etc. on the patient-web side) — see `catalogDetail.service.ts#getTestDetailForCity`'s
 *  doc-comment for what `city` adds and why the price can differ from the
 *  plain id-based route above. */
export const getTestDetailsForCity = asyncHandler(async (req: Request, res: Response) => {
  const detail = await catalogDetailService.getTestDetailForCity(
    req.params.citySlug,
    req.params.testSlug,
  );

  res.status(200).json(AppApiResponse.success("Test details fetched successfully", detail));
});

export const getPackageDetailsForCity = asyncHandler(async (req: Request, res: Response) => {
  const detail = await catalogDetailService.getPackageDetailForCity(
    req.params.citySlug,
    req.params.packageSlug,
  );

  res.status(200).json(AppApiResponse.success("Package details fetched successfully", detail));
});
