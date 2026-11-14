import { body, param, query } from "express-validator";

const SETTLEMENT_STATUSES = ["PENDING", "PAID", "CANCELLED"];

export const referralSettlementIdParamValidation = [
  param("id").isUUID().withMessage("Invalid settlement id"),
];

export const listReferralSettlementsValidation = [
  query("referralSourceId").optional().isUUID().withMessage("Invalid referral source id"),
  query("settlementStatus").optional().isIn(SETTLEMENT_STATUSES).withMessage("Invalid status"),
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo"),
  query("search").optional().trim(),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const generateSettlementValidation = [
  body("referralSourceId").isUUID().withMessage("Select a referral source"),
  body("fromDate").isISO8601().withMessage("Enter a valid from date"),
  body("toDate").isISO8601().withMessage("Enter a valid to date"),
  body("adjustment").optional().isFloat().withMessage("adjustment must be a number").toFloat(),
  body("remarks").optional({ values: "falsy" }).trim(),
];
