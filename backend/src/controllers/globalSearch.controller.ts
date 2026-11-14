import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as globalSearchService from "../services/globalSearch.service";

/** ADMIN sees every Organization's patients; a Collection Center portal user
 *  is always scoped to their own Organization, matching patient.controller.ts. */
function scopeOrganizationId(req: Request): string | undefined {
  return req.user?.role.toUpperCase() === "ADMIN" ? undefined : req.user?.organizationId;
}

export const search = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as Record<string, string | undefined>;

  const result = await globalSearchService.search(q ?? "", scopeOrganizationId(req));

  res.status(200).json(ApiResponse.success("Search results retrieved successfully", result));
});
