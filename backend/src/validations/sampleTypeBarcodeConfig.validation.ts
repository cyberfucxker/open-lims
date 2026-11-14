import { body, param, query } from "express-validator";

export const sampleTypeIdParamValidation = [
  param("sampleTypeId").isUUID().withMessage("Invalid sample type id"),
];

export const listSampleTypeBarcodeConfigsValidation = [
  query("search").optional().trim(),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const upsertSampleTypeBarcodeConfigValidation = [
  ...sampleTypeIdParamValidation,
  body("prefix")
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("Enter a barcode prefix (1-10 characters)")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("Prefix must be alphanumeric"),
  body("numberLength")
    .optional()
    .isInt({ min: 4, max: 12 })
    .withMessage("Number length must be between 4 and 12")
    .toInt(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];
