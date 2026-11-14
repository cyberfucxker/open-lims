import { body } from "express-validator";

const PINCODE_REGEX = /^\d{6}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

// The Add/Edit Address form is now map-first: the patient pins a location and
// the reverse-geocode fills `address`, `locality`, `city`, `state`, `pincode`,
// `lat` and `long`; the only things they type are flat no., block, apartment
// and landmark. So city/state/pincode are `optional` here rather than
// required — not because they don't matter, but because a pin in a spot OSM
// has no postcode for must still be savable instead of hard-failing a form
// that has no field to fix it in. Whatever IS sent is still format-checked,
// and `address.service.ts#normaliseCityState` reconciles the geocoded city
// against this business's own City master before it is stored.
const addressBodyValidation = [
  body("name").isIn(["home", "work", "other"]).withMessage("name must be home, work or other"),
  body("house_no").optional({ checkFalsy: true }).trim(),
  body("block_no").optional({ checkFalsy: true }).trim(),
  body("apartment").optional({ checkFalsy: true }).trim(),
  body("address").trim().notEmpty().withMessage("address is required"),
  body("locality").optional({ checkFalsy: true }).trim(),
  body("landmark").optional({ checkFalsy: true }).trim(),
  body("city").optional({ checkFalsy: true }).trim(),
  body("state").optional({ checkFalsy: true }).trim(),
  body("pincode")
    .optional({ checkFalsy: true })
    .trim()
    .matches(PINCODE_REGEX)
    .withMessage("pincode must be 6 digits"),
  // Optional: blank falls back to the account holder's own mobile (see
  // `address.service.ts#resolveAddressPhone`). Still format-checked when a
  // number IS given — an optional field is not an unvalidated one.
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Enter a valid 10-digit phone number"),
  body("lat").optional({ checkFalsy: true }).isFloat().withMessage("lat must be a number"),
  body("long").optional({ checkFalsy: true }).isFloat().withMessage("long must be a number"),
  body("area_id").optional({ checkFalsy: true }).isUUID().withMessage("Invalid area_id"),
];

export const addAddressValidation = [
  ...addressBodyValidation,
  // Optional since the form dropped its "set as default" switch — the first
  // address a patient saves is forced default by the service either way.
  body("is_default")
    .optional({ checkFalsy: true })
    .isIn(["0", "1"])
    .withMessage('is_default must be "0" or "1"'),
];

export const editAddressValidation = [
  body("address_id").trim().isUUID().withMessage("Invalid address_id"),
  ...addressBodyValidation,
];

export const deleteAddressValidation = [
  body("address_id").trim().isUUID().withMessage("Invalid address_id"),
];

export const setDefaultAddressValidation = [
  body("address_id").trim().isUUID().withMessage("Invalid address_id"),
];
