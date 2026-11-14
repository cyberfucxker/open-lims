import type { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { AppApiResponse } from "../utils/AppApiResponse";

export function notFoundHandler(req: Request, res: Response): void {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  const body = req.originalUrl.startsWith("/api/v1/app")
    ? AppApiResponse.error(message)
    : ApiResponse.error(message);

  res.status(404).json(body);
}
