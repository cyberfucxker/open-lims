import { body } from "express-validator";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const phleboLoginValidation = [
  body("mobile").trim().matches(MOBILE_REGEX).withMessage("Enter a valid 10-digit mobile number"),
];

export const phleboVerifyOtpValidation = [
  body("mobile").trim().matches(MOBILE_REGEX).withMessage("Enter a valid 10-digit mobile number"),
  body("otp").trim().isLength({ min: 4, max: 6 }).isNumeric().withMessage("Enter the OTP"),
  // Optional — the client's FCM device token, stored against the account for
  // a future push notification to use. Not sent means "no change," never
  // "clear the stored token."
  body("fcmToken").optional({ checkFalsy: true }).isString().trim(),
];
