import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { logger } from "../../utils/logger";
import * as paymentService from "../../services/app/payment.service";
import { verifyWebhookSignature } from "../../services/razorpay.service";
import { finalizePaymentByGatewayOrderId } from "../../services/app/paymentFinalize.service";
import { prisma } from "../../config/database";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as paymentService.CreatePaymentOrderInput;

  const result = await paymentService.createPaymentOrder(appUser.id, input, appUser.platform);

  res.status(200).json(AppApiResponse.success("Payment order created", result));
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const input = req.body as paymentService.VerifyPaymentInput;

  const result = await paymentService.verifyPayment(appUser.id, input);

  res.status(200).json(AppApiResponse.success("Payment verification processed", result));
});

/** `req.body` is the RAW request Buffer here (see app.ts's raw-body carve-out
 *  for this path) — the signature must be checked before any JSON parsing. */
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    throw ApiError.unauthorized("Invalid webhook signature");
  }

  const payload = JSON.parse(rawBody.toString("utf-8")) as {
    event: string;
    payload: {
      payment: { entity: { id: string; order_id: string; amount: number; status: string } };
    };
  };

  const entity = payload.payload.payment.entity;

  const alreadyProcessed = await prisma.webhookEvent.findUnique({
    where: {
      gateway_eventType_gatewayPaymentId: {
        gateway: "razorpay",
        eventType: payload.event,
        gatewayPaymentId: entity.id,
      },
    },
  });

  if (!alreadyProcessed) {
    await prisma.webhookEvent.create({
      data: {
        gateway: "razorpay",
        eventType: payload.event,
        gatewayPaymentId: entity.id,
        rawPayload: payload as unknown as object,
      },
    });

    if (payload.event === "payment.captured") {
      await finalizePaymentByGatewayOrderId(entity.order_id, entity.id);
    } else {
      logger.info(`Unhandled Razorpay webhook event: ${payload.event}`);
    }
  }

  res.status(200).json(AppApiResponse.success("Webhook processed"));
});
