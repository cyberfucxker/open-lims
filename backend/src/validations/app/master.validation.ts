import { query } from "express-validator";

export const listCitiesValidation = [
  query("state_id").optional({ checkFalsy: true }).isUUID().withMessage("Invalid state_id"),
  query("search").optional({ checkFalsy: true }).trim().isString(),
  // Curated "major city" list for the Home page's "Near You" SEO sections —
  // see `City.isFeatured`'s doc-comment.
  query("featured").optional().isIn(["true", "false"]),
];
