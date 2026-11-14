import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as myReportsService from "../../services/app/myReports.service";
import { generatePdfForReport } from "../../services/report.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const { reports, total } = await myReportsService.listMyReports(appUser.id, { page, limit });
  res.status(200).json(
    AppApiResponse.success("Reports fetched successfully", reports, {
      page,
      limit,
      total,
    }),
  );
});

export const download = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  await myReportsService.assertReportAccessible(appUser.id, req.params.id);
  await myReportsService.logReportDownloaded(req.params.id);

  const { buffer, reportNo } = await generatePdfForReport(req.params.id);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${reportNo}.pdf"`);
  res.status(200).send(buffer);
});
