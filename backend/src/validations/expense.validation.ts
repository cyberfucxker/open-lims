import { body, query } from "express-validator";

const PAYMENT_MODES = ["Cash", "Card", "UPI", "Insurance", "Credit", "Online"];

export const createExpenseCategoryValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
];

export const createExpenseServiceValidation = [
  body("categoryId").isUUID().withMessage("Valid categoryId is required"),
  body("name").trim().notEmpty().withMessage("Name is required"),
];

export const listExpensesValidation = [
  query("dateFrom").optional().isISO8601().withMessage("Invalid dateFrom"),
  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo"),
  query("categoryId").optional().isUUID().withMessage("Invalid categoryId"),
  query("serviceId").optional().isUUID().withMessage("Invalid serviceId"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 200 }).toInt(),
];

export const createExpenseValidation = [
  body("categoryId").isUUID().withMessage("Valid categoryId is required"),
  body("serviceId").isUUID().withMessage("Valid serviceId is required"),
  body("invoiceDate").isISO8601().withMessage("Valid invoiceDate is required"),
  body("quantity").isFloat({ min: 0.01 }).withMessage("Quantity must be greater than 0"),
  body("rate").isFloat({ min: 0 }).withMessage("Rate must be 0 or more"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be 0 or more"),
  body("paymentMode").isIn(PAYMENT_MODES).withMessage("Invalid paymentMode"),
  body("paymentType").optional().isIn(["DEBIT", "CREDIT"]).withMessage("Invalid paymentType"),
  body("remarks").optional().isString(),
];
