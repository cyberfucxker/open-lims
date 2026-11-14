import { body, param, query } from "express-validator";

const VIEW_STATUSES = [
  "all",
  "pending",
  "collected",
  "received",
  "approved",
  "rejected",
  "completed",
];

export const sampleIdParamValidation = [param("id").isUUID().withMessage("Invalid sample id")];
export const appointmentIdParamValidation = [
  param("appointmentId").isUUID().withMessage("Invalid appointment id"),
];

export const listSamplesValidation = [
  query("view").optional().isIn(VIEW_STATUSES).withMessage("Invalid view"),
  query("search").optional().trim(),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("emergency")
    .optional()
    .isBoolean()
    .withMessage("emergency must be true or false")
    .toBoolean(),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const rejectSampleValidation = [
  ...sampleIdParamValidation,
  body("reason").trim().isLength({ min: 3, max: 500 }).withMessage("Enter a rejection reason"),
];

export const bulkSampleIdsValidation = [
  body("ids").isArray({ min: 1 }).withMessage("Select at least one sample"),
  body("ids.*").isUUID().withMessage("Invalid sample id in selection"),
];
