import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as marketingReportService from "../services/marketingReport.service";
import { generateMarketingReportExcel } from "../services/excelExport.service";
import type { LeaderboardRankBy } from "../types/marketingReport.types";

export const monthlyReport = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as Record<string, string>;

  const result = await marketingReportService.getMonthlyReport(Number(month), Number(year));

  res.status(200).json(ApiResponse.success("Monthly report retrieved successfully", result));
});

export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { month, year, rankBy } = req.query as Record<string, string | undefined>;

  const result = await marketingReportService.getLeaderboard(
    Number(month),
    Number(year),
    rankBy as LeaderboardRankBy | undefined,
  );

  res.status(200).json(ApiResponse.success("Leaderboard retrieved successfully", result));
});

export const dashboardSummary = asyncHandler(async (_req: Request, res: Response) => {
  const result = await marketingReportService.getDashboardSummary();

  res.status(200).json(ApiResponse.success("Dashboard summary retrieved successfully", result));
});

export const exportMonthlyReportExcel = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as Record<string, string>;

  const report = await marketingReportService.getMonthlyReport(Number(month), Number(year));
  const buffer = await generateMarketingReportExcel(report);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="marketing-report-${month}-${year}.xlsx"`,
  );
  res.send(buffer);
});
