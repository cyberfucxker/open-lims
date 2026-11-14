import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as doctorVisitService from "../services/doctorVisit.service";
import type { CreateDoctorVisitInput, ListDoctorVisitsParams } from "../types/doctorVisit.types";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CreateDoctorVisitInput;

  const visit = await doctorVisitService.recordVisit(values);

  res.status(201).json(ApiResponse.success("Doctor visit recorded successfully", visit));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { marketingStaffId, referralDoctorId, dateFrom, dateTo, page, pageSize } =
    req.query as Record<string, string | undefined>;

  const params: ListDoctorVisitsParams = {
    marketingStaffId,
    referralDoctorId,
    dateFrom,
    dateTo,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await doctorVisitService.listVisits(params);

  res.status(200).json(ApiResponse.success("Doctor visits retrieved successfully", result));
});

export const listUpcoming = asyncHandler(async (req: Request, res: Response) => {
  const { withinDays } = req.query as Record<string, string | undefined>;

  const visits = await doctorVisitService.listUpcomingVisits(withinDays ? Number(withinDays) : 7);

  res.status(200).json(ApiResponse.success("Upcoming visits retrieved successfully", visits));
});
