import { query } from "express-validator";

/** Same `city_id` shape as `catalog.validation.ts`'s `listCatalogValidation` —
 *  optional, since a guest may not have picked a city yet. */
export const getHomeValidation = [
  query("city_id").optional({ checkFalsy: true }).isUUID().withMessage("Invalid city_id"),
];
