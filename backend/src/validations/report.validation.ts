import { body, param, query } from "express-validator";

const VIEW_STATUSES = [
  "all",
  "pending",
  "received",
  "processing",
  "partial",
  "approved",
  "submitted",
  "printed",
  "cancelled",
];
const RESULT_FLAGS = ["NORMAL", "LOW", "HIGH", "CRITICAL_LOW", "CRITICAL_HIGH"];

export const reportIdParamValidation = [param("id").isUUID().withMessage("Invalid report id")];
export const appointmentIdParamValidation = [
  param("appointmentId").isUUID().withMessage("Invalid appointment id"),
];
export const testResultIdParamValidation = [
  ...reportIdParamValidation,
  param("resultId").isUUID().withMessage("Invalid test result id"),
];

export const listReportsValidation = [
  query("view").optional().isIn(VIEW_STATUSES).withMessage("Invalid view"),
  query("search").optional().trim(),
  query("dateFrom").optional().isISO8601().withMessage("dateFrom must be a valid date"),
  query("dateTo").optional().isISO8601().withMessage("dateTo must be a valid date"),
  query("emergency")
    .optional()
    .isBoolean()
    .withMessage("emergency must be true or false")
    .toBoolean(),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const saveResultsValidation = [
  ...reportIdParamValidation,
  body("results").isArray({ min: 1 }).withMessage("Provide at least one result line"),
  body("results.*.appointmentTestId").isUUID().withMessage("Invalid appointment test id"),
  body("results.*.resultValue").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
  body("results.*.unit").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
  body("results.*.referenceRange").optional({ values: "falsy" }).trim(),
  body("results.*.method").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("results.*.remarks").optional({ values: "falsy" }).trim(),
  body("results.*.flag").optional().isIn(RESULT_FLAGS).withMessage("Invalid result flag"),
  body("results.*.isCritical").optional().isBoolean().toBoolean(),
];

export const saveTestResultValidation = [
  ...testResultIdParamValidation,
  body("resultValue").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
  body("unit").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
  body("referenceRange").optional({ values: "falsy" }).trim(),
  body("method").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("remarks").optional({ values: "falsy" }).trim(),
  body("flag").optional().isIn(RESULT_FLAGS).withMessage("Invalid result flag"),
  body("isCritical").optional().isBoolean().toBoolean(),
  body("autoCalculate").optional().isBoolean().toBoolean(),
  body("parameters").optional().isArray(),
  body("parameters.*.id").optional().isUUID().withMessage("Invalid parameter result id"),
  body("parameters.*.resultValue").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
  body("parameters.*.machineValue").optional({ values: "falsy" }).trim().isLength({ max: 500 }),
  body("parameters.*.flag").optional().isIn(RESULT_FLAGS).withMessage("Invalid result flag"),
  body("parameters.*.highlight").optional().isBoolean().toBoolean(),
];

export const approveTestResultValidation = [
  ...testResultIdParamValidation,
  body("signatoryIds").isArray().withMessage("signatoryIds must be an array"),
  body("signatoryIds.*").isUUID().withMessage("Invalid signatory id"),
];

export const rejectTestResultValidation = [
  ...testResultIdParamValidation,
  body("reason").trim().isLength({ min: 3, max: 500 }).withMessage("Enter a reason"),
];

export const rejectReportValidation = [
  ...reportIdParamValidation,
  body("reason").trim().isLength({ min: 3, max: 500 }).withMessage("Enter a reason"),
];

export const cancelReportValidation = [
  ...reportIdParamValidation,
  body("reason").trim().isLength({ min: 3, max: 500 }).withMessage("Enter a cancellation reason"),
];

export const combinedPdfValidation = [
  ...reportIdParamValidation,
  body("resultIds").isArray({ min: 1 }).withMessage("Select at least one test"),
  body("resultIds.*").isUUID().withMessage("Invalid test result id"),
  body("withLetterhead").optional().isBoolean().toBoolean(),
  body("withPageBreak").optional().isBoolean().toBoolean(),
  body("withDepartmentWise").optional().isBoolean().toBoolean(),
  body("withVitals").optional().isBoolean().toBoolean(),
];

export const printBatchValidation = [
  body("ids").isArray({ min: 1 }).withMessage("Select at least one report"),
  body("ids.*").isUUID().withMessage("Invalid report id in selection"),
];
