import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as testSampleRuleService from "../services/testSampleRule.service";
import type { ListTestSampleRulesParams, TestSampleRuleWriteData } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, departmentId, categoryId, sampleTypeId, configured, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListTestSampleRulesParams = {
    search,
    departmentId,
    categoryId,
    sampleTypeId,
    configured,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await testSampleRuleService.listTestSampleRules(params);

  res.status(200).json(ApiResponse.success("Sample rules retrieved successfully", result));
});

export const getByTestId = asyncHandler(async (req: Request, res: Response) => {
  const rule = await testSampleRuleService.getTestSampleRule(req.params.testId);

  res.status(200).json(ApiResponse.success("Sample rule retrieved successfully", rule));
});

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as TestSampleRuleWriteData;

  const rule = await testSampleRuleService.upsertTestSampleRule(req.params.testId, values);

  res.status(200).json(ApiResponse.success("Sample rule saved successfully", rule));
});
