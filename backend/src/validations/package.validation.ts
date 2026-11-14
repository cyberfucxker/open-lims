import { body, param, query } from "express-validator";

/** Membership may arrive as ids (admin pickers) or short names (CSV/API
 *  clients); `package.service.ts#resolveMembership` merges and validates both,
 *  and rejects a payload that names nothing at all. Neither array is required
 *  here on its own for exactly that reason — the "at least one member" rule
 *  spans all four fields and can't be expressed per-field. */
const packageBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter package name"),
  // The CMS category tile — the form's "Category" dropdown.
  body("appCategoryId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid category"),
  // Declared primary specimen; a mixed-specimen package legitimately has none.
  body("sampleTypeId")
    .optional({ nullable: true, values: "falsy" })
    .isUUID()
    .withMessage("Select a valid sample type"),
  body("reportTime")
    .optional({ nullable: true, values: "falsy" })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Report time must be under 50 characters"),
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
  // Rich text (HTML) from the Superadmin editor — same convention as CmsPage
  // content, so no length cap.
  body("description").optional({ nullable: true, values: "falsy" }).trim(),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number").toFloat(),
  body("testIds").optional({ nullable: true }).isArray().withMessage("testIds must be an array"),
  body("testIds.*").isUUID().withMessage("Invalid test id"),
  body("testShortNames")
    .optional({ nullable: true })
    .isArray()
    .withMessage("testShortNames must be an array"),
  body("testShortNames.*")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Invalid test short name"),
  body("parameterIds")
    .optional({ nullable: true })
    .isArray()
    .withMessage("parameterIds must be an array"),
  body("parameterIds.*").isUUID().withMessage("Invalid parameter id"),
  body("parameterShortNames")
    .optional({ nullable: true })
    .isArray()
    .withMessage("parameterShortNames must be an array"),
  body("parameterShortNames.*")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Invalid parameter short name"),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
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
  // Admin-set "N people booked this" display number, and what the patient
  // app's package list sorts by — see `PackageDto.bookedCount`'s doc-comment;
  // nothing derives this automatically.
  body("bookedCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("bookedCount must be a non-negative integer")
    .toInt(),
  // Admin-set manual display order for the Superadmin Packages list only —
  // see `PackageDto.sortOrder`'s doc-comment.
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("sortOrder must be a non-negative integer")
    .toInt(),
];

export const packageIdParamValidation = [param("id").isUUID().withMessage("Invalid package id")];

export const listPackagesValidation = [
  query("search").optional().trim(),
  query("active").optional().isIn(["true", "false", "all"]),
  query("includeDeleted").optional().isIn(["true", "false"]),
  query("appCategoryId").optional().trim(),
  query("sampleTypeId").optional().trim(),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 500 }).toInt(),
];

export const createPackageValidation = [...packageBodyValidation];
export const updatePackageValidation = [...packageIdParamValidation, ...packageBodyValidation];

export const setPackageStatusValidation = [
  ...packageIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const setPackagePopularValidation = [
  ...packageIdParamValidation,
  body("isPopular").isBoolean().withMessage("isPopular must be true or false").toBoolean(),
];
