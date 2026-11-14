import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as packageService from "../services/package.service";
import * as catalogDetailService from "../services/catalogDetail.service";
import type { ListPackagesParams, PackageWriteData } from "../types/package.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    active,
    includeDeleted,
    appCategoryId,
    sampleTypeId,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  const params: ListPackagesParams = {
    search,
    active,
    includeDeleted,
    appCategoryId,
    sampleTypeId,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await packageService.listPackages(params);

  res.status(200).json(ApiResponse.success("Packages retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await packageService.getPackage(req.params.id);

  res.status(200).json(ApiResponse.success("Package retrieved successfully", pkg));
});

/** Read-only "what does this Package contain?" preview — the flattened analyte
 *  list an admin sanity-checks before publishing. Shares
 *  `catalogDetail.service.ts` with the patient app's
 *  `/app/packages/:id/details`; this surface omits `activeOnly` so an inactive
 *  package can still be inspected. */
export const getDetails = asyncHandler(async (req: Request, res: Response) => {
  const detail = await catalogDetailService.getPackageDetail({ id: req.params.id });

  res.status(200).json(ApiResponse.success("Package details retrieved successfully", detail));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PackageWriteData;

  const pkg = await packageService.createPackage(values);

  res.status(201).json(ApiResponse.success("Package created successfully", pkg));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PackageWriteData;

  const pkg = await packageService.updatePackage(req.params.id, values);

  res.status(200).json(ApiResponse.success("Package updated successfully", pkg));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await packageService.deletePackage(req.params.id);

  res.status(200).json(ApiResponse.success("Package deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await packageService.restorePackage(req.params.id);

  res.status(200).json(ApiResponse.success("Package restored successfully", pkg));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const pkg = await packageService.setPackageStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Package status updated successfully", pkg));
});

export const setPopular = asyncHandler(async (req: Request, res: Response) => {
  const { isPopular } = req.body as { isPopular: boolean };

  const pkg = await packageService.setPackagePopular(req.params.id, isPopular);

  res.status(200).json(ApiResponse.success("Package popular flag updated successfully", pkg));
});

/** Attaches (or, with no file, detaches) the optional sample lab report. Kept
 *  separate from create/update because a multipart upload can't ride along with
 *  the form's JSON body — mirrors the Test and Parameter endpoints. */
export const uploadSampleReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  const pkg = await packageService.setPackageSampleReport(
    req.params.id,
    `/uploads/${req.file.filename}`,
  );

  res.status(200).json(ApiResponse.success("Sample report uploaded successfully", pkg));
});

export const removeSampleReport = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await packageService.setPackageSampleReport(req.params.id, null);

  res.status(200).json(ApiResponse.success("Sample report removed successfully", pkg));
});

export const exportCsv = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await packageService.exportPackagesCsv();

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="packages.csv"');
  res.send(buffer);
});

export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  const result = await packageService.importPackagesCsv(req.file.buffer);

  res.status(200).json(ApiResponse.success("Packages import complete", result));
});
