import { body, param, query } from "express-validator";

const departmentBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter department name"),
  body("code")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 20 })
    .withMessage("Code must be under 20 characters"),
  body("description").optional({ values: "falsy" }).trim(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const departmentIdParamValidation = [
  param("id").isUUID().withMessage("Invalid department id"),
];

export const listDepartmentsValidation = [
  query("search").optional().trim(),
  query("active")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("active must be true, false or all"),
  query("includeDeleted").optional().isIn(["true", "false"]),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const createDepartmentValidation = [...departmentBodyValidation];
export const updateDepartmentValidation = [
  ...departmentIdParamValidation,
  ...departmentBodyValidation,
];

export const setDepartmentStatusValidation = [
  ...departmentIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
