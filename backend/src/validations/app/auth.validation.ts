import { body } from "express-validator";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const DOB_REGEX = /^\d{2}[-/]\d{2}[-/]\d{4}$/;

export const appLoginValidation = [
  body("mobile").trim().matches(MOBILE_REGEX).withMessage("Enter a valid 10-digit mobile number"),
];

export const appVerifyOtpValidation = [
  body("mobile").trim().matches(MOBILE_REGEX).withMessage("Enter a valid 10-digit mobile number"),
  body("otp").trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage("Enter the 6-digit OTP"),
  // Optional — the Flutter client's FCM device token. camelCase per the
  // actual client (not the snake_case in PUSH_NOTIFICATION_API_SPEC.md —
  // confirmed against the real Flutter code, which sends `fcmToken`).
  // Stored against the account for a future push notification to use. Not
  // sent means "no change," never "clear the stored token."
  body("fcmToken").optional({ checkFalsy: true }).isString().trim(),
];

export const appCompleteProfileValidation = [
  body("name").trim().isLength({ min: 1, max: 150 }).withMessage("Name is required"),
  body("sex").isIn(["Male", "Female", "Other"]).withMessage("Sex must be Male, Female or Other"),
  body("d_o_b").matches(DOB_REGEX).withMessage("d_o_b must be in DD-MM-YYYY or DD/MM/YYYY format"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Enter a valid email address"),
  body("patient_city").optional({ checkFalsy: true }).trim(),
];
