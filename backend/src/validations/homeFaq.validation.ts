import { body, param, query } from "express-validator";

const homeFaqBodyValidation = [
  body("question").trim().isLength({ min: 1, max: 300 }).withMessage("Enter the FAQ question"),
  body("answer").trim().isLength({ min: 1 }).withMessage("Enter the FAQ answer"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const homeFaqIdParamValidation = [param("id").isUUID().withMessage("Invalid FAQ id")];

export const listHomeFaqsValidation = [
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createHomeFaqValidation = [...homeFaqBodyValidation];
export const updateHomeFaqValidation = [...homeFaqIdParamValidation, ...homeFaqBodyValidation];

export const setHomeFaqStatusValidation = [
  ...homeFaqIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const reorderHomeFaqsValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID"),
];
