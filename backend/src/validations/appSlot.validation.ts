import { body, param, query } from "express-validator";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const appSlotIdParamValidation = [param("id").isUUID().withMessage("Invalid slot id")];

export const listAppSlotsValidation = [
  query("dateFrom").isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").isISO8601().withMessage("dateTo must be a valid date"),
  query("centerId").optional().isUUID().withMessage("Invalid centerId"),
  query("isBlocked")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isBlocked must be true or false"),
];

const appSlotBodyValidation = [
  body("centerId").optional({ values: "falsy" }).isUUID().withMessage("Invalid centerId"),
  body("slotDate").isISO8601().withMessage("slotDate must be a valid date"),
  body("startTime").matches(TIME_RE).withMessage("startTime must be in HH:mm format"),
  body("endTime").matches(TIME_RE).withMessage("endTime must be in HH:mm format"),
  body("capacity").isInt({ min: 1 }).withMessage("capacity must be a positive integer").toInt(),
  body("surchargeAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("surchargeAmount must be a non-negative number")
    .toFloat(),
  body("isBlocked")
    .optional()
    .isBoolean()
    .withMessage("isBlocked must be true or false")
    .toBoolean(),
];

export const createAppSlotValidation = [...appSlotBodyValidation];
export const updateAppSlotValidation = [...appSlotIdParamValidation, ...appSlotBodyValidation];

export const setAppSlotBlockedValidation = [
  ...appSlotIdParamValidation,
  body("isBlocked").isBoolean().withMessage("isBlocked must be true or false").toBoolean(),
];

export const bulkApplySlotsValidation = [
  body("dateFrom").isISO8601().withMessage("dateFrom must be a valid date"),
  body("dateTo").isISO8601().withMessage("dateTo must be a valid date"),
  body("weekdays").isArray({ min: 1 }).withMessage("weekdays must be a non-empty array"),
  body("weekdays.*")
    .isInt({ min: 0, max: 6 })
    .withMessage("weekdays entries must be integers 0-6")
    .toInt(),
  body("centerId").optional({ values: "falsy" }).isUUID().withMessage("Invalid centerId"),
  body("buckets").isArray({ min: 1 }).withMessage("buckets must be a non-empty array"),
  body("buckets.*.startTime").matches(TIME_RE).withMessage("startTime must be in HH:mm format"),
  body("buckets.*.endTime").matches(TIME_RE).withMessage("endTime must be in HH:mm format"),
  body("buckets.*.capacity")
    .isInt({ min: 1 })
    .withMessage("capacity must be a positive integer")
    .toInt(),
  body("buckets.*.surchargeAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("surchargeAmount must be a non-negative number")
    .toFloat(),
];
