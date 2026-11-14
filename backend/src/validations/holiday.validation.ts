import { body, param, query } from "express-validator";

export const listHolidaysValidation = [
  query("cityId").optional().isUUID(),
  query("dateFrom").optional().isISO8601(),
  query("dateTo").optional().isISO8601(),
];

export const createHolidayValidation = [
  body("cityId").isUUID().withMessage("Select a city"),
  body("holidayDate").isISO8601().withMessage("Enter a valid date"),
  body("reason").trim().isLength({ min: 2 }).withMessage("Enter a reason"),
];

export const holidayIdParamValidation = [param("id").isUUID().withMessage("Invalid holiday id")];
