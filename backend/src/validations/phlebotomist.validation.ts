import { body, param, query } from "express-validator";

const phlebotomistBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter phlebotomist name"),
  body("mobile")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Enter a valid mobile number"),
  body("photoUrl").optional({ nullable: true }).trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
  body("cityId").optional({ nullable: true }).isUUID().withMessage("Invalid city id"),
  body("workingHoursStart")
    .optional({ nullable: true })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("workingHoursStart must be in HH:mm format"),
  body("workingHoursEnd")
    .optional({ nullable: true })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("workingHoursEnd must be in HH:mm format"),
  body("serviceAreaIds").optional().isArray().withMessage("serviceAreaIds must be an array"),
  body("serviceAreaIds.*").optional().isUUID().withMessage("Each service area id must be valid"),
];

export const phlebotomistIdParamValidation = [
  param("id").isUUID().withMessage("Invalid phlebotomist id"),
];

export const listPhlebotomistsValidation = [
  query("search").optional().trim(),
  query("isActive").optional().isIn(["true", "false"]),
  query("cityId").optional().isUUID(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createPhlebotomistValidation = [...phlebotomistBodyValidation];
export const updatePhlebotomistValidation = [
  ...phlebotomistIdParamValidation,
  ...phlebotomistBodyValidation,
];

export const setPhlebotomistStatusValidation = [
  ...phlebotomistIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];
