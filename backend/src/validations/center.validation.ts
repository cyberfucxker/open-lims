import { body, param, query } from "express-validator";

const centerBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter center name"),
  body("code")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 20 })
    .withMessage("Code must be under 20 characters"),
  body("address").optional({ values: "falsy" }).trim(),
  body("city").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const centerIdParamValidation = [param("id").isUUID().withMessage("Invalid center id")];

export const listCentersValidation = [
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

export const createCenterValidation = [...centerBodyValidation];
export const updateCenterValidation = [...centerIdParamValidation, ...centerBodyValidation];

export const setCenterStatusValidation = [
  ...centerIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
