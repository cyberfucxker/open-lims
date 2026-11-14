import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as testService from "../services/test.service";
import * as catalogDetailService from "../services/catalogDetail.service";
import type { ListTestsParams, TestWriteData } from "../types/test.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, categoryId, departmentId, appCategoryId, status, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListTestsParams = {
    search,
    categoryId,
    departmentId,
    appCategoryId,
    status,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await testService.listTests(params);

  res.status(200).json(ApiResponse.success("Tests retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const test = await testService.getTest(req.params.id);

  res.status(200).json(ApiResponse.success("Test retrieved successfully", test));
});

/** Read-only "what does this Test contain?" preview. Shares
 *  `catalogDetail.service.ts` with the patient app's `/app/tests/:id/details`;
 *  the only difference is this one has no `activeOnly` restriction, so an admin
 *  can inspect an inactive Test before re-publishing it. */
export const getDetails = asyncHandler(async (req: Request, res: Response) => {
  const detail = await catalogDetailService.getTestDetail({ id: req.params.id });

  res.status(200).json(ApiResponse.success("Test details retrieved successfully", detail));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as TestWriteData;

  const test = await testService.createTest(values);

  res.status(201).json(ApiResponse.success("Test created successfully", test));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as TestWriteData;

  const test = await testService.updateTest(req.params.id, values);

  res.status(200).json(ApiResponse.success("Test updated successfully", test));
});

export const reorderParameters = asyncHandler(async (req: Request, res: Response) => {
  const { orderedIds } = req.body as { orderedIds: string[] };

  const test = await testService.reorderTestParameters(req.params.id, orderedIds);

  res.status(200).json(ApiResponse.success("Parameters reordered successfully", test));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await testService.deleteTest(req.params.id);

  res.status(200).json(ApiResponse.success("Test deleted successfully"));
});

/** Attaches (or, with no file, detaches) the optional sample lab report. Kept
 *  separate from create/update because a multipart upload can't ride along with
 *  the form's JSON body — mirrors the Parameter endpoints. */
export const uploadSampleReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  const test = await testService.setTestSampleReport(
    req.params.id,
    `/uploads/${req.file.filename}`,
  );

  res.status(200).json(ApiResponse.success("Sample report uploaded successfully", test));
});

export const removeSampleReport = asyncHandler(async (req: Request, res: Response) => {
  const test = await testService.setTestSampleReport(req.params.id, null);

  res.status(200).json(ApiResponse.success("Sample report removed successfully", test));
});

export const setPopular = asyncHandler(async (req: Request, res: Response) => {
  const { isPopular } = req.body as { isPopular: boolean };

  const test = await testService.setTestPopular(req.params.id, isPopular);

  res.status(200).json(ApiResponse.success("Test popular flag updated successfully", test));
});

export const exportCsv = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await testService.exportTestsCsv();

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="tests.csv"');
  res.send(buffer);
});

export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  const result = await testService.importTestsCsv(req.file.buffer);

  res.status(200).json(ApiResponse.success("Tests import complete", result));
});
