import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as financeReportService from "../services/financeReport.service";
import { generateFinanceReportExcel } from "../services/excelExport.service";
import { generateFinanceReportPdf } from "../services/invoicePdf.service";
import type { FinanceReportFilters, FinanceReportGroupBy } from "../types/financeReport.types";

function parseFilters(req: Request): {
  filters: FinanceReportFilters;
  groupBy: FinanceReportGroupBy;
} {
  const q = req.query as Record<string, string | undefined>;
  return {
    filters: {
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      organizationId: q.organizationId,
      referralSourceId: q.referralSourceId,
      includeCancelled: q.includeCancelled === "true",
      onlyCancelled: q.onlyCancelled === "true",
      includeFree: q.includeFree === "true",
    },
    groupBy: (q.groupBy as FinanceReportGroupBy) ?? "date",
  };
}

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const { filters, groupBy } = parseFilters(req);
  const result = await financeReportService.getReport(filters, groupBy);

  res.status(200).json(ApiResponse.success("Finance report retrieved successfully", result));
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const { filters, groupBy } = parseFilters(req);
  const result = await financeReportService.getReport(filters, groupBy);
  const buffer = await generateFinanceReportExcel(result, groupBy);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="finance-report.xlsx"');
  res.send(buffer);
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const { filters, groupBy } = parseFilters(req);
  const result = await financeReportService.getReport(filters, groupBy);
  const buffer = await generateFinanceReportPdf(result, groupBy);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="finance-report.pdf"');
  res.send(buffer);
});
