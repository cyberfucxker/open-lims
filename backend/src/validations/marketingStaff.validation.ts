import { body, param, query } from "express-validator";

const marketingStaffBodyValidation = [
  body("employeeCode").trim().isLength({ min: 2, max: 30 }).withMessage("Enter employee code"),
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter staff name"),
  body("mobile").trim().isLength({ min: 6, max: 15 }).withMessage("Enter a valid mobile number"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Enter a valid email"),
  body("designation")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Designation must be under 100 characters"),
  body("branchId").optional({ values: "falsy" }).trim(),
  body("joiningDate").isISO8601().withMessage("Enter a valid joining date"),
  body("status").optional().isBoolean().withMessage("status must be true or false").toBoolean(),
];

export const marketingStaffIdParamValidation = [
  param("id").isUUID().withMessage("Invalid marketing staff id"),
];

export const listMarketingStaffValidation = [
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

export const createMarketingStaffValidation = [...marketingStaffBodyValidation];
export const updateMarketingStaffValidation = [
  ...marketingStaffIdParamValidation,
  ...marketingStaffBodyValidation,
];

export const setMarketingStaffStatusValidation = [
  ...marketingStaffIdParamValidation,
  body("status").isBoolean().withMessage("status must be true or false").toBoolean(),
];
