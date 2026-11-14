import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import * as parameterService from "../services/parameter.service";
import type { ListParametersParams, ParameterWriteData } from "../types/parameter.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, doTest, active, sampleTypeId, departmentId, appCategoryId, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListParametersParams = {
    search,
    doTest: doTest === "all" ? undefined : doTest,
    active: active === "all" ? undefined : active,
    sampleTypeId,
    departmentId,
    appCategoryId,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await parameterService.listParameters(params);

  res.status(200).json(ApiResponse.success("Parameters retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const parameter = await parameterService.getParameter(req.params.id);

  res.status(200).json(ApiResponse.success("Parameter retrieved successfully", parameter));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ParameterWriteData;

  const parameter = await parameterService.createParameter(values);

  res.status(201).json(ApiResponse.success("Parameter created successfully", parameter));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ParameterWriteData;

  const parameter = await parameterService.updateParameter(req.params.id, values);

  res.status(200).json(ApiResponse.success("Parameter updated successfully", parameter));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await parameterService.deleteParameter(req.params.id);

  res.status(200).json(ApiResponse.success("Parameter deleted successfully"));
});

/** Attaches (or, with no file, detaches) the optional sample lab report. Kept
 *  separate from create/update because a multipart upload can't ride along with
 *  the form's JSON body. The stored value is the public `/uploads/...` path,
 *  matching how CMS banner/category images are referenced. */
export const uploadSampleReport = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  const parameter = await parameterService.setParameterSampleReport(
    req.params.id,
    `/uploads/${req.file.filename}`,
  );

  res.status(200).json(ApiResponse.success("Sample report uploaded successfully", parameter));
});

export const removeSampleReport = asyncHandler(async (req: Request, res: Response) => {
  const parameter = await parameterService.setParameterSampleReport(req.params.id, null);

  res.status(200).json(ApiResponse.success("Sample report removed successfully", parameter));
});

export const exportCsv = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await parameterService.exportParametersCsv();

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="parameters.csv"');
  res.send(buffer);
});

export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  const result = await parameterService.importParametersCsv(req.file.buffer);

  res.status(200).json(ApiResponse.success("Parameters import complete", result));
});
