import { body, query } from "express-validator";

export const initiateRechargeValidation = [
  body("amount").isFloat({ min: 1 }).withMessage("Enter a valid recharge amount"),
  body("offer_id").optional({ checkFalsy: true }).isUUID().withMessage("Invalid offer_id"),
];

export const verifyRechargeValidation = [
  body("recharge_id").trim().isUUID().withMessage("Invalid recharge_id"),
  body("payment_id").trim().isUUID().withMessage("Invalid payment_id"),
];

export const transactionsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("per_page").optional().isInt({ min: 1, max: 100 }).toInt(),
];
