import type { AppUserWalletTransaction } from "@/services/api/appUserApi";

const SOURCE_LABELS: Record<string, string> = {
  RECHARGE: "Wallet Recharge",
  ORDER_PAYMENT: "Order Payment",
  REFUND: "Refund",
  BONUS: "Bonus",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
};

/** Manual adjustments carry the admin's typed `note`; every other source is a
 *  closed enum, so it gets a human label instead. */
function transactionReason(txn: AppUserWalletTransaction): string {
  return txn.note?.trim() || SOURCE_LABELS[txn.source] || txn.source;
}

export { transactionReason };
