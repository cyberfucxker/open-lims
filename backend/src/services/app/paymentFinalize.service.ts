import type { AppPayment } from "@prisma/client";
import { prisma } from "../../config/database";
import * as billService from "../../services/bill.service";
import * as orderService from "./order.service";
import type { PaymentMode } from "../../types/appointment.types";
import { ThirdPartyLabClient } from "./thirdPartyLabClient.service";
import { logger } from "../../utils/logger";

/** The one place an app payment actually gets marked settled — called by
 *  BOTH `POST /user/payments/verify` (fast-path UX confirmation) and the
 *  Razorpay webhook (system of record), guarded by the `status` check below
 *  so whichever arrives first wins and the other is a no-op. Idempotent:
 *  re-calling for an already-SUCCESS payment does nothing. */
export async function finalizePaymentByGatewayOrderId(
  gatewayOrderId: string,
  gatewayPaymentId: string,
): Promise<void> {
  const payment = await prisma.appPayment.findFirst({ where: { gatewayOrderId } });
  if (!payment || payment.status === "SUCCESS") {
    return;
  }

  await prisma.appPayment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS", gatewayPaymentId, signatureVerified: true },
  });

  if (payment.purpose === "ORDER_PAYMENT" && payment.orderId) {
    // Online orders stay a draft — no Appointments, no locked slot — until
    // this exact point: payment is verified FIRST, and only then does the
    // booking itself get created. See `finalizeOnlinePaymentBooking`'s
    // doc-comment for why, and for what "failed" here actually means (the
    // money is real; the booking couldn't be created, most likely a slot
    // that filled up during checkout — needs a manual refund, not a retry).
    const booking = await orderService.finalizeOnlinePaymentBooking(
      payment.appUserId,
      payment.orderId,
    );
    if (booking.outcome === "failed") {
      logger.error(
        "Payment captured but the booking could not be finalized — needs manual refund/reconciliation",
        {
          orderId: payment.orderId,
          paymentId: payment.id,
          gatewayPaymentId,
          reason: booking.error,
        },
      );
      return;
    }
    await settleAppOrderBills(payment.orderId, Number(payment.amount), "Online", gatewayPaymentId);
  } else if (payment.purpose === "WALLET_RECHARGE" && payment.walletRechargeId) {
    await finalizeWalletRecharge(payment.walletRechargeId, payment.appUserId);
  } else if (payment.purpose === "THIRD_PARTY_LAB_BALANCE") {
    await syncThirdPartyLabPayment(payment);
  }
}

/** Tells the third-party partner the balance has been paid. The
 *  Razorpay capture already succeeded by this point, so a failure here is
 *  logged rather than thrown — our own AppPayment stays SUCCESS regardless,
 *  and a sync failure just means the partner's ledger needs a manual retry. */
async function syncThirdPartyLabPayment(payment: AppPayment): Promise<void> {
  if (!payment.thirdPartyTestRegnId || !payment.thirdPartyUserFid) return;

  try {
    await ThirdPartyLabClient.updatePaymentStatus({
      testRegnId: payment.thirdPartyTestRegnId,
      currentPayAmt: Number(payment.amount),
      amountPaid: Number(payment.thirdPartyAmountBefore ?? 0) + Number(payment.amount),
      userId: payment.thirdPartyUserFid,
    });
  } catch (error) {
    logger.error("Failed to sync payment status to the lab partner", {
      testRegnId: payment.thirdPartyTestRegnId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Settles an AppOrder's payment: fans `amount` out pro-rata across every
 *  Bill under the order (a multi-family-member checkout produces one
 *  Appointment+Bill per member — see AppOrderAppointment) via the existing
 *  `billService.addPayment` (records the Payment row and recomputes each
 *  Bill's amountPaid/dueAmount/paymentStatus), then marks the order itself
 *  PAID. Shared by the Razorpay finalize path above AND the Phlebo App's
 *  COD-collect flow (`phlebo/booking.service.ts#collectCod`) — same
 *  settlement, different payment mode/source. */
export async function settleAppOrderBills(
  orderId: string,
  amount: number,
  mode: PaymentMode,
  transactionId?: string,
): Promise<void> {
  const orderAppointments = await prisma.appOrderAppointment.findMany({
    where: { orderId },
    include: { appointment: { include: { bill: true } } },
  });

  const bills = orderAppointments
    .map((oa) => oa.appointment.bill)
    .filter((b): b is NonNullable<typeof b> => !!b);
  const totalNet = bills.reduce((sum, b) => sum + Number(b.netAmount), 0);

  let allocated = 0;
  for (const [index, bill] of bills.entries()) {
    const isLast = index === bills.length - 1;
    const share = isLast
      ? Math.max(amount - allocated, 0)
      : Math.round((totalNet > 0 ? (Number(bill.netAmount) / totalNet) * amount : 0) * 100) / 100;
    allocated += share;
    if (share > 0) {
      await billService.addPayment(bill.id, { amount: share, mode, transactionId });
    }
  }

  await prisma.appOrder.update({ where: { id: orderId }, data: { paymentStatus: "PAID" } });
}

export async function finalizeWalletRecharge(
  walletRechargeId: string,
  appUserId: string,
): Promise<void> {
  const recharge = await prisma.walletRecharge.findUnique({ where: { id: walletRechargeId } });
  if (!recharge || recharge.status === "SUCCESS") return;

  const creditAmount = Number(recharge.creditAmount);

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.upsert({
      where: { appUserId },
      update: {},
      create: { appUserId },
    });
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: creditAmount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: creditAmount,
        source: "RECHARGE",
        referenceId: recharge.id,
        balanceAfter: updatedWallet.balance,
      },
    });
    await tx.walletRecharge.update({ where: { id: recharge.id }, data: { status: "SUCCESS" } });
  });
}
