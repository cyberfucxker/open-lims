import { body, param, query } from "express-validator";

const rechargeOfferBodyValidation = [
  body("rechargeAmount")
    .isFloat({ min: 0 })
    .withMessage("rechargeAmount must be a non-negative number"),
  body("bonusAmount").isFloat({ min: 0 }).withMessage("bonusAmount must be a non-negative number"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const rechargeOfferIdParamValidation = [
  param("id").isUUID().withMessage("Invalid recharge offer id"),
];

export const listRechargeOffersValidation = [
  query("isActive").optional().isIn(["true", "false"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const createRechargeOfferValidation = [...rechargeOfferBodyValidation];
export const updateRechargeOfferValidation = [
  ...rechargeOfferIdParamValidation,
  ...rechargeOfferBodyValidation,
];

export const setRechargeOfferStatusValidation = [
  ...rechargeOfferIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];
