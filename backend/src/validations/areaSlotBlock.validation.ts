import { body, param, query } from "express-validator";

export const listAreaSlotBlocksValidation = [
  query("areaId").optional().isUUID(),
  query("dateFrom").optional().isISO8601(),
  query("dateTo").optional().isISO8601(),
];

export const createAreaSlotBlockValidation = [
  body("areaId").isUUID().withMessage("Select an area"),
  body("slotTemplateId").isUUID().withMessage("Select a slot template"),
  body("blockDate").isISO8601().withMessage("Enter a valid date"),
  body("reason").optional({ nullable: true }).trim(),
];

export const areaSlotBlockIdParamValidation = [
  param("id").isUUID().withMessage("Invalid area slot block id"),
];

export const bulkCreateAreaSlotBlockValidation = [
  body("areaId").isUUID().withMessage("Select an area"),
  body("blockDate").isISO8601().withMessage("Enter a valid date"),
  body("slotTemplateIds").isArray({ min: 1 }).withMessage("Select at least one slot template"),
  body("slotTemplateIds.*").isUUID().withMessage("Each slot template id must be valid"),
  body("reason").optional({ nullable: true }).trim(),
];

export const bulkDeleteAreaSlotBlockValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID"),
];
