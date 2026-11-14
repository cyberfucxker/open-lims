import { body, param, query } from "express-validator";

const sampleTypeBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter sample type name"),
  body("description").optional({ values: "falsy" }).trim(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const sampleTypeIdParamValidation = [
  param("id").isUUID().withMessage("Invalid sample type id"),
];

export const listSampleTypesValidation = [
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

export const createSampleTypeValidation = [...sampleTypeBodyValidation];
export const updateSampleTypeValidation = [
  ...sampleTypeIdParamValidation,
  ...sampleTypeBodyValidation,
];

export const setSampleTypeStatusValidation = [
  ...sampleTypeIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
