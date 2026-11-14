import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as appConfigService from "../../services/app/appConfig.service";

export const getConfig = asyncHandler(async (req: Request, res: Response) => {
  const { app_version: appVersion } = req.query as { app_version?: string };
  const config = await appConfigService.getAppConfig(appVersion);
  res.status(200).json(AppApiResponse.success("App config fetched successfully", config));
});
