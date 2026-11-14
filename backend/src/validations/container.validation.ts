import { body, param, query } from "express-validator";

const containerBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter container name"),
  body("code")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 20 })
    .withMessage("Code must be under 20 characters"),
  body("color")
    .optional({ values: "falsy" })
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Color must be a hex value like #RRGGBB"),
  body("description").optional({ values: "falsy" }).trim(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const containerIdParamValidation = [
  param("id").isUUID().withMessage("Invalid container id"),
];

export const listContainersValidation = [
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

export const createContainerValidation = [...containerBodyValidation];
export const updateContainerValidation = [
  ...containerIdParamValidation,
  ...containerBodyValidation,
];

export const setContainerStatusValidation = [
  ...containerIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
