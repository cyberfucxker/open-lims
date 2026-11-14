import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { uploadedFileUrl } from "../../middleware/appUpload.middleware";
import * as supportTicketService from "../../services/app/supportTicket.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const result = await supportTicketService.listMyIssues(appUser.id);
  res.status(200).json(AppApiResponse.success("Issues fetched successfully", result));
});

export const reportIssue = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);

  // The screenshot is optional: plenty of real complaints ("phlebo never
  // arrived", "wrong report") have nothing to photograph, and refusing the
  // ticket over a missing attachment just loses the report. `subject` and
  // `description` are still required — see `supportTicket.validation.ts`.
  const screenshotUrl = req.file ? uploadedFileUrl(req.file.filename) : null;

  const input = req.body as supportTicketService.ReportIssueInput;
  await supportTicketService.reportIssue(appUser.id, input, screenshotUrl);

  res.status(201).json(AppApiResponse.success("Issue reported successfully"));
});
