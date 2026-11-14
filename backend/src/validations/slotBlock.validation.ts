import { body, param, query } from "express-validator";

export const listSlotBlocksValidation = [
  query("cityId").optional().isUUID(),
  query("dateFrom").optional().isISO8601(),
  query("dateTo").optional().isISO8601(),
];

export const createSlotBlockValidation = [
  body("cityId").isUUID().withMessage("Select a city"),
  body("slotTemplateId").isUUID().withMessage("Select a slot template"),
  body("blockDate").isISO8601().withMessage("Enter a valid date"),
  body("reason").optional({ nullable: true }).trim(),
];

export const slotBlockIdParamValidation = [
  param("id").isUUID().withMessage("Invalid slot block id"),
];

export const bulkCreateSlotBlockValidation = [
  body("cityId").isUUID().withMessage("Select a city"),
  body("blockDate").isISO8601().withMessage("Enter a valid date"),
  body("slotTemplateIds").isArray({ min: 1 }).withMessage("Select at least one slot template"),
  body("slotTemplateIds.*").isUUID().withMessage("Each slot template id must be valid"),
  body("reason").optional({ nullable: true }).trim(),
];

export const bulkDeleteSlotBlockValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID"),
];
