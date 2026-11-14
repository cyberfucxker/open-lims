import { body, param } from "express-validator";

export const submitPrescriptionValidation = [
  body("family_member_id").trim().isUUID().withMessage("Select who this prescription is for"),
  body("city_id").trim().isUUID().withMessage("Select a city"),
  body("query")
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage("query must be under 1000 characters"),
];

export const prescriptionIdParamValidation = [
  param("id").isUUID().withMessage("Invalid prescription id"),
];
