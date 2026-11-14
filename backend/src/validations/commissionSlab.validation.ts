import { body, param } from "express-validator";

const commissionSlabBodyValidation = [
  body("fromAmount")
    .isFloat({ min: 0 })
    .withMessage("fromAmount must be a positive number")
    .toFloat(),
  body("toAmount")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("toAmount must be a positive number")
    .toFloat(),
  body("percentage")
    .isFloat({ min: 0, max: 100 })
    .withMessage("percentage must be between 0 and 100")
    .toFloat(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const commissionSlabIdParamValidation = [
  param("id").isUUID().withMessage("Invalid commission slab id"),
];

export const createCommissionSlabValidation = [...commissionSlabBodyValidation];
export const updateCommissionSlabValidation = [
  ...commissionSlabIdParamValidation,
  ...commissionSlabBodyValidation,
];

export const setCommissionSlabStatusValidation = [
  ...commissionSlabIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];
