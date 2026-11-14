import { body, param, query } from "express-validator";

const SAMPLE_COLLECTION_MODES = ["HOME", "LAB", "BOTH"];
const RECOMMENDED_GENDERS = ["MALE", "FEMALE", "BOTH"];

const parameterBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter a parameter name"),
  body("shortName")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Short name is required and must be under 30 characters"),
  // Labelled "MRP" in the admin form; the field name stays `price` so every
  // existing consumer (packages, billing, CSV) keeps working unchanged.
  body("price").isFloat({ min: 0 }).withMessage("Enter a valid MRP").toFloat(),
  body("offerPrice")
    .optional({ nullable: true, values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Offer price must be a positive number")
    .toFloat(),
  // Whether this analyte can also be sold on its own — see the `Parameter`
  // Prisma model doc-comment.
  body("doTest").optional().isBoolean().withMessage("doTest must be true or false").toBoolean(),
  // Curated "actually order this a lot" flag — see the `Parameter` Prisma
  // model doc-comment. Cross-field consistency with `doTest` is enforced in
  // `parameter.service.ts`, not here.
  body("isCommonlyUsed")
    .optional()
    .isBoolean()
    .withMessage("isCommonlyUsed must be true or false")
    .toBoolean(),
  // Admin-set manual display order for the Superadmin Parameters list only —
  // see `ParameterDto.sortOrder`'s doc-comment.
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer")
    .toInt(),
  body("sampleTypeId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid sample type"),
  // The lab's internal taxonomy (same `Department` table `Test` uses) —
  // purely informational, see `ParameterDto.departmentId`'s doc-comment.
  body("departmentId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid department"),
  body("appCategoryId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid category"),
  body("reportTime")
    .optional({ nullable: true, values: "falsy" })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Report time must be under 50 characters"),
  body("sampleCollection")
    .optional()
    .isIn(SAMPLE_COLLECTION_MODES)
    .withMessage(`Sample collection must be one of: ${SAMPLE_COLLECTION_MODES.join(", ")}`),
  body("isFastingRequired")
    .optional()
    .isBoolean()
    .withMessage("isFastingRequired must be true or false")
    .toBoolean(),
  body("fastingHours")
    .optional({ nullable: true, values: "falsy" })
    .isInt({ min: 1, max: 48 })
    .withMessage("Fasting hours must be between 1 and 48")
    .toInt(),
  body("followUpDays")
    .optional({ nullable: true, values: "falsy" })
    .isInt({ min: 1, max: 1095 })
    .withMessage("Repeat after must be between 1 and 1095 days")
    .toInt(),
  body("followUpTemplate")
    .optional({ nullable: true, values: "falsy" })
    .trim()
    .matches(/^[a-z0-9_]{1,100}$/)
    .withMessage("Template name may only use lowercase letters, numbers and underscores"),
  body("recommendedFor")
    .optional()
    .isIn(RECOMMENDED_GENDERS)
    .withMessage(`Recommended for must be one of: ${RECOMMENDED_GENDERS.join(", ")}`),
  body("recommendedAge")
    .optional({ nullable: true, values: "falsy" })
    .trim()
    .isLength({ max: 60 })
    .withMessage("Recommended age must be under 60 characters"),
  // Rich text (HTML) from the Superadmin editor — same convention as CmsPage
  // content, so no length cap and no sanitisation here beyond trimming.
  body("description").optional({ nullable: true, values: "falsy" }).trim(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const parameterIdParamValidation = [
  param("id").isUUID().withMessage("Invalid parameter id"),
];

export const listParametersValidation = [
  query("search").optional().trim(),
  query("doTest").optional().isIn(["true", "false", "all"]),
  query("active").optional().isIn(["true", "false", "all"]),
  query("sampleTypeId").optional().trim(),
  query("departmentId").optional().trim(),
  query("appCategoryId").optional().trim(),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("pageSize must be between 1 and 500")
    .toInt(),
];

export const createParameterValidation = [...parameterBodyValidation];

export const updateParameterValidation = [
  ...parameterIdParamValidation,
  ...parameterBodyValidation,
];
