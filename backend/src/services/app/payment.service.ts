import type { AppPlatform } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import {
  createGatewayOrder,
  resolveCredentials,
  verifyPaymentSignature,
} from "../razorpay.service";
import { finalizePaymentByGatewayOrderId } from "./paymentFinalize.service";
import { ThirdPartyLabClient } from "./thirdPartyLabClient.service";

export interface CreatePaymentOrderInput {
  purpose: "order_payment" | "wallet_recharge" | "third_party_lab_balance";
  reference_id: string;
  /** Required (and only meaningful) when purpose is "third_party_lab_balance" —
   *  the partner UserFID the report list was fetched with. */
  third_party_user_fid?: string;
}

export interface CreatePaymentOrderResult {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key: string;
  payment_id: string;
  purpose: string;
  reference_id: string;
}

async function resolveAuthoritativeAmount(
  appUserId: string,
  purpose: "order_payment" | "wallet_recharge",
  referenceId: string,
): Promise<number> {
  if (purpose === "order_payment") {
    const order = await prisma.appOrder.findUnique({ where: { id: referenceId } });
    if (!order || order.appUserId !== appUserId) {
      throw ApiError.notFound("Order not found");
    }
    // Deliberately NOT gated on `!order.isDraft` — an online payment is now
    // taken against the draft itself (see `order.service.ts#finalizeOnlinePaymentBooking`'s
    // doc-comment): the booking (Appointments/slot lock/wallet debit) is only
    // created once this payment is verified, not before. Review Cart already
    // wrote `totalPayable` onto the draft row, so it's available here either way.
    if ((!order.slotId && !order.slotTemplateId) || !order.addressId) {
      throw ApiError.badRequest("Call Review Cart before paying for this order");
    }
    if (order.paymentStatus === "PAID") {
      throw ApiError.conflict("This order is already paid");
    }
    return Number(order.totalPayable);
  }

  const recharge = await prisma.walletRecharge.findUnique({ where: { id: referenceId } });
  if (!recharge || recharge.appUserId !== appUserId) {
    throw ApiError.notFound("Recharge request not found");
  }
  if (recharge.status !== "PENDING") {
    throw ApiError.conflict("This recharge request is no longer pending");
  }
  return Number(recharge.amount);
}

/** Looks up the authoritative pending balance for a partner report directly
 *  from ThirdPartyLabClient — never trusts a client-submitted amount for
 *  money, same reasoning as resolveAuthoritativeAmount() above, just backed
 *  by an external API instead of a local table. */
async function resolveThirdPartyLabBalance(
  testRegnId: number,
  userFid: string,
): Promise<{ amount: number; amountBefore: number }> {
  const records = await ThirdPartyLabClient.listReports(userFid);
  const record = records.find((r) => r.TestRegnID === testRegnId);
  if (!record) {
    throw ApiError.notFound("Third-party lab report not found");
  }
  if (record.BalanceAmt <= 0) {
    throw ApiError.conflict("This report has no pending balance");
  }
  return { amount: record.BalanceAmt, amountBefore: record.AmountPaid };
}

async function createThirdPartyLabBalanceOrder(
  appUserId: string,
  input: CreatePaymentOrderInput,
): Promise<CreatePaymentOrderResult> {
  const testRegnId = Number(input.reference_id);
  const userFid = input.third_party_user_fid;
  if (!userFid) {
    throw ApiError.badRequest("third_party_user_fid is required");
  }

  const { amount, amountBefore } = await resolveThirdPartyLabBalance(testRegnId, userFid);

  const existing = await prisma.appPayment.findFirst({
    where: { appUserId, status: "INITIATED", thirdPartyTestRegnId: testRegnId },
  });
  if (existing?.gatewayOrderId) {
    const { keyId } = await resolveCredentials();
    return {
      razorpay_order_id: existing.gatewayOrderId,
      amount: Math.round(Number(existing.amount) * 100),
      currency: existing.currency,
      key: keyId,
      payment_id: existing.id,
      purpose: input.purpose,
      reference_id: input.reference_id,
    };
  }

  const payment = await prisma.appPayment.create({
    data: {
      appUserId,
      purpose: "THIRD_PARTY_LAB_BALANCE",
      thirdPartyTestRegnId: testRegnId,
      thirdPartyUserFid: userFid,
      thirdPartyAmountBefore: amountBefore,
      amount,
    },
  });

  const gatewayOrder = await createGatewayOrder(amount, payment.id);

  const updated = await prisma.appPayment.update({
    where: { id: payment.id },
    data: { gatewayOrderId: gatewayOrder.gatewayOrderId },
  });

  return {
    razorpay_order_id: gatewayOrder.gatewayOrderId,
    amount: gatewayOrder.amountPaise,
    currency: gatewayOrder.currency,
    key: gatewayOrder.keyId,
    payment_id: updated.id,
    purpose: input.purpose,
    reference_id: input.reference_id,
  };
}

