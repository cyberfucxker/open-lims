import { Router } from "express";
import * as authController from "../../controllers/phlebo/auth.controller";
import { appAuthRateLimiter } from "../../middleware/rateLimiter.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  phleboLoginValidation,
  phleboVerifyOtpValidation,
} from "../../validations/phlebo/auth.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/sample-boy/login:
 *   post:
 *     tags: [Phlebo Auth]
 *     summary: Send/resend login OTP
 *     description: Rejects with 401 if the mobile number is not a registered, active Phlebotomist — accounts are admin-created, never auto-created here.
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
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OTP sent successfully" }
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   description: Only populated outside production, with the OTP for testing.
 *                   properties:
 *                     dev_otp: { type: string, example: "123456" }
 *       401: { description: Mobile number is not a registered phlebotomist }
 */
router.post("/login", appAuthRateLimiter, phleboLoginValidation, validate, authController.login);

/**
 * @openapi
 * /api/v1/sample-boy/verify-otp:
 *   post:
 *     tags: [Phlebo Auth]
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
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Login successful" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, example: "eyJhbGciOi..." }
 *                     user: { $ref: "#/components/schemas/PhleboUser" }
 *       400: { description: Incorrect/expired OTP }
 *       401: { description: Mobile number is not a registered phlebotomist }
 */
router.post(
  "/verify-otp",
  appAuthRateLimiter,
  phleboVerifyOtpValidation,
  validate,
  authController.verifyOtp,
);

export { router as phleboAuthRouter };
