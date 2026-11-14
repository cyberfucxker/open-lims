import { body, param } from "express-validator";

const stateBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter the state name"),
  body("code")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("A state code is 2 to 10 characters"),
];

export const stateIdParamValidation = [param("id").isUUID().withMessage("Invalid state id")];

export const createStateValidation = [...stateBodyValidation];
export const updateStateValidation = [...stateIdParamValidation, ...stateBodyValidation];
