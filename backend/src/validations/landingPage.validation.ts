import { body, param } from "express-validator";

export const landingPageIdParamValidation = [
  param("id").isUUID().withMessage("Invalid landing page id"),
];

export const landingPageBodyValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Name is required (max 150 characters)"),
  body("slug")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 120 })
    .matches(/^[a-zA-Z0-9-\s]+$/)
    .withMessage("Slug may only contain letters, numbers and hyphens"),
  body("title")
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Title is required (max 150 characters)"),
  body("cityId").isUUID().withMessage("Select a city"),
  body("packageIds").isArray({ min: 1, max: 12 }).withMessage("Add between 1 and 12 packages"),
  body("packageIds.*").isUUID().withMessage("Invalid package"),
  body("desktopBannerUrl").optional({ values: "null" }).isString().isLength({ max: 500 }),
  body("mobileBannerUrl").optional({ values: "null" }).isString().isLength({ max: 500 }),
  body("validFrom").isISO8601().withMessage("Enter a start date"),
  body("validTo").isISO8601().withMessage("Enter an end date"),
  body("isActive").optional().isBoolean(),
];

export const landingPageStatusValidation = [
  ...landingPageIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false"),
];

export const landingPageSlugParamValidation = [
  param("slug")
    .trim()
    .matches(/^[a-z0-9-]{1,120}$/)
    .withMessage("Invalid offer link"),
];
