import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Plus, RefreshCw, ShieldCheck, Wallet as WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatRupees } from "@/utils/format";
import { EASE_OUT_EXPO } from "@/utils/motion";
import type { WalletBalanceResult } from "@/types";

/** Preset top-ups. Tapping one opens the recharge sheet with the amount pre-filled — it
 *  still travels the same custom-amount path as typing it by hand. */
const QUICK_AMOUNTS = [500, 1000, 2000];

interface WalletBalanceCardProps {
  balance: WalletBalanceResult | undefined;
  isLoading?: boolean;
  onAddMoney: () => void;
  onQuickAdd: (amount: number) => void;
}

function WalletBalanceCard({
  balance,
  isLoading = false,
  onAddMoney,
  onQuickAdd,
}: WalletBalanceCardProps) {
  const updatedAt = balance?.updated_at ? parseISO(balance.updated_at) : null;
  const updatedLabel =
    updatedAt && isValid(updatedAt) ? formatDistanceToNow(updatedAt, { addSuffix: true }) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      aria-label="Wallet balance"
      className="relative overflow-hidden rounded-[1.75rem] bg-primary p-5 text-white shadow-xl shadow-primary/20 sm:p-6"
    >
      {/* A single flat brand fill, with one white dot texture over it. The card
          used to layer a radial colour-mix surface, an animated sweep and a
          blurred blob — three gradients doing the job one solid colour does,
          and the reason the fill never quite matched --primary anywhere else
          on the page. The dots are a texture, not a second colour: they stop a
          large flat panel reading as dead space without introducing a hue. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-white/60 uppercase">
              Available balance
            </p>
            {isLoading ? (
              <div className="mt-2 h-10 w-36 animate-pulse rounded-lg bg-white/15" />
            ) : (
              <p className="mt-1.5 text-5xl font-bold tracking-tight tabular-nums">
                {formatRupees(balance?.balance ?? 0)}
              </p>
            )}
            {updatedLabel && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/55">
                <RefreshCw className="size-3" />
                Updated {updatedLabel}
              </p>
            )}
          </div>
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"
          >
            <WalletIcon className="size-6" />
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/15 pt-5">
          <span className="text-xs font-medium text-white/60">Quick add</span>
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onQuickAdd(amount)}
              className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white outline-none transition-colors hover:border-white/40 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              +{formatRupees(amount)}
            </button>
          ))}
        </div>

        <Button
          size="lg"
          onClick={onAddMoney}
          className="mt-5 w-full bg-white font-semibold text-primary shadow-sm hover:bg-white/90 sm:w-auto sm:min-w-48"
        >
          <Plus className="size-4" />
          Add money
        </Button>

        <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-white/50">
          <ShieldCheck className="size-3.5" />
          Payments secured by Razorpay · 256-bit encrypted
        </p>
      </div>
    </motion.section>
  );
}

export { WalletBalanceCard };
