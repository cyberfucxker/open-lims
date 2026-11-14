import { body, param, query } from "express-validator";
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from "../utils/password.util";
import {
  DELIVERY_CHANNELS,
  FRANCHISE_TYPES,
  ORGANIZATION_MODULES,
} from "../types/organization.types";

const organizationBodyValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter organization name"),
  // Optional: the Superadmin franchise form does not collect it (a franchise is
  // always a collection center) and the service defaults it. The LIMS
  // organization form still sends it.
  body("type")
    .optional({ values: "falsy" })
    .isIn(["GENERAL_CENTER", "COLLECTION_CENTER"])
    .withMessage("type must be GENERAL_CENTER or COLLECTION_CENTER"),
  body("franchiseType")
    .optional({ values: "falsy" })
    .isIn(FRANCHISE_TYPES)
    .withMessage("franchiseType must be SINGLE_LAB or CO_LAB"),
  body("cityId").optional({ values: "falsy" }).isUUID().withMessage("Invalid city"),
  body("labName").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("labLogoPath").optional({ values: "falsy" }).trim(),
  body("contactPerson").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("mobile").trim().isLength({ min: 6, max: 15 }).withMessage("Enter a valid mobile number"),
  body("email").optional({ values: "falsy" }).trim().isEmail().withMessage("Enter a valid email"),
  body("country").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("state").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("city").optional({ values: "falsy" }).trim().isLength({ max: 100 }),
  body("pincode").optional({ values: "falsy" }).trim().isLength({ max: 10 }),
  body("address").optional({ values: "falsy" }).trim(),
  body("description").optional({ values: "falsy" }).trim(),

  body("priceListId").optional({ values: "falsy" }).isUUID().withMessage("Invalid price list"),
  body("paymentType").optional().isIn(["PREPAID", "POSTPAID"]),
  body("creditLimit").optional().isFloat({ min: 0 }).toFloat(),
  body("advanceAmount").optional().isFloat({ min: 0 }).toFloat(),
  body("dueDays").optional().isInt({ min: 0, max: 365 }).toInt(),
  body("source").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("billingRules").optional({ values: "falsy" }).trim(),
  body("invoiceRules").optional({ values: "falsy" }).trim(),
  body("reportDeliveryChannels").optional().isArray(),
  body("reportDeliveryChannels.*").optional().isIn(DELIVERY_CHANNELS),
  body("billDeliveryChannels").optional().isArray(),
  body("billDeliveryChannels.*").optional().isIn(DELIVERY_CHANNELS),

  body("commissionPct")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("commissionPct must be between 0 and 100")
    .toFloat(),
  body("active").optional().isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const organizationIdParamValidation = [
  param("id").isUUID().withMessage("Invalid organization id"),
];

export const setServiceAreasValidation = [
  ...organizationIdParamValidation,
  body("areaIds").isArray().withMessage("areaIds must be an array"),
  body("areaIds.*").isUUID().withMessage("Invalid area id"),
];

export const listOrganizationsValidation = [
  query("search").optional().trim(),
  query("type").optional().isIn(["GENERAL_CENTER", "COLLECTION_CENTER"]),
  query("franchiseType").optional().isIn(FRANCHISE_TYPES),
  query("active").optional().isIn(["true", "false", "all"]),
  query("includeDeleted").optional().isIn(["true", "false"]),
  query("priceListId").optional().isUUID(),
  query("cityId").optional().isUUID(),
  query("sortBy").optional().trim(),
  query("sortDir").optional().isIn(["asc", "desc"]),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

/** Optional on create — supplying both provisions the franchise's portal login
 *  in the same transaction. `optional({ values: "falsy" })` so the Superadmin
 *  form can send empty strings for an organization that gets no login; the
 *  both-or-neither rule itself is enforced in the service, where it can produce
 *  one clear message instead of two disconnected field errors. */
const organizationLoginBodyValidation = [
  body("username")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Username must be between 3 and 100 characters"),
  body("password")
    .optional({ values: "falsy" })
    .matches(PASSWORD_POLICY_REGEX)
    .withMessage(PASSWORD_POLICY_MESSAGE),
];

export const createOrganizationValidation = [
  ...organizationBodyValidation,
  ...organizationLoginBodyValidation,
];
export const updateOrganizationValidation = [
  ...organizationIdParamValidation,
  ...organizationBodyValidation,
];

export const setOrganizationStatusValidation = [
  ...organizationIdParamValidation,
  body("active").isBoolean().withMessage("active must be true or false").toBoolean(),
];

export const enableLoginValidation = [
  ...organizationIdParamValidation,
  body("username").trim().isLength({ min: 3, max: 100 }).withMessage("Enter a username"),
  body("password").matches(PASSWORD_POLICY_REGEX).withMessage(PASSWORD_POLICY_MESSAGE),
  body("roleId").isUUID().withMessage("Select a role"),
  body("enabledModules").isArray().withMessage("enabledModules must be an array"),
  body("enabledModules.*").isIn(ORGANIZATION_MODULES),
];

export const updateLoginValidation = [
  ...organizationIdParamValidation,
  body("roleId").optional().isUUID().withMessage("Invalid role"),
  body("isActive").optional().isBoolean().toBoolean(),
  body("password")
    .optional({ values: "falsy" })
    .matches(PASSWORD_POLICY_REGEX)
    .withMessage(PASSWORD_POLICY_MESSAGE),
  body("enabledModules").optional().isArray(),
  body("enabledModules.*").optional().isIn(ORGANIZATION_MODULES),
];
