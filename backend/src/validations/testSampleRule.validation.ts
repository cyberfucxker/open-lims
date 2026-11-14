import { body, param, query } from "express-validator";

const TEMPERATURE_REQUIREMENTS = [
  "ROOM_TEMPERATURE",
  "REFRIGERATED_2_8",
  "FROZEN_MINUS20",
  "FROZEN_MINUS80",
];

export const testIdParamValidation = [param("testId").isUUID().withMessage("Invalid test id")];

export const listTestSampleRulesValidation = [
  query("search").optional().trim(),
  query("departmentId").optional().trim(),
  query("categoryId").optional().trim(),
  query("sampleTypeId").optional().trim(),
  query("configured").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const upsertTestSampleRuleValidation = [
  ...testIdParamValidation,
  body("containerId").optional({ values: "falsy" }).isUUID().withMessage("Invalid container id"),
  body("requiresFasting")
    .optional()
    .isBoolean()
    .withMessage("requiresFasting must be true or false")
    .toBoolean(),
  body("fastingHours")
    .optional({ values: "falsy" })
    .isInt({ min: 0, max: 72 })
    .withMessage("Fasting hours must be between 0 and 72")
    .toInt(),
  body("isStatAllowed")
    .optional()
    .isBoolean()
    .withMessage("isStatAllowed must be true or false")
    .toBoolean(),
  body("temperatureRequirement")
    .optional()
    .isIn(TEMPERATURE_REQUIREMENTS)
    .withMessage("Invalid temperature requirement"),
  body("minVolumeMl")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Minimum volume cannot be negative")
    .toFloat(),
  body("volumeUnit").optional({ values: "falsy" }).trim().isLength({ max: 10 }),
  body("preparationInstructions").optional({ values: "falsy" }).trim(),
  body("collectionInstructions").optional({ values: "falsy" }).trim(),
  body("postCollectionInstructions").optional({ values: "falsy" }).trim(),
];
