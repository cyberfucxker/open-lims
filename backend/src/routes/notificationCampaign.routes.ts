import { Router } from "express";
import * as notificationCampaignController from "../controllers/notificationCampaign.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { sendPushCampaignValidation } from "../validations/notificationCampaign.validation";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

/**
 * @openapi
 * /api/v1/notifications/send-push:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a push notification campaign to an audience segment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [audience, title, body]
 *             properties:
 *               audience:
 *                 type: object
 *                 required: [type]
 *                 properties:
 *                   type: { type: string, enum: [all, filtered, individual] }
 *                   cityId: { type: string, format: uuid }
 *                   minOrderCount: { type: integer }
 *                   appUserId: { type: string, format: uuid }
 *               title: { type: string }
 *               body: { type: string }
 *               data: { type: object }
 *     responses:
 *       200: { description: Campaign sent }
 */
router.post(
  "/send-push",
  sendPushCampaignValidation,
  validate,
  notificationCampaignController.sendPush,
);

export { router as notificationCampaignRouter };
