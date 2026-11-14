import { format, isValid, parseISO } from "date-fns";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { formatRupees } from "@/utils/format";
import { EASE_OUT_EXPO } from "@/utils/motion";
import type { WalletTransaction } from "@/types";

import { WALLET_SOURCE_LABEL, WALLET_SOURCE_META } from "./walletSource";

interface MonthGroup {
  key: string;
  label: string;
  items: WalletTransaction[];
  /** Credits minus debits for the month — the statement's running story. */
  net: number;
}

/** Groups the ledger into calendar months in the order the API returned them, so the
 *  server's own sorting is preserved rather than re-imposed on the client. Rows whose
 *  timestamp can't be parsed collect under a single "Earlier" bucket instead of vanishing. */
function groupByMonth(transactions: WalletTransaction[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const index = new Map<string, MonthGroup>();

  for (const tx of transactions) {
    const date = parseISO(tx.created_at);
    const dated = isValid(date);
    const key = dated ? format(date, "yyyy-MM") : "unknown";

    let group = index.get(key);
    if (!group) {
      group = { key, label: dated ? format(date, "MMMM yyyy") : "Earlier", items: [], net: 0 };
      index.set(key, group);
      groups.push(group);
    }

    group.items.push(tx);
    group.net += tx.type === "credit" ? tx.amount : -tx.amount;
  }

  return groups;
}

function WalletTransactionRow({ tx, index }: { tx: WalletTransaction; index: number }) {
  const reduceMotion = usePrefersReducedMotion();
  const meta = WALLET_SOURCE_META[tx.source];
  const Icon = meta.icon;
  const isCredit = tx.type === "credit";
  const date = parseISO(tx.created_at);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.035, ease: EASE_OUT_EXPO }}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          meta.iconClass,
        )}
      >
        <Icon className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{WALLET_SOURCE_LABEL[tx.source]}</p>
        <p className="truncate text-xs text-muted-foreground">
          {isValid(date) ? format(date, "d MMM yyyy · h:mm a") : tx.created_at}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-bold tabular-nums",
            isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {isCredit ? "+" : "−"}
          {formatRupees(tx.amount)}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          Bal {formatRupees(tx.balance_after)}
        </p>
      </div>
    </motion.div>
  );
}

function WalletStatementSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          {i > 0 && <Separator />}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function WalletTransactionList({ transactions }: { transactions: WalletTransaction[] }) {
  return (
    <div className="space-y-5">
      {groupByMonth(transactions).map((group) => (
        <section key={group.key} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              {group.label}
            </h3>
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                group.net > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              Net {group.net < 0 ? "−" : "+"}
              {formatRupees(Math.abs(group.net))}
            </span>
          </div>

          <Card className="overflow-hidden">
            {group.items.map((tx, i) => (
              <div key={tx.id}>
                {i > 0 && <Separator />}
                <WalletTransactionRow tx={tx} index={i} />
              </div>
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}

export { WalletTransactionList, WalletStatementSkeleton };
