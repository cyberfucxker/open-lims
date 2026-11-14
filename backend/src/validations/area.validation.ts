import { body, param, query } from "express-validator";

const areaBodyValidation = [
  body("cityId").isUUID().withMessage("Select a city"),
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter area name"),
  body("pincodes").optional().isArray().withMessage("pincodes must be an array"),
  body("pincodes.*").optional().isString().trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const areaIdParamValidation = [param("id").isUUID().withMessage("Invalid area id")];

export const listAreasValidation = [
  query("cityId").optional().isUUID(),
  query("search").optional().trim(),
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 200 }).toInt(),
];

export const createAreaValidation = [...areaBodyValidation];
export const updateAreaValidation = [...areaIdParamValidation, ...areaBodyValidation];

export const setAreaStatusValidation = [
  ...areaIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const setAreaPhlebotomyChargeValidation = [
  ...areaIdParamValidation,
  body("phlebotomyCharge")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("phlebotomyCharge must be a non-negative number")
    .toFloat(),
];
