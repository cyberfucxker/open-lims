import { body } from "express-validator";
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from "../utils/password.util";

export const loginValidation = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidation = [
  body("username").trim().notEmpty().withMessage("Username is required"),
];

export const resetPasswordValidation = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .matches(PASSWORD_POLICY_REGEX)
    .withMessage(PASSWORD_POLICY_MESSAGE),
];

export const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .matches(PASSWORD_POLICY_REGEX)
    .withMessage(PASSWORD_POLICY_MESSAGE),
];

export const changeUsernameValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newUsername")
    .trim()
    .notEmpty()
    .withMessage("New username is required")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("Username must be between 3 and 100 characters")
    .bail()
    // No spaces: login matches the username exactly, and a stray space is
    // the easiest way to lock yourself out.
    .matches(/^[A-Za-z0-9._@-]+$/)
    .withMessage("Username can only contain letters, numbers and . _ - @ (no spaces)"),
];

export const refreshTokenValidation = [
  body("refreshToken").trim().notEmpty().withMessage("Refresh token is required"),
];

export const logoutValidation = [
  body("refreshToken").trim().notEmpty().withMessage("Refresh token is required"),
];
