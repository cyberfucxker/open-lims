import { body } from "express-validator";

const FLAG_FIELDS = [
  "checkCityConfigured",
  "checkHoliday",
  "checkAreaResolved",
  "checkAreaBlock",
  "checkSlotBlock",
  "checkPhlebotomistCoverage",
  "checkCapacity",
] as const;

/** Every field is optional (a toggle-one-thing PATCH shouldn't have to
 *  resend the other six) but must be a real boolean when present. */
export const updateSlotAvailabilitySettingsValidation = FLAG_FIELDS.map((field) =>
  body(field).optional().isBoolean().withMessage(`${field} must be true or false`),
);
