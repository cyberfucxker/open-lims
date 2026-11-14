import { body, query } from "express-validator";

export const createDoctorVisitValidation = [
  body("marketingStaffId").isUUID().withMessage("Select a marketing staff member"),
  body("referralDoctorId").isUUID().withMessage("Select a referral doctor"),
  body("visitDate").isISO8601().withMessage("Enter a valid visit date"),
  body("nextVisitDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Enter a valid next visit date"),
  body("remarks").optional({ values: "falsy" }).trim(),
];

export const listDoctorVisitsValidation = [
  query("marketingStaffId").optional().isUUID().withMessage("Invalid marketing staff id"),
  query("referralDoctorId").optional().isUUID().withMessage("Invalid referral doctor id"),
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const listUpcomingVisitsValidation = [
  query("withinDays")
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage("withinDays must be between 1 and 90")
    .toInt(),
];
