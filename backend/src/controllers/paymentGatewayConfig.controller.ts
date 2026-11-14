import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as paymentGatewayConfigService from "../services/paymentGatewayConfig.service";
import type { PaymentGatewayConfigWriteData } from "../types/paymentGatewayConfig.types";

export const get = asyncHandler(async (_req: Request, res: Response) => {
  const config = await paymentGatewayConfigService.getPaymentGatewayConfig();
  res
    .status(200)
    .json(ApiResponse.success("Payment gateway config retrieved successfully", config));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as PaymentGatewayConfigWriteData;
  const config = await paymentGatewayConfigService.updatePaymentGatewayConfig(values);
  res.status(200).json(ApiResponse.success("Payment gateway config saved successfully", config));
});
