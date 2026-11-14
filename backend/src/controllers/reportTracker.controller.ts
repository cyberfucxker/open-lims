import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as reportTrackerService from "../services/reportTracker.service";
import type { ListReportTrackerParams } from "../types/reportTracker.types";

/** `express-validator`'s `.toBoolean()` sanitizer mutates the query value
 *  into a real `boolean` in place (confirmed empirically) — comparing it to
 *  the string `"true"` would always be false, silently disabling the
 *  filter. Accept either shape defensively. */
function toBool(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value === true || value === "true";
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, dateFrom, dateTo, isEmergency, status, breachedOnly, page, pageSize } =
    req.query as Record<string, unknown>;

  const params: ListReportTrackerParams = {
    search: search as string | undefined,
    dateFrom: dateFrom as string | undefined,
    dateTo: dateTo as string | undefined,
    isEmergency: toBool(isEmergency),
    status: status as ListReportTrackerParams["status"],
    breachedOnly: toBool(breachedOnly),
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await reportTrackerService.listReportTracker(params);

  res.status(200).json(ApiResponse.success("Reports tracker retrieved successfully", result));
});
