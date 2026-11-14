import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as sampleService from "../services/sample.service";
import {
  generateSampleLabelPdf,
  generateSampleLabelBatchPdf,
} from "../services/sampleLabelPdf.service";
import { generateSampleListExcel } from "../services/excelExport.service";
import type {
  BulkSampleIdsInput,
  ListSamplesParams,
  RejectSampleInput,
  SampleViewStatus,
} from "../types/sample.types";

/** ADMIN sees everything; a Collection Center portal user is always scoped
 *  to their own Organization's samples. */
function scopeOrganizationId(req: Request): string | undefined {
  return req.user?.role.toUpperCase() === "ADMIN" ? undefined : req.user?.organizationId;
}

function parseListParams(req: Request): ListSamplesParams {
  const { view, search, dateFrom, dateTo, emergency, sortBy, sortDir, page, pageSize } =
    req.query as Record<string, string | undefined>;

  return {
    view: view as SampleViewStatus | undefined,
    search,
    dateFrom,
    dateTo,
    isEmergency: emergency === undefined ? undefined : emergency === "true",
    sortBy,
    sortDir: sortDir as ListSamplesParams["sortDir"],
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await sampleService.listSamples({
    ...parseListParams(req),
    organizationId: scopeOrganizationId(req),
  });
  res.status(200).json(ApiResponse.success("Samples retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const sample = await sampleService.getSample(req.params.id, scopeOrganizationId(req));
  res.status(200).json(ApiResponse.success("Sample retrieved successfully", sample));
});

export const getByAppointment = asyncHandler(async (req: Request, res: Response) => {
  const samples = await sampleService.getSamplesByAppointment(req.params.appointmentId);
  res.status(200).json(ApiResponse.success("Appointment samples retrieved successfully", samples));
});

export const collect = asyncHandler(async (req: Request, res: Response) => {
  const sample = await sampleService.collectSample(
    req.params.id,
    req.user?.id ?? null,
    scopeOrganizationId(req),
  );
  res.status(200).json(ApiResponse.success("Sample collected successfully", sample));
});

export const receive = asyncHandler(async (req: Request, res: Response) => {
  const sample = await sampleService.receiveSample(req.params.id, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Sample received successfully", sample));
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const sample = await sampleService.approveSample(req.params.id, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Sample approved successfully", sample));
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as RejectSampleInput;
  const sample = await sampleService.rejectSample(req.params.id, reason, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Sample rejected successfully", sample));
});

export const bulkCollect = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkSampleIdsInput;
  const result = await sampleService.bulkCollectSamples(ids, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Bulk collect completed", result));
});

export const bulkReceive = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkSampleIdsInput;
  const result = await sampleService.bulkReceiveSamples(ids, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Bulk receive completed", result));
});

export const bulkApprove = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkSampleIdsInput;
  const result = await sampleService.bulkApproveSamples(ids, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Bulk approve completed", result));
});

export const getBarcode = asyncHandler(async (req: Request, res: Response) => {
  const result = await sampleService.getBarcodeForSample(req.params.id, scopeOrganizationId(req));
  res.status(200).json(ApiResponse.success("Barcode generated successfully", result));
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await sampleService.getSampleHistory(req.params.id, scopeOrganizationId(req));
  res.status(200).json(ApiResponse.success("Sample history retrieved successfully", history));
});

export const downloadLabelPdf = asyncHandler(async (req: Request, res: Response) => {
  const sample = await sampleService.getSample(req.params.id, scopeOrganizationId(req));
  const buffer = await generateSampleLabelPdf(sample);
  const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${sample.sampleNo}.pdf"`);
  res.send(buffer);
});

export const downloadLabelBatchPdf = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as BulkSampleIdsInput;
  const samples = await Promise.all(ids.map((id) => sampleService.getSample(id)));
  const buffer = await generateSampleLabelBatchPdf(samples);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="sample-labels.pdf"');
  res.send(buffer);
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const samples = await sampleService.listAllSamplesForExport(parseListParams(req));
  const buffer = await generateSampleListExcel(samples);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="samples.xlsx"');
  res.send(buffer);
});
