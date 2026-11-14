import { body, query } from "express-validator";

export const listCatalogValidation = [
  query("city_id").optional({ checkFalsy: true }).isUUID().withMessage("Invalid city_id"),
  query("category_id").optional({ checkFalsy: true }).isUUID().withMessage("Invalid category_id"),
  query("page")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("page_size")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("page_size must be between 1 and 100"),
  query("search").optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
];

export const searchSuggestionsValidation = [
  query("city_id").optional({ checkFalsy: true }).isUUID().withMessage("Invalid city_id"),
  query("q")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("q must be between 2 and 100 characters"),
];

export const addToCartValidation = [
  body("family_member_id")
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage("family_member_id must be a valid id"),
  // Multi-member form. Capped because every id becomes its own cart line —
  // a family list this long is a malformed request, not a real booking.
  body("family_member_ids")
    .optional()
    .isArray({ min: 1, max: 20 })
    .withMessage("family_member_ids must be an array of 1-20 family member ids"),
  body("family_member_ids.*").isUUID().withMessage("family_member_ids must contain valid ids"),
  body("type").isIn(["1", "3"]).withMessage('type must be "1" (package) or "3" (test)'),
  body("type_id").trim().isUUID().withMessage("type_id must be a valid id"),
];
