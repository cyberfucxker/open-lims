import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { renderCmsPageHtml, renderCmsPageNotFoundHtml } from "../utils/cmsPageHtml.util";
import * as cmsPageService from "../services/cmsPage.service";
import type { CmsAppType } from "../types/cmsPage.types";

/** Public, unauthenticated — only ever returns PUBLISHED pages (see
 *  cmsPage.service.ts#getPublishedCmsPage). `appType`/`slug` are already
 *  normalized (uppercased/lowercased) by publicCmsPageParamValidation. */
export const getPublicPage = asyncHandler(async (req: Request, res: Response) => {
  const appType = req.params.appType as CmsAppType;
  const { slug } = req.params;

  const page = await cmsPageService.getPublishedCmsPage(appType, slug);

  res.status(200).json(ApiResponse.success("Page retrieved successfully", page));
});

/** Renders a self-contained HTML document (inline CSS, no external
 *  requests) for direct loading in a mobile WebView — the plain public URLs
 *  requested for the app (`/about-us`, `/phlebo/about-us`, etc.), as opposed
 *  to the JSON API above. A missing/unpublished page renders a friendly
 *  404 HTML page instead of a JSON error, since a WebView has no JSON
 *  parsing/handling of its own. */
async function respondWithHtml(res: Response, appType: CmsAppType, slug: string): Promise<void> {
  try {
    const page = await cmsPageService.getPublishedCmsPage(appType, slug.toLowerCase());
    res.status(200).type("html").send(renderCmsPageHtml(page));
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      res.status(404).type("html").send(renderCmsPageNotFoundHtml());
      return;
    }
    throw error;
  }
}

export const getUserPageHtml = asyncHandler(async (req: Request, res: Response) => {
  await respondWithHtml(res, "USER", req.params.slug);
});

export const getPhleboPageHtml = asyncHandler(async (req: Request, res: Response) => {
  await respondWithHtml(res, "PHLEBO", req.params.slug);
});
