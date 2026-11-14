import { body, param, query } from "express-validator";

const STATUSES = ["SUBMITTED", "APPROVED", "REJECTED"];

export const prescriptionIdParamValidation = [
  param("id").isUUID().withMessage("Invalid prescription id"),
];

export const listPrescriptionsValidation = [
  query("search").optional().trim(),
  query("status").optional().isIn(STATUSES),
  query("cityId").optional().isUUID().withMessage("Invalid cityId"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const setPrescriptionStatusValidation = [
  ...prescriptionIdParamValidation,
  body("status")
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}`),
  // Required-when-REJECTED is enforced in the service, which is where the
  // current status is already loaded — keeping it here too would mean
  // duplicating the rule in two places that can drift.
  body("rejectionReason").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];
