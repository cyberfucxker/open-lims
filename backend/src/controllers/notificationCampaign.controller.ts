import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as campaignService from "../services/notificationCampaign.service";
import type { SendPushCampaignInput } from "../services/notificationCampaign.service";

export const sendPush = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as SendPushCampaignInput;
  const result = await campaignService.sendPushCampaign(input);
  res.status(200).json(ApiResponse.success("Push campaign sent", result));
});
