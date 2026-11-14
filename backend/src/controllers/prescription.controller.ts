import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as prescriptionService from "../services/prescription.service";
import type { ListPrescriptionsParams, PrescriptionStatus } from "../types/prescription.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, cityId, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListPrescriptionsParams = {
    search,
    status,
    cityId,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await prescriptionService.listPrescriptions(params);

  res.status(200).json(ApiResponse.success("Prescriptions retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const prescription = await prescriptionService.getPrescription(req.params.id);

  res.status(200).json(ApiResponse.success("Prescription retrieved successfully", prescription));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, rejectionReason } = req.body as {
    status: PrescriptionStatus;
    rejectionReason?: string;
  };

  const prescription = await prescriptionService.setPrescriptionStatus(
    req.params.id,
    status,
    rejectionReason,
  );

  res
    .status(200)
    .json(ApiResponse.success("Prescription status updated successfully", prescription));
});
