import { query } from "express-validator";

export const listReportTrackerValidation = [
  query("search").optional().trim(),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("isEmergency")
    .optional()
    .isBoolean()
    .withMessage("isEmergency must be true or false")
    .toBoolean(),
  query("status")
    .optional()
    .isIn(["all", "not_uploaded", "uploaded", "downloaded"])
    .withMessage("Invalid status"),
  query("breachedOnly")
    .optional()
    .isBoolean()
    .withMessage("breachedOnly must be true or false")
    .toBoolean(),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];
