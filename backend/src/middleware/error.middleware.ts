import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AppApiResponse } from "../utils/AppApiResponse";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = err.flatten();
  } else if (err instanceof Error) {
    message = isProduction ? message : err.message;
  }

  logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}`, {
    error: err instanceof Error ? err.stack : err,
  });

  // Patient App AND Phlebo App routes use `{status, message, data}` (each
  // mobile client's fixed external contract) instead of the internal
  // `{success, ...}` shape. Trailing slash matters: admin-side routes like
  // `/api/v1/app-users` or `/api/v1/app-orders` also start with the string
  // "/api/v1/app" but are NOT part of the `/api/v1/app` Patient App
  // sub-router (mounted with its own trailing-slash boundary in app.ts) —
  // without it they'd wrongly get the Patient App envelope on error responses.
  const usesAppEnvelope =
    req.originalUrl.startsWith("/api/v1/app/") || req.originalUrl.startsWith("/api/v1/sample-boy/");
  const body = usesAppEnvelope
    ? AppApiResponse.error(message, details)
    : ApiResponse.error(message, details);

  res.status(statusCode).json(body);
}
