import { body, param, query } from "express-validator";

const REFERRAL_TYPES = ["DOCTOR", "HOSPITAL", "CLINIC", "SELF", "CORPORATE", "OTHER"];

const referralSourceBodyValidation = [
  body("referralType").isIn(REFERRAL_TYPES).withMessage("Select a valid referral type"),
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter referral name"),
  body("organizationId").optional({ values: "falsy" }).isUUID().withMessage("Invalid organization"),
  body("mobile").trim().isLength({ min: 6, max: 15 }).withMessage("Enter a valid mobile number"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Enter a valid email"),
  body("speciality")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Speciality must be under 100 characters"),
  body("address").optional({ values: "falsy" }).trim(),
  body("city").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("marketingStaffId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("Invalid marketing staff id"),
  body("assignedPriceListId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("Invalid price list id"),
  body("commissionPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission must be between 0 and 100")
    .toFloat(),
  body("notes").optional({ values: "falsy" }).trim(),
  body("status").optional().isBoolean().withMessage("status must be true or false").toBoolean(),
];

export const referralSourceIdParamValidation = [
  param("id").isUUID().withMessage("Invalid referral source id"),
];

export const listReferralSourcesValidation = [
  query("search").optional().trim(),
  query("active")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("active must be true, false or all"),
  query("includeDeleted").optional().isIn(["true", "false"]),
  query("referralType").optional().isIn(REFERRAL_TYPES).withMessage("Invalid referral type"),
  query("marketingStaffId").optional().isUUID().withMessage("Invalid marketing staff id"),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const createReferralSourceValidation = [...referralSourceBodyValidation];
export const updateReferralSourceValidation = [
  ...referralSourceIdParamValidation,
  ...referralSourceBodyValidation,
];

export const setReferralSourceStatusValidation = [
  ...referralSourceIdParamValidation,
  body("status").isBoolean().withMessage("status must be true or false").toBoolean(),
];

export const assignPriceListValidation = [
  ...referralSourceIdParamValidation,
  body("priceListId").isUUID().withMessage("Select a price list"),
];
