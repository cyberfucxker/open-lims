import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { SidePanel } from "@/components/common/SidePanel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppUser } from "@/hooks/queries/useAppUsers";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/utils/cn";

import { transactionReason } from "./walletUtils";

interface WalletLedgerPanelProps {
  appUserId: string | null;
  onOpenChange: (open: boolean) => void;
}

function WalletLedgerPanel({ appUserId, onOpenChange }: WalletLedgerPanelProps) {
  const { data, isLoading } = useAppUser(appUserId ?? undefined);
  const profile = data?.profile;
  const ledger = data?.wallet.transactions ?? [];

  return (
    <SidePanel
      open={appUserId != null}
      onOpenChange={onOpenChange}
      title={profile ? `${profile.name ?? profile.mobile} — Wallet Ledger` : "Wallet Ledger"}
      description={
        data
          ? `${profile?.mobile} · Current balance ${formatCurrency(data.wallet.balance)}`
          : undefined
      }
      widthClassName="sm:max-w-2xl"
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : ledger.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No wallet activity"
          description="This customer has no wallet transactions yet."
        />
      ) : (
        <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((txn) => {
                const isCredit = txn.type === "CREDIT";
                return (
                  <TableRow key={txn.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(txn.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium capitalize",
                          isCredit ? "text-success" : "text-destructive",
                        )}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="size-3.5" />
                        ) : (
                          <ArrowUpRight className="size-3.5" />
                        )}
                        {txn.type.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium tabular-nums",
                        isCredit ? "text-success" : "text-destructive",
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(txn.amount)}
                    </TableCell>
                    <TableCell className="max-w-48 text-muted-foreground">
                      {transactionReason(txn)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(txn.balanceAfter)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </SidePanel>
  );
}

export { WalletLedgerPanel };
