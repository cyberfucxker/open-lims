import { query } from "express-validator";

export const dashboardSummaryValidation = [
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo"),
];
