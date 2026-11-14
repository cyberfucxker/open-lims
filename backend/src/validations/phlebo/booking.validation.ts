import { body, param, query } from "express-validator";

const STATUS_SLUGS = [
  "pending",
  "accepted",
  "started_journey",
  "reached",
  "sample_collected",
  "sample_dropped",
  "completed",
  "rejected",
  "cancelled",
];

export const bookingIdParamValidation = [param("id").isUUID().withMessage("Invalid booking id")];

export const listBookingsValidation = [
  query("status").optional().isIn(STATUS_SLUGS).withMessage("Invalid status"),
  query("date_from").optional().isISO8601().withMessage("date_from must be a valid date"),
  query("date_to").optional().isISO8601().withMessage("date_to must be a valid date"),
  query("per_page").optional().isInt({ min: 1, max: 500 }).toInt(),
  query("page").optional().isInt({ min: 1 }).toInt(),
];

export const updateBookingStatusValidation = [
  ...bookingIdParamValidation,
  body("status").isIn(STATUS_SLUGS).withMessage("Invalid status"),
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  // Accepted for the live-location use case but intentionally not persisted
  // yet (no live-location table exists) — validated only so a well-formed
  // request from the app is never rejected.
  body("latitude").optional().isFloat({ min: -90, max: 90 }),
  body("longitude").optional().isFloat({ min: -180, max: 180 }),
];

export const verifyBookingPinValidation = [
  ...bookingIdParamValidation,
  body("pin").trim().isLength({ min: 4, max: 6 }).isNumeric().withMessage("Enter a valid PIN"),
];

export const collectCodValidation = [
  ...bookingIdParamValidation,
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];

export const dropSampleValidation = [
  ...bookingIdParamValidation,
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];

export const addBookingItemsValidation = [
  ...bookingIdParamValidation,
  body("test_ids").isArray().withMessage("test_ids must be an array"),
  body("test_ids.*").isUUID().withMessage("Each test id must be a valid UUID"),
  body("package_ids").optional().isArray().withMessage("package_ids must be an array"),
  body("package_ids.*").optional().isUUID().withMessage("Each package id must be a valid UUID"),
];

export const removeBookingItemValidation = [
  ...bookingIdParamValidation,
  param("itemId").isUUID().withMessage("Invalid item id"),
];

export const bulkDropSamplesValidation = [
  body("booking_ids").isArray({ min: 1 }).withMessage("booking_ids must be a non-empty array"),
  body("booking_ids.*").isUUID().withMessage("Each booking id must be a valid UUID"),
  body("remarks").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];
