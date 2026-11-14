import { body, param, query } from "express-validator";

const priceListBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter price list name"),
  body("description").optional({ values: "falsy" }).trim(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const priceListIdParamValidation = [
  param("id").isUUID().withMessage("Invalid price list id"),
];

export const listPriceListsValidation = [
  query("ownership").optional().isIn(["template", "franchise"]),
  query("search").optional().trim(),
  query("active").optional().isIn(["true", "false", "all"]),
  query("includeDeleted").optional().isIn(["true", "false"]),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createPriceListValidation = [...priceListBodyValidation];
export const updatePriceListValidation = [
  ...priceListIdParamValidation,
  ...priceListBodyValidation,
];

export const setPriceListStatusValidation = [
  ...priceListIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const setPriceListItemsValidation = [
  ...priceListIdParamValidation,
  body().isArray().withMessage("Body must be an array of { testId, price }"),
  body("*.testId").isUUID().withMessage("Invalid testId"),
  body("*.price").isFloat({ min: 0 }).withMessage("price must be a positive number").toFloat(),
];

/** Full-catalogue pricing (TEST+PACKAGE+PARAMETER together) — the admin price
 *  editor's write side. Same item shape as the franchise self-service
 *  endpoint's `setPriceListItemsValidation` in `franchise.validation.ts`. */
export const setPriceListPricingValidation = [
  ...priceListIdParamValidation,
  body("items").isArray().withMessage("items must be an array"),
  body("items.*.itemType")
    .isIn(["TEST", "PACKAGE", "PARAMETER"])
    .withMessage("itemType must be TEST, PACKAGE or PARAMETER"),
  body("items.*.itemId").isUUID().withMessage("Invalid item id"),
  body("items.*.price").isFloat({ min: 0 }).withMessage("Price must be zero or greater").toFloat(),
  body("items.*.isOffered")
    .optional()
    .isBoolean()
    .withMessage("isOffered must be true or false")
    .toBoolean(),
];
