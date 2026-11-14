import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as referralSourceService from "../services/referralSource.service";
import type {
  AssignPriceListInput,
  ListReferralSourcesParams,
  ReferralSourceWriteData,
} from "../types/referralSource.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    active,
    includeDeleted,
    referralType,
    marketingStaffId,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  const params: ListReferralSourcesParams = {
    search,
    active,
    includeDeleted,
    referralType: referralType as ListReferralSourcesParams["referralType"],
    marketingStaffId,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await referralSourceService.listReferralSources(params);

  res.status(200).json(ApiResponse.success("Referral sources retrieved successfully", result));
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await referralSourceService.listActiveReferralSources();

  res.status(200).json(ApiResponse.success("Active referral sources retrieved successfully", rows));
});

export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await referralSourceService.listAllReferralSources();

  res.status(200).json(ApiResponse.success("Referral sources retrieved successfully", rows));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const source = await referralSourceService.getReferralSource(req.params.id);

  res.status(200).json(ApiResponse.success("Referral source retrieved successfully", source));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ReferralSourceWriteData;

  const source = await referralSourceService.createReferralSource(values, req.user?.id);

  res.status(201).json(ApiResponse.success("Referral source created successfully", source));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ReferralSourceWriteData;

  const source = await referralSourceService.updateReferralSource(
    req.params.id,
    values,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Referral source updated successfully", source));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await referralSourceService.deleteReferralSource(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Referral source deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const source = await referralSourceService.restoreReferralSource(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Referral source restored successfully", source));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: boolean };

  const source = await referralSourceService.setReferralSourceStatus(
    req.params.id,
    status,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Referral source status updated successfully", source));
});

export const assignPriceList = asyncHandler(async (req: Request, res: Response) => {
  const { priceListId } = req.body as AssignPriceListInput;

  const source = await referralSourceService.assignPriceList(
    req.params.id,
    priceListId,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Price list assigned successfully", source));
});

export const removePriceList = asyncHandler(async (req: Request, res: Response) => {
  const source = await referralSourceService.removePriceList(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Price list removed successfully", source));
});

export const getPriceListAssignment = asyncHandler(async (req: Request, res: Response) => {
  const view = await referralSourceService.getPriceListAssignment(req.params.id);

  res.status(200).json(ApiResponse.success("Price list assignment retrieved successfully", view));
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await referralSourceService.listAuditLogs(req.params.id);

  res.status(200).json(ApiResponse.success("Audit logs retrieved successfully", logs));
});
