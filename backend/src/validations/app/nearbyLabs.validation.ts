import { param, query } from "express-validator";

export const listCentersValidation = [
  query("lat").optional().isFloat().withMessage("lat must be a number"),
  query("long").optional().isFloat().withMessage("long must be a number"),
];

export const centerIdParamValidation = [param("id").isUUID().withMessage("Invalid center id")];