export async function createPaymentOrder(
  appUserId: string,
  input: CreatePaymentOrderInput,
  platform: AppPlatform,
): Promise<CreatePaymentOrderResult> {
  if (input.purpose === "third_party_lab_balance") {
    return createThirdPartyLabBalanceOrder(appUserId, input);
  }

  const amount = await resolveAuthoritativeAmount(appUserId, input.purpose, input.reference_id);

  // An online-paid order is only confirmed later, from the payment verify
  // call or the Razorpay webhook — the webhook carries no client headers, so
  // the platform the patient is paying from is recorded on the draft here.
  if (input.purpose === "order_payment") {
    await prisma.appOrder.update({ where: { id: input.reference_id }, data: { platform } });
  }

  // Reuse an existing in-flight attempt for the same reference rather than
  // minting a second Razorpay order underneath it.
  const existing = await prisma.appPayment.findFirst({
    where: {
      appUserId,
      status: "INITIATED",
      ...(input.purpose === "order_payment"
        ? { orderId: input.reference_id }
        : { walletRechargeId: input.reference_id }),
    },
  });
  if (existing?.gatewayOrderId) {
    const { keyId } = await resolveCredentials();
    return {
      razorpay_order_id: existing.gatewayOrderId,
      amount: Math.round(Number(existing.amount) * 100),
      currency: existing.currency,
      key: keyId,
      payment_id: existing.id,
      purpose: input.purpose,
      reference_id: input.reference_id,
    };
  }

  const payment = await prisma.appPayment.create({
    data: {
      appUserId,
      purpose: input.purpose === "order_payment" ? "ORDER_PAYMENT" : "WALLET_RECHARGE",
      orderId: input.purpose === "order_payment" ? input.reference_id : undefined,
      walletRechargeId: input.purpose === "wallet_recharge" ? input.reference_id : undefined,
      amount,
    },
  });

  const gatewayOrder = await createGatewayOrder(amount, payment.id);

  const updated = await prisma.appPayment.update({
    where: { id: payment.id },
    data: { gatewayOrderId: gatewayOrder.gatewayOrderId },
  });

  return {
    razorpay_order_id: gatewayOrder.gatewayOrderId,
    amount: gatewayOrder.amountPaise,
    currency: gatewayOrder.currency,
    key: gatewayOrder.keyId,
    payment_id: updated.id,
    purpose: input.purpose,
    reference_id: input.reference_id,
  };
}

export interface VerifyPaymentInput {
  payment_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResult {
  payment_id: string;
  purpose: string;
  reference_id: string;
  status: "success" | "failed";
  signature_verified: boolean;
}

export async function verifyPayment(
  appUserId: string,
  input: VerifyPaymentInput,
): Promise<VerifyPaymentResult> {
  const payment = await prisma.appPayment.findUnique({ where: { id: input.payment_id } });
  if (!payment || payment.appUserId !== appUserId) {
    throw ApiError.notFound("Payment not found");
  }

  const referenceId =
    payment.orderId ?? payment.walletRechargeId ?? payment.thirdPartyTestRegnId?.toString() ?? "";

  if (payment.status === "SUCCESS") {
    return {
      payment_id: payment.id,
      purpose: payment.purpose,
      reference_id: referenceId,
      status: "success",
      signature_verified: true,
    };
  }

  if (payment.gatewayOrderId !== input.razorpay_order_id) {
    throw ApiError.badRequest("razorpay_order_id does not match this payment");
  }

  const validSignature = await verifyPaymentSignature(
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature,
  );

  if (!validSignature) {
    await prisma.appPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: "Signature verification failed" },
    });
    return {
      payment_id: payment.id,
      purpose: payment.purpose,
      reference_id: referenceId,
      status: "failed",
      signature_verified: false,
    };
  }

  await finalizePaymentByGatewayOrderId(input.razorpay_order_id, input.razorpay_payment_id);

  return {
    payment_id: payment.id,
    purpose: payment.purpose,
    reference_id: referenceId,
    status: "success",
    signature_verified: true,
  };
}
