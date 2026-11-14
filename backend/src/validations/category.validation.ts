import { body, param, query } from "express-validator";

const categoryBodyValidation = [
  body("departmentId").isUUID().withMessage("Select department"),
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter category name"),
  body("code")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 20 })
    .withMessage("Code must be under 20 characters"),
  body("description").optional({ values: "falsy" }).trim(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const categoryIdParamValidation = [param("id").isUUID().withMessage("Invalid category id")];

export const listCategoriesValidation = [
  query("search").optional().trim(),
  query("active")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("active must be true, false or all"),
  query("includeDeleted").optional().isIn(["true", "false"]),
  query("departmentId").optional().isUUID().withMessage("Invalid department id"),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const createCategoryValidation = [...categoryBodyValidation];
export const updateCategoryValidation = [...categoryIdParamValidation, ...categoryBodyValidation];

export const setCategoryStatusValidation = [
  ...categoryIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
