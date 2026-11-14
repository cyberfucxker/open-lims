import { body, param } from "express-validator";
import { STAFF_MODULES } from "../middleware/staffModule.middleware";
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from "../utils/password.util";

const modulesRule = (optional: boolean) => {
  const chain = body("staffModules");
  return (optional ? chain.optional() : chain)
    .isArray({ min: 1 })
    .withMessage("Select at least one module")
    .bail()
    .custom((value: unknown[]) => value.every((m) => STAFF_MODULES.includes(m as never)))
    .withMessage(`Modules must be any of: ${STAFF_MODULES.join(", ")}`);
};

const passwordRule = body("password")
  .notEmpty()
  .withMessage("Password is required")
  .bail()
  .matches(PASSWORD_POLICY_REGEX)
  .withMessage(PASSWORD_POLICY_MESSAGE);

export const createManagerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Username must be between 3 and 100 characters")
    .bail()
    .matches(/^[A-Za-z0-9._@-]+$/)
    .withMessage("Username can only contain letters, numbers and . _ - @ (no spaces)"),
  body("fullName").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  passwordRule,
  modulesRule(false),
];

export const updateManagerValidation = [
  param("id").isUUID().withMessage("Invalid user id"),
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 150 }),
  modulesRule(true),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

export const resetManagerPasswordValidation = [
  param("id").isUUID().withMessage("Invalid user id"),
  passwordRule,
];
