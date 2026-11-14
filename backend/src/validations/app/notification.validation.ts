import { body, query } from "express-validator";

export const listNotificationsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("per_page")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("per_page must be between 1 and 100")
    .toInt(),
  query("is_read").optional().isIn(["true", "false"]).withMessage("is_read must be true or false"),
  query("type").optional().trim(),
];

export const markNotificationsReadValidation = [
  body("notification_ids").optional().isArray().withMessage("notification_ids must be an array"),
  body("notification_ids.*").isUUID().withMessage("Invalid notification id"),
  body("mark_all_read")
    .optional()
    .isBoolean()
    .withMessage("mark_all_read must be true or false")
    .toBoolean(),
];

export const updateNotificationSettingsValidation = [
  body("push_enabled").isBoolean().withMessage("push_enabled must be true or false").toBoolean(),
];
