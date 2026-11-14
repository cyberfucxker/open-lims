import { body } from "express-validator";

export const updateHomeSeoContentValidation = [
  body("heading").trim().isLength({ min: 1, max: 200 }).withMessage("Enter a heading"),
  body("body").trim().isLength({ min: 1 }).withMessage("Enter the body content"),
];
