import { body, param, query } from "express-validator";

const testBodyValidation = [
  body("name").trim().isLength({ min: 3 }).withMessage("Enter test name"),
  body("shortName")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Short name is required and must be under 30 characters"),
  // The CMS category tile — the form's "Category" dropdown.
  body("appCategoryId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid category"),
  // The lab's internal taxonomy. Optional since the admin form no longer
  // collects it; `test.service.ts` still enforces that a lab category comes with
  // its department.
  body("departmentId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid department"),
  body("categoryId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid lab category"),
  body("sampleTypeId").isUUID().withMessage("Select sample type"),
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
    .isIn(["MALE", "FEMALE", "BOTH"])
    .withMessage("Recommended for must be one of: MALE, FEMALE, BOTH"),
  body("recommendedAge")
    .optional({ nullable: true, values: "falsy" })
    .trim()
    .isLength({ max: 60 })
    .withMessage("Recommended age must be under 60 characters"),
  // Branch availability. Omitting the key leaves it alone; `[]` clears it back
  // to "available at every branch" (see the `TestBranchUser` model doc-comment).
  body("branchUserIds")
    .optional({ nullable: true })
    .isArray()
    .withMessage("branchUserIds must be an array"),
  body("branchUserIds.*").isUUID().withMessage("Invalid branch user id"),
  body("price").isFloat({ min: 1 }).withMessage("Enter a valid price").toFloat(),
  body("reportTime").trim().notEmpty().withMessage("Select report time"),
  body("status").isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive"),
  body("description").optional({ nullable: true, values: "falsy" }).trim(),
  body("content").optional({ nullable: true, values: "falsy" }).trim(),
  body("offerPrice")
    .optional({ nullable: true, values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Offer price must be a positive number")
    .toFloat(),
  body("isPopular")
    .optional()
    .isBoolean()
    .withMessage("isPopular must be true or false")
    .toBoolean(),
  // Admin-set "N people booked this" display number — see
  // `LabTest.bookedCount`'s doc-comment; nothing derives this automatically.
  body("bookedCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("bookedCount must be a non-negative integer")
    .toInt(),
  // Admin-set manual display order for the Superadmin Tests list only — see
  // `LabTest.sortOrder`'s doc-comment.
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer")
    .toInt(),
  // Attached analytes. Omitting the key entirely leaves existing attachments
  // untouched on update; sending `[]` detaches all of them. Array ORDER is the
  // persisted sortOrder, so no separate order field is accepted here.
  body("parameters")
    .optional({ nullable: true })
    .isArray()
    .withMessage("parameters must be an array"),
  body("parameters.*.parameterId").isUUID().withMessage("Invalid parameter id"),
  body("parameters.*.unit").optional({ values: "falsy" }).trim().isLength({ max: 30 }),
  body("parameters.*.referenceRangeText").optional({ values: "falsy" }).trim(),
  body("parameters.*.referenceRangeLow")
    .optional({ values: "falsy" })
    .isFloat()
    .withMessage("Enter a valid number")
    .toFloat(),
  body("parameters.*.referenceRangeHigh")
    .optional({ values: "falsy" })
    .isFloat()
    .withMessage("Enter a valid number")
    .toFloat(),
  body("parameters.*.formula").optional({ values: "falsy" }).trim(),
  body("parameters.*.active").optional().isBoolean().toBoolean(),
];

export const testIdParamValidation = [param("id").isUUID().withMessage("Invalid test id")];

export const listTestsValidation = [
  query("search").optional().trim(),
  query("categoryId").optional().trim(),
  query("departmentId").optional().trim(),
  query("appCategoryId").optional().trim(),
  query("status").optional().trim(),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("pageSize must be between 1 and 500")
    .toInt(),
];

export const createTestValidation = [...testBodyValidation];

export const updateTestValidation = [...testIdParamValidation, ...testBodyValidation];

export const setTestPopularValidation = [
  ...testIdParamValidation,
  body("isPopular").isBoolean().withMessage("isPopular must be true or false").toBoolean(),
];

/** `orderedIds` are `TestParameter` join-row ids (`LabTest.parameters[].id`),
 *  not Parameter ids. */
export const reorderTestParametersValidation = [
  ...testIdParamValidation,
  body("orderedIds").isArray({ min: 1 }).withMessage("orderedIds must be a non-empty array"),
  body("orderedIds.*").isUUID().withMessage("Invalid parameter id in orderedIds"),
];
