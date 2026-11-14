import { query } from "express-validator";

export const financeReportValidation = [
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo"),
  query("organizationId").optional().isUUID().withMessage("Invalid organizationId"),
  query("referralSourceId").optional().isUUID().withMessage("Invalid referralSourceId"),
  query("groupBy")
    .optional()
    .isIn(["date", "organisation", "referral"])
    .withMessage("Invalid groupBy"),
  query("includeCancelled")
    .optional()
    .isBoolean()
    .withMessage("Invalid includeCancelled")
    .toBoolean(),
  query("onlyCancelled").optional().isBoolean().withMessage("Invalid onlyCancelled").toBoolean(),
  query("includeFree").optional().isBoolean().withMessage("Invalid includeFree").toBoolean(),
];
