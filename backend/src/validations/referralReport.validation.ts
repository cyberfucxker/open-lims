import { query } from "express-validator";

export const dateRangeValidation = [
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo"),
];

export const revenueTrendValidation = [
  query("months")
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage("months must be between 1 and 24")
    .toInt(),
];

export const rankingValidation = [
  ...dateRangeValidation,
  query("rankBy")
    .optional()
    .isIn(["revenue", "patients", "commission"])
    .withMessage("Invalid rankBy value"),
];
