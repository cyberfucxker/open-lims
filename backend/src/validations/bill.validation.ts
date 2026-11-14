import { body, param, query } from "express-validator";

const VIEW_STATUSES = ["all", "due", "paid", "free", "cancelled"];
const PAYMENT_MODES = ["Cash", "Card", "UPI", "Online"];
const SEND_CHANNELS = ["WHATSAPP", "EMAIL", "SMS"];

export const billIdParamValidation = [param("id").isUUID().withMessage("Invalid bill id")];

export const listBillsValidation = [
  query("view").optional().isIn(VIEW_STATUSES).withMessage("Invalid view"),
  query("search").optional().trim(),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("emergency")
    .optional()
    .isBoolean()
    .withMessage("emergency must be true or false")
    .toBoolean(),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const updateAdditionalChargesValidation = [
  ...billIdParamValidation,
  body("additionalCharges")
    .isFloat({ min: 0 })
    .withMessage("Additional charges cannot be negative")
    .toFloat(),
];

export const addPaymentValidation = [
  ...billIdParamValidation,
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0").toFloat(),
  body("mode").isIn(PAYMENT_MODES).withMessage("Select a valid payment mode"),
  body("transactionId").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("paymentDate").optional().isISO8601().withMessage("paymentDate must be a valid date"),
];

export const sendInvoiceValidation = [
  ...billIdParamValidation,
  body("channel").isIn(SEND_CHANNELS).withMessage("Select a valid send channel"),
  body("recipient").optional({ values: "falsy" }).trim().isLength({ max: 255 }),
];
