import { body, param, query } from "express-validator";

export const reviewCartValidation = [
  body("address_id").trim().isUUID().withMessage("Invalid address_id"),
  body("slot_id").trim().isUUID().withMessage("Invalid slot_id"),
  body("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be in yyyy-MM-dd format"),
];

export const confirmOrderValidation = [
  body("order_id").trim().isUUID().withMessage("Invalid order_id"),
  body("payment_type")
    .isIn(["cash", "online"])
    .withMessage('payment_type must be "cash" or "online"'),
];

export const listOrdersValidation = [
  query("status").optional().isIn(["all", "upcoming", "past"]).withMessage("Invalid status"),
];

export const orderIdParamValidation = [param("id").isUUID().withMessage("Invalid order id")];

export const rescheduleOrderValidation = [
  param("orderId").isUUID().withMessage("Invalid order id"),
  // Same pair Review Cart takes, minus `address_id` — a reschedule keeps the
  // booking's own address (see `order.service.ts#rescheduleOrder`).
  body("slot_id").trim().isUUID().withMessage("Invalid slot_id"),
  body("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be in yyyy-MM-dd format"),
];

export const cancelOrderValidation = [
  param("orderId").isUUID().withMessage("Invalid order id"),
  body("reason").trim().isLength({ min: 1, max: 500 }).withMessage("Enter a cancellation reason"),
];

export const createHomeVisitValidation = [
  body("family_member_id").trim().isUUID().withMessage("Invalid family_member_id"),
  body("address_id").trim().isUUID().withMessage("Invalid address_id"),
  body("slot_id").trim().isUUID().withMessage("Invalid slot_id"),
  body("date")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be in yyyy-MM-dd format"),
  body("symptom_notes")
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("Describe the problem in a few words (3-1000 characters)"),
  body("service_center_id")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Invalid service_center_id"),
];
