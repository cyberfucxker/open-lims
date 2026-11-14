import { body, param, query } from "express-validator";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const thirdPartySendOtpValidation = [
  body("mobile").trim().matches(MOBILE_REGEX).withMessage("Enter a valid 10-digit mobile number"),
];

export const thirdPartyVerifyOtpValidation = [
  body("mobile").trim().matches(MOBILE_REGEX).withMessage("Enter a valid 10-digit mobile number"),
  body("otp").trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage("Enter the 6-digit OTP"),
];

export const fetchThirdPartyReportValidation = [
  body("userFID").trim().notEmpty().withMessage("userFID is required"),
];

export const thirdPartyReportDownloadValidation = [
  param("testRegnId").isInt({ min: 1 }).withMessage("Invalid testRegnId"),
  query("user_fid").trim().notEmpty().withMessage("user_fid is required"),
];

export const thirdPartyPaymentUpdateValidation = [
  body("testRegnID").isInt({ min: 1 }).withMessage("testRegnID must be a positive integer"),
  body("amountPaid").isFloat({ min: 0 }).withMessage("amountPaid must be a non-negative number"),
  body("currentPayAmt")
    .isFloat({ min: 0 })
    .withMessage("currentPayAmt must be a non-negative number"),
  body("userID").trim().notEmpty().withMessage("userID is required"),
];
