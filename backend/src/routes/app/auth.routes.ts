import { Router } from "express";
import * as authController from "../../controllers/app/auth.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { appAuthRateLimiter } from "../../middleware/rateLimiter.middleware";
import { uploadCompleteProfileFiles } from "../../middleware/appUpload.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  appCompleteProfileValidation,
  appLoginValidation,
  appVerifyOtpValidation,
} from "../../validations/app/auth.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/login:
 *   post:
 *     tags: [App Auth]
 *     summary: Send/resend login OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile]
 *             properties:
 *               mobile: { type: string, example: "9876543210" }
 *     responses:
 *       200: { description: OTP sent }
 */
router.post("/user/login", appAuthRateLimiter, appLoginValidation, validate, authController.login);

/**
 * @openapi
 * /api/v1/app/user/verify-otp:
 *   post:
 *     tags: [App Auth]
 *     summary: Verify OTP and issue a session token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mobile, otp]
 *             properties:
 *               mobile: { type: string, example: "9876543210" }
 *               otp: { type: string, example: "123456" }
 *               fcmToken: { type: string, description: "Optional — the device's FCM push token, stored for future notifications" }
 *     responses:
 *       200: { description: Token issued }
 */
router.post(
  "/user/verify-otp",
  appAuthRateLimiter,
  appVerifyOtpValidation,
  validate,
  authController.verifyOtp,
);

/**
 * @openapi
 * /api/v1/app/user/complete-profile:
 *   post:
 *     tags: [App Auth]
 *     summary: >
 *       Complete or edit the patient's profile (creates the "Self" family
 *       member/Patient on first call; idempotent on re-call)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, sex, d_o_b]
 *             properties:
 *               name: { type: string }
 *               sex: { type: string, enum: [Male, Female, Other] }
 *               d_o_b: { type: string, example: "15-08-1995" }
 *               email: { type: string }
 *               patient_city: { type: string, description: "City id, slug, or name — omit to keep the existing city" }
 *               profile_photo: { type: string, format: binary }
 *               verification_document: { type: string, format: binary }
 *     responses:
 *       200: { description: Profile completed }
 */
router.post(
  "/user/complete-profile",
  authenticateAppUser,
  uploadCompleteProfileFiles,
  appCompleteProfileValidation,
  validate,
  authController.completeProfile,
);

export { router as appAuthRouter };
