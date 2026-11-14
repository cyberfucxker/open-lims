import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { finalizeWalletRecharge } from "./paymentFinalize.service";

export async function listRechargeOffers(appUserId: string) {
  const [offers, wallet] = await Promise.all([
    prisma.rechargeOffer.findMany({
      where: { isActive: true },
      orderBy: { rechargeAmount: "asc" },
    }),
    prisma.wallet.upsert({ where: { appUserId }, update: {}, create: { appUserId } }),
  ]);

  return {
    total: Number(wallet.balance),
    data: offers.map((o) => ({
      id: o.id,
      recharge_amount: o.rechargeAmount.toString(),
      credit_amount: o.creditAmount.toString(),
      bonus_amount: o.bonusAmount.toString(),
      is_active: o.isActive,
      created_at: o.createdAt.toISOString(),
      updated_at: o.updatedAt.toISOString(),
    })),
  };
}

export async function getWalletBalance(appUserId: string) {
  const wallet = await prisma.wallet.upsert({
    where: { appUserId },
    update: {},
    create: { appUserId },
  });
  return {
    balance: Number(wallet.balance),
    currency: wallet.currency,
    updated_at: wallet.updatedAt.toISOString(),
  };
}

/** Replaces the client's previously hardcoded fallback tiers (documented in
 *  api.md) when no `offer_id` is supplied — kept as a simple tiered
 *  function rather than a new master table, since this is the only
 *  consumer and the tiers are small/fixed. */
function fallbackBonus(amount: number): number {
  if (amount >= 2000) return 100;
  if (amount >= 1000) return 50;
  if (amount >= 500) return 40;
  return 0;
}

export interface InitiateRechargeInput {
  amount: number;
  offer_id?: string;
}

export async function initiateRecharge(appUserId: string, input: InitiateRechargeInput) {
  let bonusAmount = fallbackBonus(input.amount);
  let offerId: string | null = null;

  if (input.offer_id) {
    const offer = await prisma.rechargeOffer.findUnique({ where: { id: input.offer_id } });
    if (!offer || !offer.isActive) {
      throw ApiError.badRequest("This recharge offer is no longer available");
    }
    bonusAmount = Number(offer.bonusAmount);
    offerId = offer.id;
  }

  const creditAmount = input.amount + bonusAmount;

  const recharge = await prisma.walletRecharge.create({
    data: { appUserId, amount: input.amount, offerId, bonusAmount, creditAmount },
  });

  return {
    recharge_id: recharge.id,
    amount: Number(recharge.amount),
    bonus_amount: Number(recharge.bonusAmount),
    credit_amount: Number(recharge.creditAmount),
    offer_id: recharge.offerId,
    status: recharge.status,
  };
}

export interface VerifyRechargeInput {
  recharge_id: string;
  payment_id: string;
}

export async function verifyRecharge(appUserId: string, input: VerifyRechargeInput) {
  const recharge = await prisma.walletRecharge.findUnique({ where: { id: input.recharge_id } });
  if (!recharge || recharge.appUserId !== appUserId) {
    throw ApiError.notFound("Recharge request not found");
  }

  if (recharge.status !== "SUCCESS") {
    const payment = await prisma.appPayment.findUnique({ where: { id: input.payment_id } });
    if (
      !payment ||
      payment.appUserId !== appUserId ||
      payment.walletRechargeId !== input.recharge_id ||
      payment.purpose !== "WALLET_RECHARGE"
    ) {
      throw ApiError.badRequest("Payment does not match this recharge request");
    }
    if (payment.status !== "SUCCESS") {
      throw ApiError.badRequest("Payment has not been verified yet");
    }

    await finalizeWalletRecharge(recharge.id, appUserId);
  }

  const wallet = await prisma.wallet.findUnique({ where: { appUserId } });

  return {
    recharge_id: recharge.id,
    credited_amount: Number(recharge.creditAmount),
    wallet_balance: Number(wallet?.balance ?? 0),
    status: "success" as const,
  };
}

export async function listWalletTransactions(appUserId: string, page: number, perPage: number) {
  const wallet = await prisma.wallet.upsert({
    where: { appUserId },
    update: {},
    create: { appUserId },
  });

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return {
    current_page: page,
    per_page: perPage,
    total,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type.toLowerCase(),
      amount: Number(t.amount),
      source: t.source.toLowerCase(),
      reference_id: t.referenceId,
      balance_after: Number(t.balanceAfter),
      created_at: t.createdAt.toISOString(),
    })),
  };
}
