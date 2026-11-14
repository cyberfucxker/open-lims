import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as appointmentService from "../services/appointment.service";
import type {
  AppointmentStatus,
  CreateAppointmentInput,
  ListAppointmentsParams,
} from "../types/appointment.types";

/** ADMIN sees everything; a Collection Center portal user is always scoped
 *  to their own Organization's patients. */
function scopeOrganizationId(req: Request): string | undefined {
  return req.user?.role.toUpperCase() === "ADMIN" ? undefined : req.user?.organizationId;
}

export const createForPatient = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateAppointmentInput;

  const appointment = await appointmentService.createAppointmentForPatient(
    req.params.id,
    input,
    req.user?.id ?? null,
    scopeOrganizationId(req),
  );

  res.status(201).json(ApiResponse.success("Appointment created successfully", appointment));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentService.getAppointment(req.params.id);

  res.status(200).json(ApiResponse.success("Appointment retrieved successfully", appointment));
});

function parseListParams(req: Request): ListAppointmentsParams {
  const { patientId, status, dateFrom, dateTo, sortBy, sortDir, page, pageSize } =
    req.query as Record<string, string | undefined>;

  return {
    patientId,
    status: status as AppointmentStatus | undefined,
    dateFrom,
    dateTo,
    sortBy,
    sortDir: sortDir as ListAppointmentsParams["sortDir"],
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await appointmentService.listAppointments(parseListParams(req));

  res.status(200).json(ApiResponse.success("Appointments retrieved successfully", result));
});

export const listForPatient = asyncHandler(async (req: Request, res: Response) => {
  const result = await appointmentService.listAppointmentsForPatient(
    req.params.id,
    parseListParams(req),
    scopeOrganizationId(req),
  );

  res
    .status(200)
    .json(ApiResponse.success("Patient appointment history retrieved successfully", result));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: AppointmentStatus };

  const appointment = await appointmentService.updateAppointmentStatus(req.params.id, status);

  res.status(200).json(ApiResponse.success("Appointment status updated successfully", appointment));
});
