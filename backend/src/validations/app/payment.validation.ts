import { body } from "express-validator";

export const createPaymentOrderValidation = [
  body("purpose")
    .isIn(["order_payment", "wallet_recharge", "third_party_lab_balance"])
    .withMessage('purpose must be "order_payment", "wallet_recharge" or "third_party_lab_balance"'),
  // third_party_lab_balance references a partner TestRegnID (numeric), not
  // one of our own UUID-keyed rows.
  body("reference_id")
    .if(body("purpose").equals("third_party_lab_balance"))
    .trim()
    .matches(/^\d+$/)
    .withMessage("reference_id must be the TestRegnID (numeric)"),
  body("reference_id")
    .if(body("purpose").not().equals("third_party_lab_balance"))
    .trim()
    .isUUID()
    .withMessage("Invalid reference_id"),
  body("third_party_user_fid")
    .if(body("purpose").equals("third_party_lab_balance"))
    .trim()
    .notEmpty()
    .withMessage("third_party_user_fid is required for third_party_lab_balance payments"),
];

export const verifyPaymentValidation = [
  body("payment_id").trim().isUUID().withMessage("Invalid payment_id"),
  body("razorpay_order_id").trim().notEmpty().withMessage("razorpay_order_id is required"),
  body("razorpay_payment_id").trim().notEmpty().withMessage("razorpay_payment_id is required"),
  body("razorpay_signature").trim().notEmpty().withMessage("razorpay_signature is required"),
];
