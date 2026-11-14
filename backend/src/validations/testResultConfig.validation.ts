import { body, param, query } from "express-validator";

export const testIdParamValidation = [param("testId").isUUID().withMessage("Invalid test id")];

export const listTestResultConfigsValidation = [
  query("search").optional().trim(),
  query("departmentId").optional().trim(),
  query("categoryId").optional().trim(),
  query("configured").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const upsertTestResultConfigValidation = [
  ...testIdParamValidation,
  body("unit").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
  body("method").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("criticalLow")
    .optional({ values: "falsy" })
    .isFloat()
    .withMessage("Enter a valid number")
    .toFloat(),
  body("criticalHigh")
    .optional({ values: "falsy" })
    .isFloat()
    .withMessage("Enter a valid number")
    .toFloat(),
  body("decimalPrecision")
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage("Decimal precision must be between 0 and 6")
    .toInt(),
];
