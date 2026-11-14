import { body, param, query } from "express-validator";
import { appointmentBodyValidation, patientIdParamValidation } from "./patient.validation";

const STATUSES = ["REGISTERED", "SAMPLE_COLLECTED", "PROCESSING", "COMPLETED", "CANCELLED"];

export const appointmentIdParamValidation = [
  param("id").isUUID().withMessage("Invalid appointment id"),
];

// Already Registered flow: :id in the path is the existing patient's id.
export const createAppointmentForPatientValidation = [
  ...patientIdParamValidation,
  ...appointmentBodyValidation,
];

export const updateAppointmentStatusValidation = [
  ...appointmentIdParamValidation,
  body("status").isIn(STATUSES).withMessage("Invalid appointment status"),
];

const appointmentListQueryValidation = [
  query("status").optional().isIn(STATUSES).withMessage("Invalid appointment status"),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const listAppointmentsValidation = [
  query("patientId").optional().isUUID().withMessage("Invalid patient id"),
  ...appointmentListQueryValidation,
];

export const listPatientAppointmentsValidation = [
  ...patientIdParamValidation,
  ...appointmentListQueryValidation,
];
