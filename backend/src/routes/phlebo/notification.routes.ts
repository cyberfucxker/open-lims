import { Router } from "express";
import * as notificationController from "../../controllers/phlebo/notification.controller";
import { authenticatePhlebo } from "../../middleware/phleboAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listNotificationsValidation,
  notificationIdParamValidation,
} from "../../validations/phlebo/notification.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/sample-boy/notifications:
 *   get:
 *     tags: [Phlebo Notifications]
 *     summary: List the authenticated phlebo's in-app notifications
 *     description: >
 *       Newest first, scoped to the token's phlebo. Rows are written by the
 *       booking lifecycle (assignment, cancellation, un-assignment — see
 *       `orderNotification.service.ts`), never by the app itself.
 *       `unread_count` is the bell-badge total across every page and is NOT
 *       narrowed by the `is_read`/`type` filters, unlike `total`.
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: per_page
 *         schema: { type: integer, default: 20, maximum: 500 }
 *       - in: query
 *         name: is_read
 *         schema: { type: boolean }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [new_assignment, booking_cancelled, booking_unassigned, booking_rescheduled] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Notifications fetched successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           type: { type: string, example: "new_assignment" }
 *                           title: { type: string, example: "New booking assigned" }
 *                           message: { type: string }
 *                           target_id: { type: string, format: uuid, nullable: true, description: "AppOrder id to deep-link to" }
 *                           is_read: { type: boolean }
 *                           created_at: { type: string, format: date-time }
 *                     unread_count: { type: integer, example: 3 }
 *                     current_page: { type: integer, example: 1 }
 *                     last_page: { type: integer, example: 1 }
 *                     total: { type: integer, example: 12 }
 */
router.get(
  "/notifications",
  authenticatePhlebo,
  listNotificationsValidation,
  validate,
  notificationController.list,
);

/**
 * @openapi
 * /api/v1/sample-boy/notifications/unread-count:
 *   get:
 *     tags: [Phlebo Notifications]
 *     summary: Unread notification count (bell badge)
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Unread count fetched successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     unread_count: { type: integer, example: 3 }
 */
// Literal path before the "/:id" route below — same convention as
// `booking.routes.ts`'s `/bookings/today` sitting above `/booking/:id`.
router.get("/notifications/unread-count", authenticatePhlebo, notificationController.unreadCount);

/**
 * @openapi
 * /api/v1/sample-boy/notifications/mark-all-read:
 *   post:
 *     tags: [Phlebo Notifications]
 *     summary: Mark every unread notification as read
 *     description: "`marked_count` is how many rows this call actually flipped — 0 when the list was already clear."
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "All notifications marked as read" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     marked_count: { type: integer, example: 5 }
 */
router.post("/notifications/mark-all-read", authenticatePhlebo, notificationController.markAllRead);

/**
 * @openapi
 * /api/v1/sample-boy/notifications/{id}/read:
 *   post:
 *     tags: [Phlebo Notifications]
 *     summary: Mark one notification as read
 *     description: >
 *       Idempotent — re-marking an already-read notification succeeds. An id
 *       belonging to another phlebo reads as 404, identical to one that does
 *       not exist, so a guessed id can't confirm anything.
 *     security: [{ PhleboBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Marked as read }
 *       404: { description: Notification not found }
 */
router.post(
  "/notifications/:id/read",
  authenticatePhlebo,
  notificationIdParamValidation,
  validate,
  notificationController.markRead,
);

export { router as phleboNotificationRouter };
