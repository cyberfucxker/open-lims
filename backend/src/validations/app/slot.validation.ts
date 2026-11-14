import { query } from "express-validator";

export const slotAvailabilityValidation = [
  query("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be in yyyy-MM-dd format"),
  query("address_id").optional().isUUID().withMessage("Invalid address_id"),
  query("order_id").optional().isUUID().withMessage("Invalid order_id"),
];
