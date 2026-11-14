import { query } from "express-validator";

export const geocodeSearchValidation = [
  query("q").trim().isLength({ min: 3, max: 200 }).withMessage("q must be at least 3 characters"),
];

export const geocodeReverseValidation = [
  query("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid lat"),
  query("lon").isFloat({ min: -180, max: 180 }).withMessage("Invalid lon"),
];
