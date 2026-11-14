import { param, query } from "express-validator";

const INCENTIVE_STATUSES = ["PENDING", "SETTLED", "CANCELLED"];

export const listReferralIncentivesValidation = [
  query("referralSourceId").optional().isUUID().withMessage("Invalid referral source id"),
  query("incentiveStatus").optional().isIn(INCENTIVE_STATUSES).withMessage("Invalid status"),
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("pageSize must be between 1 and 200")
    .toInt(),
];

export const monthlyIncentiveValidation = [
  query("month").isInt({ min: 1, max: 12 }).withMessage("month must be between 1 and 12").toInt(),
  query("year").isInt({ min: 2000, max: 2100 }).withMessage("Enter a valid year").toInt(),
];

export const referralSourceIdParamValidation = [
  param("referralSourceId").isUUID().withMessage("Invalid referral source id"),
];
