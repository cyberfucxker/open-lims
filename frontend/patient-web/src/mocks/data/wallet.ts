import type { RechargeOffer, WalletTransaction } from "@/types";

export const MOCK_RECHARGE_OFFERS: RechargeOffer[] = [
  {
    id: "offer_1",
    recharge_amount: "500",
    credit_amount: "500",
    bonus_amount: "25",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "offer_2",
    recharge_amount: "1000",
    credit_amount: "1000",
    bonus_amount: "75",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "offer_3",
    recharge_amount: "2000",
    credit_amount: "2000",
    bonus_amount: "200",
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "wtx_1",
    type: "credit",
    amount: 525,
    source: "recharge",
    reference_id: "recharge_9001",
    balance_after: 525,
    created_at: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "wtx_2",
    type: "debit",
    amount: 150,
    source: "order_payment",
    reference_id: "order_1001",
    balance_after: 375,
    created_at: "2026-07-20T09:30:00.000Z",
  },
  {
    id: "wtx_3",
    type: "credit",
    amount: 50,
    source: "bonus",
    reference_id: null,
    balance_after: 425,
    created_at: "2026-07-25T12:00:00.000Z",
  },
];

export const MOCK_WALLET_BALANCE = 425;
