import { body, param, query } from "express-validator";
import { APP_ORDER_PAYMENT_MODE_VALUES, APP_ORDER_STATUS_VALUES } from "../types/appOrder.types";
import { FRANCHISE_PERIODS, PRICE_LIST_ITEM_TYPES } from "../types/franchise.types";

export const dashboardValidation = [query("period").optional().isIn(FRANCHISE_PERIODS)];

export const updateProfileValidation = [
  body("ownerName").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
  body("mobile")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 6, max: 15 })
    .withMessage("Enter a valid mobile number"),
  body("email").optional({ values: "falsy" }).trim().isEmail().withMessage("Enter a valid email"),
  body("labName").optional({ values: "falsy" }).trim().isLength({ max: 150 }),
];

export const listOrdersValidation = [
  query("search").optional().trim(),
  query("status").optional().isIn(APP_ORDER_STATUS_VALUES),
  query("paymentStatus").optional().isIn(["PAID", "PARTIAL", "PENDING"]),
  query("dateFrom").optional().isISO8601(),
  query("dateTo").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const orderIdParamValidation = [param("id").isUUID().withMessage("Invalid order id")];

export const listReportsValidation = [
  query("search").optional().trim(),
  query("view").optional().trim(),
  query("dateFrom").optional().isISO8601(),
  query("dateTo").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt(),
];

/** Note what is absent: no `priceListId`. The franchise's list is resolved from
 *  its session, so there is no field here for a caller to point elsewhere. */
export const setPriceListItemsValidation = [
  body("items").isArray().withMessage("items must be an array"),
  body("items.*.itemType")
    .isIn(PRICE_LIST_ITEM_TYPES)
    .withMessage("itemType must be TEST, PACKAGE or PARAMETER"),
  body("items.*.itemId").isUUID().withMessage("Invalid item id"),
  body("items.*.price").isFloat({ min: 0 }).withMessage("Price must be zero or greater").toFloat(),
  body("items.*.isOffered")
    .optional()
    .isBoolean()
    .withMessage("isOffered must be true or false")
    .toBoolean(),
];

// ---------------------------------------------------------------------------
// Orders — full Order Management parity (except delete), scoped to the
// franchise's own visible orders server-side (see `requireFranchise`).
// ---------------------------------------------------------------------------

export const updateOrderStatusValidation = [
  ...orderIdParamValidation,
  body("status")
    .isIn(APP_ORDER_STATUS_VALUES)
    .withMessage(`status must be one of ${APP_ORDER_STATUS_VALUES.join(", ")}`),
];

export const assignOrderPhleboValidation = [
  ...orderIdParamValidation,
  body("phleboId")
    .custom((value) => value === null || typeof value === "string")
    .withMessage("phleboId must be a valid id or null"),
];

export const addOrderHomeVisitItemsValidation = [
  ...orderIdParamValidation,
  body("testIds").isArray().withMessage("testIds must be an array"),
  body("testIds.*").isUUID().withMessage("Each testId must be a valid id"),
  body("packageIds").optional().isArray().withMessage("packageIds must be an array"),
  body("packageIds.*").optional().isUUID().withMessage("Each packageId must be a valid id"),
];

export const removeOrderHomeVisitItemValidation = [
  ...orderIdParamValidation,
  param("itemId").isUUID().withMessage("Invalid item id"),
];

/** Exactly one of `appUserId` (an existing, already-registered customer) or
 *  `newCustomer` (a walk-in patient created alongside the order) must be
 *  given — enforced once here rather than relying on the service layer to
 *  catch a malformed request late. */
export const createOrderValidation = [
  body().custom((value) => {
    const hasExisting = typeof value?.appUserId === "string" && value.appUserId.length > 0;
    const hasNew = value?.newCustomer && typeof value.newCustomer === "object";
    if (hasExisting === hasNew) {
      throw new Error("Provide exactly one of appUserId or newCustomer");
    }
    return true;
  }),
  body("appUserId").optional().isUUID().withMessage("appUserId must be a valid id"),
  body("familyMemberId").optional().isUUID().withMessage("familyMemberId must be a valid id"),
  body("addressId")
    .if(body("appUserId").exists())
    .isUUID()
    .withMessage("addressId must be a valid id"),
  body("newCustomer.name")
    .if(body("newCustomer").exists())
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Enter the customer's name"),
  body("newCustomer.mobile")
    .if(body("newCustomer").exists())
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Enter a valid mobile number"),
  body("newCustomer.gender")
    .if(body("newCustomer").exists())
    .isIn(["Male", "Female", "Other"])
    .withMessage("gender must be Male, Female or Other"),
  body("newCustomer.dob").optional({ values: "falsy" }).isISO8601(),
  body("newCustomer.age").optional({ values: "falsy" }).isInt({ min: 0, max: 120 }).toInt(),
  body("newCustomer.email").optional({ values: "falsy" }).trim().isEmail(),
  body("newCustomer.address.address")
    .if(body("newCustomer").exists())
    .trim()
    .isLength({ min: 3 })
    .withMessage("Enter the address"),
  body("newCustomer.address.city")
    .if(body("newCustomer").exists())
    .trim()
    .isLength({ min: 1 })
    .withMessage("Enter the city"),
  body("newCustomer.address.state")
    .if(body("newCustomer").exists())
    .trim()
    .isLength({ min: 1 })
    .withMessage("Enter the state"),
  body("newCustomer.address.pincode")
    .if(body("newCustomer").exists())
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage("Enter a valid 6-digit pincode"),
  body("newCustomer.address.areaId").optional({ values: "falsy" }).isUUID(),
  body("newCustomer.address.phone").optional({ values: "falsy" }).trim(),
  body("slotId").optional().isUUID().withMessage("slotId must be a valid id"),
  body("orderDate").isISO8601().withMessage("orderDate must be a valid date (YYYY-MM-DD)"),
  body("testIds").isArray().withMessage("testIds must be an array"),
  body("testIds.*").isUUID().withMessage("Each testId must be a valid id"),
  body("packageIds").optional().isArray().withMessage("packageIds must be an array"),
  body("packageIds.*").optional().isUUID().withMessage("Each packageId must be a valid id"),
  body("paymentMode")
    .isIn(APP_ORDER_PAYMENT_MODE_VALUES)
    .withMessage(`paymentMode must be one of ${APP_ORDER_PAYMENT_MODE_VALUES.join(", ")}`),
];

// ---------------------------------------------------------------------------
// Phlebotomists — a franchise's own only, scoped to its own assigned areas
// (enforced in `phlebotomist.service.ts#createOwnPhlebotomist`, not here).
// ---------------------------------------------------------------------------

export const createOwnPhlebotomistValidation = [
  body("name").trim().isLength({ min: 2, max: 150 }).withMessage("Enter phlebotomist name"),
  body("mobile")
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Enter a valid mobile number"),
  body("photoUrl").optional({ values: "falsy" }).trim(),
  body("workingHoursStart")
    .optional({ values: "falsy" })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("workingHoursStart must be in HH:mm format"),
  body("workingHoursEnd")
    .optional({ values: "falsy" })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("workingHoursEnd must be in HH:mm format"),
  body("serviceAreaIds")
    .isArray({ min: 1 })
    .withMessage("Select at least one service area for this phlebotomist"),
  body("serviceAreaIds.*").isUUID().withMessage("Each service area id must be valid"),
];

export const phlebotomistIdParamValidation = [
  param("id").isUUID().withMessage("Invalid phlebotomist id"),
];

export const setOwnPhlebotomistStatusValidation = [
  ...phlebotomistIdParamValidation,
  body("isActive").isBoolean().withMessage("isActive must be true or false").toBoolean(),
];

// ---------------------------------------------------------------------------
// Area requests — a franchise proposing new coverage in its own city,
// pending Superadmin's "Area Approval" review.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Notifications — this franchise's own in-app feed.
// ---------------------------------------------------------------------------

export const notificationIdParamValidation = [
  param("id").isUUID().withMessage("Invalid notification id"),
];

export const createAreaRequestValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Enter the area name"),
  body("pincodes").optional().isArray().withMessage("pincodes must be an array"),
  body("pincodes.*")
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage("Each pincode must be 6 digits"),
];
