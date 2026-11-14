import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as patientService from "../services/patient.service";
import type { ListPatientsParams, PatientWriteData } from "../types/patient.types";
import type { RegisterPatientInput } from "../types/appointment.types";

/** ADMIN sees everything; a Collection Center portal user is always scoped
 *  to their own Organization, regardless of what (if anything) the request
 *  itself asked for. */
function scopeOrganizationId(req: Request): string | undefined {
  return req.user?.role.toUpperCase() === "ADMIN" ? undefined : req.user?.organizationId;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterPatientInput;

  const result = await patientService.registerPatient(
    input,
    req.user?.id ?? null,
    scopeOrganizationId(req),
  );

  res.status(201).json(ApiResponse.success("Patient registered successfully", result));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    gender,
    organization,
    referral,
    mobile,
    email,
    createdFrom,
    createdTo,
    organizationId,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  const params: ListPatientsParams = {
    search,
    gender: gender as ListPatientsParams["gender"],
    organization,
    referral,
    mobile,
    email,
    createdFrom,
    createdTo,
    // ADMIN may optionally filter by a given Organization via the query
    // string; a portal user's own Organization always wins instead.
    organizationId: scopeOrganizationId(req) ?? organizationId,
    sortBy,
    sortDir: sortDir as ListPatientsParams["sortDir"],
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await patientService.listPatients(params);

  res.status(200).json(ApiResponse.success("Patients retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const patient = await patientService.getPatient(req.params.id, scopeOrganizationId(req));

  res.status(200).json(ApiResponse.success("Patient retrieved successfully", patient));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PatientWriteData;

  const patient = await patientService.updatePatient(req.params.id, values);

  res.status(200).json(ApiResponse.success("Patient updated successfully", patient));
});

export const getBarcode = asyncHandler(async (req: Request, res: Response) => {
  const barcode = await patientService.getPatientBarcode(req.params.id, scopeOrganizationId(req));

  res.status(200).json(ApiResponse.success("Patient barcode generated successfully", barcode));
});
