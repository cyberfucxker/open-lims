import { body, param, query } from "express-validator";

export const getCitySlotConfigValidation = [
  query("cityId").isUUID().withMessage("Invalid city id"),
];

export const assignCitySlotTemplatesValidation = [
  body("cityId").isUUID().withMessage("Invalid city id"),
  body("slotTemplateIds").isArray().withMessage("slotTemplateIds must be an array"),
  body("slotTemplateIds.*").isUUID().withMessage("Each slot template id must be valid"),
];

export const setCityCutoverValidation = [
  param("cityId").isUUID().withMessage("Invalid city id"),
  body("useNewSlotSystem")
    .isBoolean()
    .withMessage("useNewSlotSystem must be true or false")
    .toBoolean(),
];

export const setCityPhlebotomyChargeValidation = [
  param("cityId").isUUID().withMessage("Invalid city id"),
  body("phlebotomyCharge")
    .isFloat({ min: 0 })
    .withMessage("phlebotomyCharge must be a non-negative number")
    .toFloat(),
];

export const setCityParentOrganizationValidation = [
  param("cityId").isUUID().withMessage("Invalid city id"),
  body("organizationId").optional({ nullable: true }).isUUID().withMessage("Invalid franchise id"),
];
