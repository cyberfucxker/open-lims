import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

/** DB config (Superadmin Settings > Payment Gateway) wins when set, so an
 *  admin can rotate keys without a redeploy; the RAZORPAY_KEY_ID/SECRET env
 *  vars are only the bootstrap fallback. No in-memory caching — a payment
 *  order create/verify is infrequent enough that a fresh row read each time
 *  is cheap, and avoids ever serving stale keys after an admin rotates them. */
export async function resolveCredentials(): Promise<RazorpayCredentials> {
  const config = await prisma.paymentGatewayConfig.findUnique({ where: { id: "default" } });
  const keyId = config?.razorpayKeyId || env.RAZORPAY_KEY_ID;
  const keySecret = config?.razorpayKeySecret || env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw ApiError.internal(
      "Razorpay is not configured. Set it from Superadmin Settings > Payment Gateway to accept online payments.",
    );
  }
  return { keyId, keySecret };
}

export interface CreateGatewayOrderResult {
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
}

/** `amountRupees` is converted to paise (Razorpay's smallest-unit
 *  convention) here so every caller works in the same rupee `Decimal`
 *  values the rest of the app (Bill/Payment/Wallet) already uses. */
/** Razorpay SDK errors don't extend `Error` in a useful way — they're plain
 *  `{ statusCode, error: { code, description } }` objects. Detect that shape
 *  so a bad/rotated key surfaces as a clear message instead of an opaque
 *  500 "Internal server error". */
function isRazorpayApiError(
  error: unknown,
): error is { statusCode: number; error: { code: string; description: string } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as { error?: unknown }).error === "object"
  );
}

export async function createGatewayOrder(
  amountRupees: number,
  receipt: string,
): Promise<CreateGatewayOrderResult> {
  const { keyId, keySecret } = await resolveCredentials();
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const amountPaise = Math.round(amountRupees * 100);

  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
    });
  } catch (error) {
    if (isRazorpayApiError(error)) {
      throw new ApiError(
        502,
        `Razorpay rejected the order request: ${error.error.description}. Check the key id/secret in Superadmin Settings > Payment Gateway.`,
      );
    }
    throw error;
  }

  return {
    gatewayOrderId: order.id,
    amountPaise,
    currency: order.currency,
    keyId,
  };
}

/** `payment_id`/`order_id` signature scheme documented by Razorpay for the
 *  client-side checkout callback:
 *  HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export async function verifyPaymentSignature(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  signature: string,
): Promise<boolean> {
  const { keySecret } = await resolveCredentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest("hex");

  return timingSafeEqual(expected, signature);
}

/** Webhook payloads are signed over the RAW request body — verify before
 *  any JSON parsing/trust of the payload, per Razorpay's documented
 *  webhook security model. */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw ApiError.internal("Razorpay webhook secret is not configured.");
  }
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
