import { body, param, query } from "express-validator";

export const appUserIdParamValidation = [param("id").isUUID().withMessage("Invalid customer id")];

export const listAppUsersValidation = [
  query("search").optional().trim(),
  query("cityId").optional().trim().isUUID().withMessage("Invalid city id"),
  query("isActive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isActive must be true or false"),
  query("registeredFrom")
    .optional()
    .trim()
    .isISO8601()
    .withMessage("registeredFrom must be a valid date"),
  query("registeredTo")
    .optional()
    .trim()
    .isISO8601()
    .withMessage("registeredTo must be a valid date"),
  query("minBalance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minBalance must be a non-negative number")
    .toFloat(),
  query("maxBalance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxBalance must be a non-negative number")
    .toFloat(),
  query("minOrderCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("minOrderCount must be a positive integer")
    .toInt(),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "walletBalance"])
    .withMessage("sortBy must be createdAt or walletBalance"),
  query("sortDir").optional().isIn(["asc", "desc"]).withMessage("sortDir must be asc or desc"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const adjustWalletValidation = [
  ...appUserIdParamValidation,
  body("type").isIn(["CREDIT", "DEBIT"]).withMessage("type must be CREDIT or DEBIT"),
  body("amount").isFloat({ gt: 0 }).withMessage("amount must be a positive number").toFloat(),
  body("reason")
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage("reason must be between 3 and 500 characters"),
];

export const setAppUserStatusValidation = [
  ...appUserIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const updateAppUserValidation = [
  ...appUserIdParamValidation,
  body("name").optional({ nullable: true }).trim().isLength({ min: 1, max: 150 }),
  body("email").optional({ nullable: true }).trim().isEmail().withMessage("Enter a valid email"),
  body("gender")
    .optional({ nullable: true })
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("gender must be MALE, FEMALE or OTHER"),
  body("dob").optional({ nullable: true }).isISO8601().withMessage("Enter a valid date of birth"),
  body("cityId").optional({ nullable: true }).isUUID().withMessage("Invalid city id"),
];
