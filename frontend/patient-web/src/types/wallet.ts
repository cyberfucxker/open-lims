export interface RechargeOffer {
  id: string;
  recharge_amount: string;
  credit_amount: string;
  bonus_amount: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RechargeOffersResult {
  total: number;
  data: RechargeOffer[];
}

export interface WalletBalanceResult {
  balance: number;
  currency: "INR";
  updated_at: string;
}

export interface InitiateRechargeRequest {
  amount: number;
  offer_id?: string;
}

export interface InitiateRechargeResult {
  recharge_id: string;
  amount: number;
  bonus_amount: number;
  credit_amount: number;
  offer_id: string | null;
  status: "PENDING";
}

export interface VerifyRechargeRequest {
  recharge_id: string;
  payment_id: string;
}

export interface VerifyRechargeResult {
  recharge_id: string;
  credited_amount: number;
  wallet_balance: number;
  status: "success";
}

export type WalletTransactionType = "credit" | "debit";
export type WalletTransactionSource =
  "recharge" | "order_payment" | "refund" | "bonus" | "manual_adjustment";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  source: WalletTransactionSource;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

export interface WalletTransactionsResult {
  current_page: number;
  per_page: number;
  total: number;
  transactions: WalletTransaction[];
}
