import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as marketingStaffService from "../services/marketingStaff.service";
import type {
  ListMarketingStaffParams,
  MarketingStaffWriteData,
} from "../types/marketingStaff.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, includeDeleted, sortBy, sortDir, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListMarketingStaffParams = {
    search,
    active,
    includeDeleted,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await marketingStaffService.listMarketingStaff(params);

  res.status(200).json(ApiResponse.success("Marketing staff retrieved successfully", result));
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await marketingStaffService.listActiveMarketingStaff();

  res.status(200).json(ApiResponse.success("Active marketing staff retrieved successfully", rows));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const staff = await marketingStaffService.getMarketingStaff(req.params.id);

  res.status(200).json(ApiResponse.success("Marketing staff retrieved successfully", staff));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as MarketingStaffWriteData;

  const staff = await marketingStaffService.createMarketingStaff(values, req.user?.id);

  res.status(201).json(ApiResponse.success("Marketing staff created successfully", staff));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as MarketingStaffWriteData;

  const staff = await marketingStaffService.updateMarketingStaff(
    req.params.id,
    values,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Marketing staff updated successfully", staff));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await marketingStaffService.deleteMarketingStaff(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Marketing staff deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const staff = await marketingStaffService.restoreMarketingStaff(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Marketing staff restored successfully", staff));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: boolean };

  const staff = await marketingStaffService.setMarketingStaffStatus(
    req.params.id,
    status,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Marketing staff status updated successfully", staff));
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await marketingStaffService.listAuditLogs(req.params.id);

  res.status(200).json(ApiResponse.success("Audit logs retrieved successfully", logs));
});
