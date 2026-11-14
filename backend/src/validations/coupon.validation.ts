import { body, param, query } from "express-validator";

const couponBodyValidation = [
  body("code").trim().isLength({ min: 2, max: 30 }).withMessage("Enter a coupon code"),
  body("title").trim().isLength({ min: 2, max: 150 }).withMessage("Enter a coupon title"),
  body("discountType")
    .isIn(["FLAT", "PERCENTAGE"])
    .withMessage("discountType must be FLAT or PERCENTAGE"),
  body("applicableOn")
    .optional()
    .isIn(["ALL", "TESTS", "PACKAGES"])
    .withMessage("applicableOn must be ALL, TESTS or PACKAGES"),
  body("platformRestriction")
    .optional()
    .isIn(["ALL", "APP_ONLY", "WEB_ONLY"])
    .withMessage("platformRestriction must be ALL, APP_ONLY or WEB_ONLY"),
  body("discountValue").isFloat({ gt: 0 }).withMessage("Enter a valid discount value").toFloat(),
  body("maxDiscountAmount")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Enter a valid max discount amount")
    .toFloat(),
  body("minSubtotal")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Enter a valid minimum subtotal")
    .toFloat(),
  body("validFrom").optional({ nullable: true }).isISO8601().withMessage("Invalid validFrom date"),
  body("validTo").optional({ nullable: true }).isISO8601().withMessage("Invalid validTo date"),
  body("usageLimitPerUser")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Enter a valid per-user usage limit")
    .toInt(),
  body("totalUsageLimit")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Enter a valid total usage limit")
    .toInt(),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const couponIdParamValidation = [param("id").isUUID().withMessage("Invalid coupon id")];

export const listCouponsValidation = [
  query("search").optional().trim(),
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createCouponValidation = [...couponBodyValidation];
export const updateCouponValidation = [...couponIdParamValidation, ...couponBodyValidation];

export const setCouponStatusValidation = [
  ...couponIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const setCouponHomeFeatureValidation = [
  ...couponIdParamValidation,
  body("showOnHome").isBoolean().withMessage("showOnHome must be true or false").toBoolean(),
];

export const reorderHomeCouponsValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID"),
];
