import { body, param, query } from "express-validator";

export const supportTicketIdParamValidation = [
  param("id").isUUID().withMessage("Invalid support ticket id"),
];

export const listSupportTicketsValidation = [
  query("search").optional().trim(),
  query("status").optional().isIn(["OPEN", "IN_PROGRESS", "CLOSED"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const setSupportTicketStatusValidation = [
  ...supportTicketIdParamValidation,
  body("status")
    .isIn(["OPEN", "IN_PROGRESS", "CLOSED"])
    .withMessage("status must be OPEN, IN_PROGRESS or CLOSED"),
];
