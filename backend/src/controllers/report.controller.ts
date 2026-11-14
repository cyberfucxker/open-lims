import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as reportService from "../services/report.service";
import { generateReportListExcel } from "../services/excelExport.service";
import type {
  ApproveTestResultInput,
  CancelReportInput,
  ListReportsParams,
  RejectReportInput,
  RejectTestResultInput,
  ReportViewStatus,
  SaveResultsInput,
  SaveTestResultInput,
} from "../types/report.types";
import type { BulkSampleIdsInput } from "../types/sample.types";

/** ADMIN sees everything; a Collection Center portal user is always scoped
 *  to their own Organization's reports. */
function scopeOrganizationId(req: Request): string | undefined {
  return req.user?.role.toUpperCase() === "ADMIN" ? undefined : req.user?.organizationId;
}

function parseListParams(req: Request): ListReportsParams {
  const { view, search, dateFrom, dateTo, emergency, sortBy, sortDir, page, pageSize } =
    req.query as Record<string, string | undefined>;

  return {
    view: view as ReportViewStatus | undefined,
    search,
    dateFrom,
    dateTo,
    isEmergency: emergency === undefined ? undefined : emergency === "true",
    sortBy,
    sortDir: sortDir as ListReportsParams["sortDir"],
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await reportService.listReports({
    ...parseListParams(req),
    organizationId: scopeOrganizationId(req),
  });
  res.status(200).json(ApiResponse.success("Reports retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getReport(req.params.id, scopeOrganizationId(req));
  res.status(200).json(ApiResponse.success("Report retrieved successfully", report));
});

export const getByAppointment = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.getReportByAppointment(req.params.appointmentId);
  res.status(200).json(ApiResponse.success("Report retrieved successfully", report));
});

export const saveResults = asyncHandler(async (req: Request, res: Response) => {
  const { results } = req.body as SaveResultsInput;
  const report = await reportService.saveResults(req.params.id, results, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Results saved successfully", report));
});

export const saveTestResult = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as SaveTestResultInput;
  const report = await reportService.saveTestResult(
    req.params.id,
    req.params.resultId,
    input,
    req.user?.id ?? null,
  );
  res.status(200).json(ApiResponse.success("Test result saved successfully", report));
});

export const submitTestResult = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.submitTestResult(
    req.params.id,
    req.params.resultId,
    req.user?.id ?? null,
  );
  res.status(200).json(ApiResponse.success("Test submitted successfully", report));
});

export const approveTestResult = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ApproveTestResultInput;
  const report = await reportService.approveTestResult(
    req.params.id,
    req.params.resultId,
    input,
    req.user?.id ?? null,
  );
  res.status(200).json(ApiResponse.success("Test approved successfully", report));
});

export const rejectTestResult = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as RejectTestResultInput;
  const report = await reportService.rejectTestResult(
    req.params.id,
    req.params.resultId,
    reason,
    req.user?.id ?? null,
  );
  res.status(200).json(ApiResponse.success("Test sent back for revision", report));
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.submitReport(req.params.id, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Report submitted successfully", report));
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.approveReport(req.params.id, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Report approved successfully", report));
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as RejectReportInput;
  const report = await reportService.rejectReport(req.params.id, reason, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Report sent back for revision", report));
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as CancelReportInput;
  const report = await reportService.cancelReport(req.params.id, reason, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Report cancelled successfully", report));
});

export const markPrinted = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.markReportPrinted(req.params.id);
  res.status(200).json(ApiResponse.success("Report marked as printed", report));
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await reportService.getReportHistory(req.params.id);
  res.status(200).json(ApiResponse.success("Report history retrieved successfully", history));
});

export const downloadPdf = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, reportNo } = await reportService.generatePdfForReport(
    req.params.id,
    scopeOrganizationId(req),
  );
  const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${reportNo}.pdf"`);
  res.send(buffer);
});

export const downloadCombinedPdf = asyncHandler(async (req: Request, res: Response) => {
  const {
    resultIds,
    withLetterhead = true,
    withPageBreak = true,
    withDepartmentWise = false,
    withVitals = false,
  } = req.body as {
    resultIds: string[];
    withLetterhead?: boolean;
    withPageBreak?: boolean;
    withDepartmentWise?: boolean;
    withVitals?: boolean;
  };

  const buffer = await reportService.generateCombinedPdfForReport(req.params.id, resultIds, {
    withLetterhead,
    withPageBreak,
    withDepartmentWise,
    withVitals,
  });

  const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="combined-report.pdf"`);
  res.send(buffer);
});

export const printBatch = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkSampleIdsInput;
  const buffer = await reportService.generateBatchPdfForReports(ids);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="reports.pdf"');
  res.send(buffer);
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const reports = await reportService.listAllReportsForExport(parseListParams(req));
  const buffer = await generateReportListExcel(reports);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="reports.xlsx"');
  res.send(buffer);
});
