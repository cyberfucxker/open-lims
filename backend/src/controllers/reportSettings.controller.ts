import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as reportSettingsService from "../services/reportSettings.service";
import { generateReportPreviewPdf } from "../services/reportPdf.service";
import type { ReportAssetType, ReportSettingsWriteData } from "../types/reportSettings.types";

export const get = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await reportSettingsService.getReportSettings();
  res.status(200).json(ApiResponse.success("Report settings retrieved successfully", settings));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ReportSettingsWriteData;
  const settings = await reportSettingsService.updateReportSettings(values, req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Report settings saved successfully", settings));
});

export const uploadAsset = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file was uploaded");
  }
  const assetType = req.params.assetType as ReportAssetType;
  const settings = await reportSettingsService.uploadReportAsset(
    assetType,
    `/uploads/${req.file.filename}`,
    req.user?.id ?? null,
  );
  res.status(200).json(ApiResponse.success("File uploaded successfully", settings));
});

export const restoreDefault = asyncHandler(async (req: Request, res: Response) => {
  const settings = await reportSettingsService.restoreDefaultReportSettings(req.user?.id ?? null);
  res.status(200).json(ApiResponse.success("Report settings restored to defaults", settings));
});

/** Report Designer live preview + "Download Sample PDF" — both hit this one
 *  route, `disposition` picking inline (iframe) vs attachment (download). */
export const preview = asyncHandler(async (req: Request, res: Response) => {
  const overrides = req.body as ReportSettingsWriteData;
  const buffer = await generateReportPreviewPdf(overrides);
  const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="sample-report.pdf"`);
  res.send(buffer);
});
