import { body } from "express-validator";

export const updatePaymentGatewayConfigValidation = [
  body("razorpayKeyId").trim().notEmpty().withMessage("razorpayKeyId is required"),
  body("razorpayKeySecret").optional({ values: "falsy" }).trim(),
];
