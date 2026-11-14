import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as testResultConfigService from "../services/testResultConfig.service";
import type { ListTestResultConfigsParams, TestResultConfigWriteData } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, departmentId, categoryId, configured, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListTestResultConfigsParams = {
    search,
    departmentId,
    categoryId,
    configured,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await testResultConfigService.listTestResultConfigs(params);

  res.status(200).json(ApiResponse.success("Result configs retrieved successfully", result));
});

export const getByTestId = asyncHandler(async (req: Request, res: Response) => {
  const config = await testResultConfigService.getTestResultConfig(req.params.testId);

  res.status(200).json(ApiResponse.success("Result config retrieved successfully", config));
});

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as TestResultConfigWriteData;

  const config = await testResultConfigService.upsertTestResultConfig(req.params.testId, values);

  res.status(200).json(ApiResponse.success("Result config saved successfully", config));
});
