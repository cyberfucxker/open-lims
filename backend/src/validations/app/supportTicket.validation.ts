import { body } from "express-validator";

export const reportIssueValidation = [
  body("subject")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("subject is required (max 255 chars)"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("description must be 10-2000 characters"),
  // Optional — older/other clients that don't send it keep working exactly
  // as before; the patient-web Feedback screen now always sends it.
  body("type").optional({ values: "falsy" }).isIn(["complaint", "feedback"]),
];
