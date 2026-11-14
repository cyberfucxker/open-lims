import { body, param, query } from "express-validator";

const cityBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter city name"),
  body("stateId").isUUID().withMessage("Select a state"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false")
    .toBoolean(),
];

export const cityIdParamValidation = [param("id").isUUID().withMessage("Invalid city id")];

export const listCitiesValidation = [
  query("search").optional().trim(),
  query("active")
    .optional()
    .isIn(["true", "false", "all"])
    .withMessage("active must be true, false or all"),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];

export const createCityValidation = [...cityBodyValidation];
export const updateCityValidation = [...cityIdParamValidation, ...cityBodyValidation];

export const setCityStatusValidation = [
  ...cityIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
