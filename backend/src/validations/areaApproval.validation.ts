import { body, param, query } from "express-validator";
import { AREA_APPROVAL_STATUS_VALUES } from "../types/areaApproval.types";

export const createAreaApprovalRequestValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter the area name"),
  body("pincodes").optional().isArray().withMessage("pincodes must be an array"),
  body("pincodes.*")
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage("Each pincode must be 6 digits"),
];

export const listAreaApprovalRequestsValidation = [
  query("status")
    .optional()
    .isIn(AREA_APPROVAL_STATUS_VALUES)
    .withMessage(`status must be one of ${AREA_APPROVAL_STATUS_VALUES.join(", ")}`),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const areaApprovalRequestIdParamValidation = [
  param("id").isUUID().withMessage("Invalid request id"),
];

export const rejectAreaApprovalRequestValidation = [
  ...areaApprovalRequestIdParamValidation,
  body("reason").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
];
