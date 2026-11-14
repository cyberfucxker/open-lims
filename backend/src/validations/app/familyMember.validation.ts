import { body } from "express-validator";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const DOB_REGEX = /^\d{2}[-/]\d{2}[-/]\d{4}$/;
const RELATIONS = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];

export const addFamilyMemberValidation = [
  body("name").trim().isLength({ min: 1, max: 150 }).withMessage("Name is required"),
  // Optional — a family member with no phone of their own falls back to the
  // account holder's mobile (see `familyMember.service.ts#addFamilyMember`).
  body("mobile_no")
    .optional({ checkFalsy: true })
    .trim()
    .matches(MOBILE_REGEX)
    .withMessage("Enter a valid 10-digit mobile number"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Enter a valid email address"),
  // Either an exact `dob` or a plain `age` is accepted — `Patient.dob` is
  // NOT NULL, so an age-only submission is converted to an approximate dob
  // (Jan 1 of the birth year) in the service; the cross-field "at least one
  // of them" rule is enforced below since express-validator has no built-in
  // "one of these two fields" check.
  body("dob")
    .optional({ checkFalsy: true })
    .matches(DOB_REGEX)
    .withMessage("dob must be in DD-MM-YYYY or DD/MM/YYYY format"),
  body("age")
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 120 })
    .withMessage("age must be a whole number between 0 and 120")
    .toInt(),
  body("dob").custom((value, { req }) => {
    if (!value && !req.body.age) {
      throw new Error("Provide either date of birth or age");
    }
    return true;
  }),
  body("relation")
    .isIn(RELATIONS)
    .withMessage(`relation must be one of: ${RELATIONS.join(", ")}`),
  body("gender")
    .isIn(["Male", "Female", "Other"])
    .withMessage("gender must be Male, Female or Other"),
];

export const deleteFamilyMemberValidation = [
  body("member_id").trim().isUUID().withMessage("Invalid member_id"),
];
