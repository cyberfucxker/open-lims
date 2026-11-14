import { body, param, query } from "express-validator";

const serviceCenterBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter a center name"),
  body("address").trim().isLength({ min: 1 }).withMessage("Enter an address"),
  body("imageUrl").optional({ nullable: true }).trim(),
  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Enter a valid phone number"),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),
  body("website").optional({ nullable: true }).trim(),
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Enter a valid latitude").toFloat(),
  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Enter a valid longitude")
    .toFloat(),
  // Admin-entered, not derived from any review table — see
  // `ServiceCenterWriteData.rating`. Capped at the 0–5 star scale the
  // patient app renders, and at one decimal, which is all `Decimal(2,1)`
  // stores (2.55 would silently round in the DB otherwise).
  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5")
    .toFloat()
    .custom((value: number) => Math.round(value * 10) === value * 10)
    .withMessage("Rating can have at most one decimal place (e.g. 4.5)"),
  body("reviewCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Review count must be 0 or more")
    .toInt(),
  body("openingTime").optional({ nullable: true }).trim(),
  body("closingTime").optional({ nullable: true }).trim(),
  body("centerType")
    .optional({ nullable: true })
    .trim()
    .isIn(["COLLECTION_CENTER", "LAB"])
    .withMessage("centerType must be COLLECTION_CENTER or LAB"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
  body("facilities").optional().isArray().withMessage("facilities must be an array"),
  body("facilities.*").optional().isString(),
  body("paymentMethods").optional().isArray().withMessage("paymentMethods must be an array"),
  body("paymentMethods.*").optional().isString(),
  body("photos").optional().isArray().withMessage("photos must be an array"),
  body("photos.*").optional().isString(),
  body("organizationId")
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage("Invalid franchise"),
];

export const serviceCenterIdParamValidation = [
  param("id").isUUID().withMessage("Invalid service center id"),
];

export const listServiceCentersValidation = [
  query("search").optional().trim(),
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createServiceCenterValidation = [...serviceCenterBodyValidation];
export const updateServiceCenterValidation = [
  ...serviceCenterIdParamValidation,
  ...serviceCenterBodyValidation,
];

export const setServiceCenterStatusValidation = [
  ...serviceCenterIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];
