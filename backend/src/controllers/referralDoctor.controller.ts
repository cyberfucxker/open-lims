import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as referralDoctorService from "../services/referralDoctor.service";
import type {
  AssignDoctorInput,
  BulkAssignDoctorsInput,
  ListReferralDoctorsParams,
  ReferralDoctorWriteData,
} from "../types/referralDoctor.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    active,
    includeDeleted,
    marketingStaffId,
    unassignedOnly,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  const params: ListReferralDoctorsParams = {
    search,
    active,
    includeDeleted,
    marketingStaffId,
    unassignedOnly,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await referralDoctorService.listReferralDoctors(params);

  res.status(200).json(ApiResponse.success("Referral doctors retrieved successfully", result));
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  const rows = await referralDoctorService.listActiveReferralDoctors();

  res.status(200).json(ApiResponse.success("Active referral doctors retrieved successfully", rows));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await referralDoctorService.getReferralDoctor(req.params.id);

  res.status(200).json(ApiResponse.success("Referral doctor retrieved successfully", doctor));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ReferralDoctorWriteData;

  const doctor = await referralDoctorService.createReferralDoctor(values, req.user?.id);

  res.status(201).json(ApiResponse.success("Referral doctor created successfully", doctor));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as ReferralDoctorWriteData;

  const doctor = await referralDoctorService.updateReferralDoctor(
    req.params.id,
    values,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Referral doctor updated successfully", doctor));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await referralDoctorService.deleteReferralDoctor(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Referral doctor deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await referralDoctorService.restoreReferralDoctor(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Referral doctor restored successfully", doctor));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: boolean };

  const doctor = await referralDoctorService.setReferralDoctorStatus(
    req.params.id,
    status,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Referral doctor status updated successfully", doctor));
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const { marketingStaffId } = req.body as AssignDoctorInput;

  const doctor = await referralDoctorService.assignDoctor(
    req.params.id,
    marketingStaffId,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Referral doctor assigned successfully", doctor));
});

export const transfer = asyncHandler(async (req: Request, res: Response) => {
  const { marketingStaffId } = req.body as AssignDoctorInput;

  const doctor = await referralDoctorService.transferDoctor(
    req.params.id,
    marketingStaffId,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Referral doctor transferred successfully", doctor));
});

export const bulkAssign = asyncHandler(async (req: Request, res: Response) => {
  const { doctorIds, marketingStaffId } = req.body as BulkAssignDoctorsInput;

  const doctors = await referralDoctorService.bulkAssignDoctors(
    doctorIds,
    marketingStaffId,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Referral doctors assigned successfully", doctors));
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await referralDoctorService.listAuditLogs(req.params.id);

  res.status(200).json(ApiResponse.success("Audit logs retrieved successfully", logs));
});
