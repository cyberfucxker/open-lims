import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError";

/** Runs after an express-validator chain; turns collected errors into an ApiError. */
export function validate(req: Request, _res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const errors = result.array();
  const details = errors.map((error) => ({
    field: error.type === "field" ? error.path : undefined,
    message: error.msg as string,
  }));

  // Surface the first field error's own message at the top level (instead of
  // a generic "Validation failed") — every client that only reads `message`
  // (not `meta.details`) still sees an actionable error.
  next(ApiError.badRequest(errors[0].msg as string, details));
}
