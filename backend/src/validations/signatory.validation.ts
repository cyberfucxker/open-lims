import { body, param, query } from "express-validator";

export const signatoryIdParamValidation = [
  param("id").isUUID().withMessage("Invalid signatory id"),
];

export const listSignatoriesValidation = [
  query("search").optional().trim(),
  query("active").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const writeSignatoryValidation = [
  body("name").trim().isLength({ min: 1, max: 150 }).withMessage("Enter a signatory name"),
  body("title").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("passkey").optional({ values: "falsy" }).trim().isLength({ min: 4, max: 50 }),
  body("active").optional().isBoolean().toBoolean(),
];

export const updateSignatoryValidation = [
  ...signatoryIdParamValidation,
  ...writeSignatoryValidation,
];
