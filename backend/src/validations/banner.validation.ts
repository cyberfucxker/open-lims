import { body, param, query } from "express-validator";

const bannerBodyValidation = [
  body("imageUrl").trim().isLength({ min: 1 }).withMessage("Enter a banner image URL"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
  body("validFrom").optional({ nullable: true }).isISO8601().withMessage("Invalid valid-from date"),
  body("validUntil")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Invalid valid-until date"),
];

export const bannerIdParamValidation = [param("id").isUUID().withMessage("Invalid banner id")];

export const listBannersValidation = [
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createBannerValidation = [...bannerBodyValidation];
export const updateBannerValidation = [...bannerIdParamValidation, ...bannerBodyValidation];

export const setBannerStatusValidation = [
  ...bannerIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const reorderBannersValidation = [
  body("ids").isArray({ min: 1 }).withMessage("ids must be a non-empty array"),
  body("ids.*").isUUID().withMessage("Each id must be a valid UUID"),
];
