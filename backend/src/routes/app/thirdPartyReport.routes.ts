import { Router } from "express";
import * as thirdPartyReportController from "../../controllers/app/thirdPartyReport.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { appAuthRateLimiter } from "../../middleware/rateLimiter.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  fetchThirdPartyReportValidation,
  thirdPartyPaymentUpdateValidation,
  thirdPartyReportDownloadValidation,
  thirdPartySendOtpValidation,
  thirdPartyVerifyOtpValidation,
} from "../../validations/app/thirdPartyReport.validation";

const router = Router();

// ThirdPartyReport module: OTP-gated bridge to the third-party lab
// partner's own report/payment APIs (ThirdPartyLabClient). Entirely
// separate from the internal "reports" module (report.routes.ts) — no file
// there is touched by this module.

/**
 * @openapi
 * /api/v1/app/third-party-send-otp:
 *   post:
 *     tags: [App ThirdPartyReport]
 *     summary: Log in to the lab partner and send an OTP for verification
 *     security: [{ AppBearerAuth: [] }]
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
router.post(
  "/third-party-send-otp",
  authenticateAppUser,
  appAuthRateLimiter,
  thirdPartySendOtpValidation,
  validate,
  thirdPartyReportController.sendOtp,
);

/**
 * @openapi
 * /api/v1/app/third-party-verify-otp:
 *   post:
 *     tags: [App ThirdPartyReport]
 *     summary: Verify the OTP and retrieve the lab partner UserFID
 *     security: [{ AppBearerAuth: [] }]
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
 *     responses:
 *       200: { description: OTP verified, UserFID returned }
 */
router.post(
  "/third-party-verify-otp",
  authenticateAppUser,
  appAuthRateLimiter,
  thirdPartyVerifyOtpValidation,
  validate,
  thirdPartyReportController.verifyOtp,
);

/**
 * @openapi
 * /api/v1/app/fetch-third-party-report:
 *   post:
 *     tags: [App ThirdPartyReport]
 *     summary: Fetch the patient's third-party lab reports
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userFID]
 *             properties:
 *               userFID: { type: string }
 *     responses:
 *       200: { description: Reports fetched }
 */
router.post(
  "/fetch-third-party-report",
  authenticateAppUser,
  fetchThirdPartyReportValidation,
  validate,
  thirdPartyReportController.fetchReports,
);

/**
 * @openapi
 * /api/v1/app/third-party-reports/{testRegnId}/download:
 *   get:
 *     tags: [App ThirdPartyReport]
 *     summary: Download a released report's PDF — proxied/streamed through
 *       our own server, never a direct link to the lab partner's host
 *     description: >
 *       The partner's raw file host requires the partner's OWN web-session
 *       login and redirects an unauthenticated request to it — a direct
 *       `<a href>` to it just opens their login page. This route re-derives
 *       the report from `user_fid` (same identity `fetch-third-party-report`
 *       and `third-party-report-update-status` already trust — NOT the
 *       caller's app-login mobile, since linking a different mobile than
 *       the one logged into the app is a supported case) and streams the
 *       PDF bytes back with `Content-Disposition: attachment`.
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: testRegnId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: user_fid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: PDF stream }
 *       400: { description: user_fid not linked (no matching ThirdPartyLabSession) }
 *       403: { description: Balance still due on this report }
 *       404: { description: Report not found, or not released yet }
 */
router.get(
  "/third-party-reports/:testRegnId/download",
  authenticateAppUser,
  thirdPartyReportDownloadValidation,
  validate,
  thirdPartyReportController.downloadReport,
);

/**
 * @openapi
 * /api/v1/app/third-party-report-update-status:
 *   post:
 *     tags: [App ThirdPartyReport]
 *     summary: Update the payment status for a third-party lab report
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testRegnID, amountPaid, currentPayAmt, userID]
 *             properties:
 *               testRegnID: { type: integer }
 *               amountPaid: { type: number }
 *               currentPayAmt: { type: number }
 *               userID: { type: string }
 *     responses:
 *       200: { description: Payment status updated }
 */
router.post(
  "/third-party-report-update-status",
  authenticateAppUser,
  thirdPartyPaymentUpdateValidation,
  validate,
  thirdPartyReportController.updatePaymentStatus,
);

export { router as appThirdPartyReportRouter };
