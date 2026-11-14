import { body, param, query } from "express-validator";

const appCategoryBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter category name"),
  body("imageUrl").optional({ nullable: true }).trim(),
  body("thumbnailUrl").optional({ nullable: true }).trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const appCategoryIdParamValidation = [
  param("id").isUUID().withMessage("Invalid category id"),
];

export const listAppCategoriesValidation = [
  query("search").optional().trim(),
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createAppCategoryValidation = [...appCategoryBodyValidation];
export const updateAppCategoryValidation = [
  ...appCategoryIdParamValidation,
  ...appCategoryBodyValidation,
];

export const setAppCategoryStatusValidation = [
  ...appCategoryIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const reorderAppCategoriesValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID"),
];
