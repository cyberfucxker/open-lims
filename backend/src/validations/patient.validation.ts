import { body, param, query } from "express-validator";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
// Title-Case to match the frontend's existing patientSchema.ts exactly.
const GENDERS = ["Male", "Female", "Other"];
const PATIENT_TYPES = ["Retail", "B2B"];

const patientBodyValidation = [
  body("optionalPatientId").optional({ values: "falsy" }).trim().isLength({ max: 50 }),
  body("title").trim().isLength({ min: 1, max: 20 }).withMessage("Select designation"),
  body("fullName").trim().isLength({ min: 2, max: 200 }).withMessage("Enter full name"),
  body("gender").isIn(GENDERS).withMessage("Select gender"),
  body("patientType")
    .optional()
    .isIn(PATIENT_TYPES)
    .withMessage("Patient type must be Retail or B2B"),
  body("dob")
    .isISO8601()
    .withMessage("Enter a valid date of birth")
    .custom((value) => new Date(value) <= new Date())
    .withMessage("Date of birth cannot be in the future"),
  body("mobile")
    .optional({ values: "falsy" })
    .matches(MOBILE_REGEX)
    .withMessage("Enter a valid 10-digit mobile number"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Enter a valid email"),
  body("address").optional({ values: "falsy" }).trim(),
  body("organization").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("referral").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("referralDoctorId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("Invalid referral doctor"),
  body("referralSourceId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("Invalid referral source"),
  body("whatsappOptIn")
    .optional()
    .isBoolean()
    .withMessage("whatsappOptIn must be true or false")
    .toBoolean(),
  body("smsOptIn").optional().isBoolean().withMessage("smsOptIn must be true or false").toBoolean(),
  body("emailOptIn")
    .optional()
    .isBoolean()
    .withMessage("emailOptIn must be true or false")
    .toBoolean(),
];

export const appointmentBodyValidation = [
  body("testIds").isArray({ min: 1 }).withMessage("Select at least one test"),
  body("testIds.*").isUUID().withMessage("Invalid test id"),
  body("discountPercent")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100")
    .toFloat(),
  body("paymentMode")
    .isIn(["Cash", "Card", "UPI", "Insurance", "Credit", "Online"])
    .withMessage("Select payment mode"),
  body("amountPaid")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount paid cannot be negative")
    .toFloat(),
  body("isEmergency")
    .optional()
    .isBoolean()
    .withMessage("isEmergency must be true or false")
    .toBoolean(),
  body("centerId").optional({ values: "falsy" }).isUUID().withMessage("Invalid center"),
  body("homeCollection")
    .optional()
    .isBoolean()
    .withMessage("homeCollection must be true or false")
    .toBoolean(),
];

export const patientIdParamValidation = [param("id").isUUID().withMessage("Invalid patient id")];

export const registerPatientValidation = [...patientBodyValidation, ...appointmentBodyValidation];

// Matches the project's existing update-endpoint convention (see
// `updateDepartmentValidation`): PATCH still validates the full body, not a
// partial patch.
export const updatePatientValidation = [...patientIdParamValidation, ...patientBodyValidation];

export const listPatientsValidation = [
  query("search").optional().trim(),
  query("gender").optional().isIn(GENDERS).withMessage("gender must be Male, Female or Other"),
  query("organization").optional().trim(),
  query("referral").optional().trim(),
  query("mobile").optional().trim(),
  query("email").optional().trim(),
  query("createdFrom").optional().isISO8601().withMessage("createdFrom must be a valid date"),
  query("createdTo").optional().isISO8601().withMessage("createdTo must be a valid date"),
  query("organizationId").optional().isUUID().withMessage("Invalid organization id"),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be between 1 and 100")
    .toInt(),
];
