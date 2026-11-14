import { delay, newId } from "../delay";
import { MOCK_RECHARGE_OFFERS } from "../data/wallet";
import { mockDb } from "../state";
import type {
  InitiateRechargeRequest,
  InitiateRechargeResult,
  RechargeOffersResult,
  VerifyRechargeRequest,
  VerifyRechargeResult,
  WalletBalanceResult,
  WalletTransactionsResult,
} from "@/types";

export const walletApi = {
  async getRechargeOffers(): Promise<RechargeOffersResult> {
    return delay({ total: mockDb.walletBalance, data: [...MOCK_RECHARGE_OFFERS] });
  },

  async getBalance(): Promise<WalletBalanceResult> {
    return delay({
      balance: mockDb.walletBalance,
      currency: "INR",
      updated_at: new Date().toISOString(),
    });
  },

  async initiateRecharge(payload: InitiateRechargeRequest): Promise<InitiateRechargeResult> {
    const offer = MOCK_RECHARGE_OFFERS.find((o) => o.id === payload.offer_id);
    const bonus = offer ? Number(offer.bonus_amount) : 0;
    return delay({
      recharge_id: newId("recharge"),
      amount: payload.amount,
      bonus_amount: bonus,
      credit_amount: payload.amount + bonus,
      offer_id: payload.offer_id ?? null,
      status: "PENDING",
    });
  },

  async verifyRecharge(payload: VerifyRechargeRequest): Promise<VerifyRechargeResult> {
    const credited = 500;
    mockDb.walletBalance += credited;
    mockDb.walletTransactions = [
      {
        id: newId("wtx"),
        type: "credit",
        amount: credited,
        source: "recharge",
        reference_id: payload.recharge_id,
        balance_after: mockDb.walletBalance,
        created_at: new Date().toISOString(),
      },
      ...mockDb.walletTransactions,
    ];
    return delay({
      recharge_id: payload.recharge_id,
      credited_amount: credited,
      wallet_balance: mockDb.walletBalance,
      status: "success",
    });
  },

  async getTransactions(): Promise<WalletTransactionsResult> {
    return delay({
      current_page: 1,
      per_page: 20,
      total: mockDb.walletTransactions.length,
      transactions: [...mockDb.walletTransactions],
    });
  },
};
