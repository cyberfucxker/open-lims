import { body } from "express-validator";

const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const phleboCompleteProfileValidation = [
  body("name").trim().isLength({ min: 1, max: 150 }).withMessage("Name is required"),
  body("sex").isIn(["Male", "Female", "Other"]).withMessage("sex must be Male, Female or Other"),
  body("d_o_b").matches(DOB_REGEX).withMessage("d_o_b must be in YYYY-MM-DD format"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Enter a valid email address"),
  body("address").trim().isLength({ min: 1 }).withMessage("Address is required"),
];

export const phleboUpdateProfileValidation = [
  body("name").optional().trim().isLength({ min: 1, max: 150 }).withMessage("Name cannot be empty"),
  body("sex")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("sex must be Male, Female or Other"),
  body("d_o_b").optional().matches(DOB_REGEX).withMessage("d_o_b must be in YYYY-MM-DD format"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Enter a valid email address"),
  body("address").optional().trim().isLength({ min: 1 }).withMessage("Address cannot be empty"),
];
