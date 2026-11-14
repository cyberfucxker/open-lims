import { Router } from "express";
import * as notificationController from "../../controllers/app/notification.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listNotificationsValidation,
  markNotificationsReadValidation,
  updateNotificationSettingsValidation,
} from "../../validations/app/notification.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/notifications:
 *   get:
 *     tags: [App Notifications]
 *     summary: List the authenticated patient's in-app notifications
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: per_page
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: is_read
 *         schema: { type: boolean }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [order_update, report_ready, promo, prescription_status, appointment_reminder, booking_cancelled] }
 *     responses:
 *       200: { description: Notifications }
 */
router.get(
  "/notifications",
  authenticateAppUser,
  listNotificationsValidation,
  validate,
  notificationController.list,
);

/**
 * @openapi
 * /api/v1/app/notifications/mark-read:
 *   patch:
 *     tags: [App Notifications]
 *     summary: Mark specific notifications (or all) as read
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notification_ids: { type: array, items: { type: string, format: uuid } }
 *               mark_all_read: { type: boolean }
 *     responses:
 *       200: { description: Marked as read }
 */
router.patch(
  "/notifications/mark-read",
  authenticateAppUser,
  markNotificationsReadValidation,
  validate,
  notificationController.markRead,
);

/**
 * @openapi
 * /api/v1/app/user/notification-settings:
 *   get:
 *     tags: [App Notifications]
 *     summary: Get the patient's push-notification on/off preference
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Notification settings }
 *   patch:
 *     tags: [App Notifications]
 *     summary: Update the patient's push-notification on/off preference
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [push_enabled]
 *             properties:
 *               push_enabled: { type: boolean }
 *     responses:
 *       200: { description: Notification preference updated }
 */
router.get("/user/notification-settings", authenticateAppUser, notificationController.getSettings);
router.patch(
  "/user/notification-settings",
  authenticateAppUser,
  updateNotificationSettingsValidation,
  validate,
  notificationController.updateSettings,
);

export { router as appNotificationRouter };
