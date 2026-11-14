import { body, param, query } from "express-validator";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotTemplateBodyValidation = [
  body("title").trim().isLength({ min: 2, max: 100 }).withMessage("Enter a slot title"),
  body("startTime").matches(TIME_REGEX).withMessage("startTime must be in HH:mm format"),
  body("endTime").matches(TIME_REGEX).withMessage("endTime must be in HH:mm format"),
  body("defaultCapacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("defaultCapacity must be a positive integer")
    .toInt(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const slotTemplateIdParamValidation = [
  param("id").isUUID().withMessage("Invalid slot template id"),
];

export const listSlotTemplatesValidation = [
  query("search").optional().trim(),
  query("active").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 200 }).toInt(),
];

export const createSlotTemplateValidation = [...slotTemplateBodyValidation];
export const updateSlotTemplateValidation = [
  ...slotTemplateIdParamValidation,
  ...slotTemplateBodyValidation,
];

export const setSlotTemplateActiveValidation = [
  ...slotTemplateIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
