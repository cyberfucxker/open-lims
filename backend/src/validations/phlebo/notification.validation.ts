import { param, query } from "express-validator";
import { NOTIFICATION_TYPE_SLUGS } from "../../services/phlebo/notification.service";

export const notificationIdParamValidation = [
  param("id").isUUID().withMessage("Invalid notification id"),
];

export const listNotificationsValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  // Same 500 ceiling as this module's booking lists — the app asks for 100.
  query("per_page").optional().isInt({ min: 1, max: 500 }).toInt(),
  query("is_read").optional().isIn(["true", "false"]).withMessage("is_read must be true or false"),
  // Slugs come from the service's own map, so a new enum value can't be
  // added there and silently stay unfilterable here.
  query("type").optional().isIn(NOTIFICATION_TYPE_SLUGS).withMessage("Invalid type"),
];
