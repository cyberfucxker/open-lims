import { body, param, query } from "express-validator";

export const upsertMonthlyTargetValidation = [
  body("marketingStaffId").isUUID().withMessage("Select a marketing staff member"),
  body("month").isInt({ min: 1, max: 12 }).withMessage("month must be between 1 and 12").toInt(),
  body("year").isInt({ min: 2000, max: 2100 }).withMessage("Enter a valid year").toInt(),
  body("revenueTarget")
    .isFloat({ min: 0 })
    .withMessage("revenueTarget must be a positive number")
    .toFloat(),
  body("doctorTarget")
    .isInt({ min: 0 })
    .withMessage("doctorTarget must be a positive integer")
    .toInt(),
  body("patientTarget")
    .isInt({ min: 0 })
    .withMessage("patientTarget must be a positive integer")
    .toInt(),
];

export const listMonthlyTargetsValidation = [
  query("marketingStaffId").optional().isUUID().withMessage("Invalid marketing staff id"),
  query("month").optional().isInt({ min: 1, max: 12 }).toInt(),
  query("year").optional().isInt({ min: 2000, max: 2100 }).toInt(),
];

export const getMonthlyTargetParamValidation = [
  param("marketingStaffId").isUUID().withMessage("Invalid marketing staff id"),
  param("month").isInt({ min: 1, max: 12 }).toInt(),
  param("year").isInt({ min: 2000, max: 2100 }).toInt(),
];
