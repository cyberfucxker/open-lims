import { body, param, query } from "express-validator";
import {
  APP_ORDER_PAYMENT_MODE_VALUES,
  APP_ORDER_PAYMENT_STATUS_VALUES,
  APP_ORDER_STATUS_VALUES,
} from "../types/appOrder.types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const appOrderIdParamValidation = [param("id").isUUID().withMessage("Invalid order id")];

export const listAppOrdersValidation = [
  query("search").optional().trim(),
  query("status")
    .optional()
    .isIn(APP_ORDER_STATUS_VALUES)
    .withMessage(`status must be one of ${APP_ORDER_STATUS_VALUES.join(", ")}`),
  query("phleboId")
    .optional()
    .custom((value) => value === "unassigned" || UUID_RE.test(value))
    .withMessage('phleboId must be a valid id or the literal "unassigned"'),
  query("paymentMode")
    .optional()
    .isIn(APP_ORDER_PAYMENT_MODE_VALUES)
    .withMessage(`paymentMode must be one of ${APP_ORDER_PAYMENT_MODE_VALUES.join(", ")}`),
  query("paymentStatus")
    .optional()
    .isIn(APP_ORDER_PAYMENT_STATUS_VALUES)
    .withMessage(`paymentStatus must be one of ${APP_ORDER_PAYMENT_STATUS_VALUES.join(", ")}`),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const updateAppOrderStatusValidation = [
  ...appOrderIdParamValidation,
  body("status")
    .isIn(APP_ORDER_STATUS_VALUES)
    .withMessage(`status must be one of ${APP_ORDER_STATUS_VALUES.join(", ")}`),
];

export const assignPhleboValidation = [
  ...appOrderIdParamValidation,
  body("phleboId")
    .custom((value) => value === null || (typeof value === "string" && UUID_RE.test(value)))
    .withMessage("phleboId must be a valid id or null"),
];

export const createAppOrderValidation = [
  body("appUserId").isUUID().withMessage("appUserId must be a valid id"),
  body("familyMemberId").optional().isUUID().withMessage("familyMemberId must be a valid id"),
  body("addressId").isUUID().withMessage("addressId must be a valid id"),
  body("slotId").optional().isUUID().withMessage("slotId must be a valid id"),
  body("orderDate").isISO8601().withMessage("orderDate must be a valid date (YYYY-MM-DD)"),
  body("testIds").isArray().withMessage("testIds must be an array"),
  body("testIds.*").isUUID().withMessage("Each testId must be a valid id"),
  body("packageIds").optional().isArray().withMessage("packageIds must be an array"),
  body("packageIds.*").isUUID().withMessage("Each packageId must be a valid id"),
  body("paymentMode")
    .isIn(APP_ORDER_PAYMENT_MODE_VALUES)
    .withMessage(`paymentMode must be one of ${APP_ORDER_PAYMENT_MODE_VALUES.join(", ")}`),
];

export const addHomeVisitItemsValidation = [
  ...appOrderIdParamValidation,
  body("testIds").isArray().withMessage("testIds must be an array"),
  body("testIds.*").isUUID().withMessage("Each testId must be a valid id"),
  body("packageIds").optional().isArray().withMessage("packageIds must be an array"),
  body("packageIds.*").optional().isUUID().withMessage("Each packageId must be a valid id"),
];

export const removeHomeVisitItemValidation = [
  ...appOrderIdParamValidation,
  param("itemId").isUUID().withMessage("Invalid item id"),
];
