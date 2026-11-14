import {
  Gift,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  WalletMinimal,
  type LucideIcon,
} from "lucide-react";

import type { RechargeOffer, WalletTransactionSource } from "@/types";

export const WALLET_SOURCE_LABEL: Record<WalletTransactionSource, string> = {
  recharge: "Wallet Recharge",
  order_payment: "Booking Payment",
  refund: "Refund",
  bonus: "Bonus Credit",
  manual_adjustment: "Adjustment",
};

/** Each ledger source gets its own medallion so a statement can be skimmed by shape and
 *  colour before the label is even read. */
export const WALLET_SOURCE_META: Record<
  WalletTransactionSource,
  { icon: LucideIcon; iconClass: string }
> = {
  recharge: {
    icon: WalletMinimal,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  order_payment: { icon: Receipt, iconClass: "bg-primary/10 text-primary" },
  refund: { icon: RotateCcw, iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  bonus: { icon: Gift, iconClass: "bg-brand-violet/10 text-brand-violet" },
  manual_adjustment: { icon: SlidersHorizontal, iconClass: "bg-muted text-muted-foreground" },
};

/** What the wallet is actually credited for an offer. Prefers the API's own
 *  `credit_amount` and only falls back to recharge + bonus when that field is absent or
 *  unparseable, so the displayed figure always tracks the backend's arithmetic. */
export function getOfferCredit(offer: RechargeOffer): number {
  const credit = Number(offer.credit_amount);
  if (Number.isFinite(credit) && credit > 0) return credit;

  const recharge = Number(offer.recharge_amount) || 0;
  const bonus = Number(offer.bonus_amount) || 0;
  return recharge + bonus;
}
