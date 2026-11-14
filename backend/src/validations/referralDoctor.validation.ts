import { body, param, query } from "express-validator";

const referralDoctorBodyValidation = [
  body("doctorName").trim().isLength({ min: 2, max: 150 }).withMessage("Enter doctor name"),
  body("hospitalName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Hospital name must be under 150 characters"),
  body("speciality")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Speciality must be under 100 characters"),
  body("mobile")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 6, max: 15 })
    .withMessage("Enter a valid mobile number"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Enter a valid email"),
  body("city").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("address").optional({ values: "falsy" }).trim(),
  body("remarks").optional({ values: "falsy" }).trim(),
  body("marketingStaffId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("Invalid marketing staff id"),
  body("status").optional().isBoolean().withMessage("status must be true or false").toBoolean(),
];

export const referralDoctorIdParamValidation = [
  param("id").isUUID().withMessage("Invalid referral doctor id"),
];

export const listReferralDoctorsValidation = [
  query("search").optional().trim(),
  query("active")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("active must be true, false or all"),
  query("includeDeleted").optional().isIn(["true", "false"]),
  query("marketingStaffId").optional().isUUID().withMessage("Invalid marketing staff id"),
  query("unassignedOnly").optional().isIn(["true", "false"]),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const createReferralDoctorValidation = [...referralDoctorBodyValidation];
export const updateReferralDoctorValidation = [
  ...referralDoctorIdParamValidation,
  ...referralDoctorBodyValidation,
];

export const setReferralDoctorStatusValidation = [
  ...referralDoctorIdParamValidation,
  body("status").isBoolean().withMessage("status must be true or false").toBoolean(),
];

export const assignReferralDoctorValidation = [
  ...referralDoctorIdParamValidation,
  body("marketingStaffId").isUUID().withMessage("Select a marketing staff member"),
];

export const bulkAssignReferralDoctorsValidation = [
  body("doctorIds").isArray({ min: 1 }).withMessage("Select at least one referral doctor"),
  body("doctorIds.*").isUUID().withMessage("Invalid referral doctor id"),
  body("marketingStaffId").isUUID().withMessage("Select a marketing staff member"),
];
