import { useMemo, useState } from "react";
import { SearchX, Wallet as WalletIcon } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RechargeSheet } from "@/components/wallet/RechargeSheet";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";
import {
  WalletStatementSkeleton,
  WalletTransactionList,
} from "@/components/wallet/WalletTransactionList";
import { useWalletBalance, useWalletTransactions } from "@/hooks/queries/useWallet";

type LedgerFilter = "all" | "credit" | "debit";

const LEDGER_TABS: { value: LedgerFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "credit", label: "Credits" },
  { value: "debit", label: "Debits" },
];

function StatementHeading() {
  return (
    <div>
      <h2 className="text-base font-bold tracking-tight">Statement</h2>
      <p className="text-xs text-muted-foreground">Every credit and debit on your wallet</p>
    </div>
  );
}

function WalletPage() {
  const { data: balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: txData, isLoading: txLoading } = useWalletTransactions();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [prefillAmount, setPrefillAmount] = useState<number | null>(null);
  const [filter, setFilter] = useState<LedgerFilter>("all");

  const ledger = txData?.transactions;
  const visible = useMemo(() => {
    const list = ledger ?? [];
    return filter === "all" ? list : list.filter((tx) => tx.type === filter);
  }, [ledger, filter]);

  const transactions = ledger ?? [];

  const openSheet = (amount: number | null) => {
    setPrefillAmount(amount);
    setSheetOpen(true);
  };

  return (
    <div className="pb-10">
      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-5 sm:pt-6">
        <WalletBalanceCard
          balance={balance}
          isLoading={balanceLoading}
          onAddMoney={() => openSheet(null)}
          onQuickAdd={(amount) => openSheet(amount)}
        />

        <section className="space-y-3">
          {transactions.length > 0 ? (
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as LedgerFilter)}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatementHeading />
                <TabsList className="h-9">
                  {LEDGER_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="h-7 px-3 text-xs">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {LEDGER_TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  {visible.length === 0 ? (
                    <EmptyState
                      icon={SearchX}
                      title={filter === "credit" ? "No credits yet" : "No debits yet"}
                      description={
                        filter === "credit"
                          ? "Recharges, refunds and bonus credits will appear here."
                          : "Payments made from your wallet will appear here."
                      }
                      actionLabel="Show all"
                      onAction={() => setFilter("all")}
                    />
                  ) : (
                    <WalletTransactionList transactions={visible} />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <>
              <StatementHeading />
              {txLoading ? (
                <WalletStatementSkeleton />
              ) : (
                <EmptyState
                  icon={WalletIcon}
                  title="No transactions yet"
                  description="Your recharges, booking payments and refunds will show up here."
                  actionLabel="Add money"
                  onAction={() => openSheet(null)}
                />
              )}
            </>
          )}
        </section>
      </div>

      <RechargeSheet open={sheetOpen} onOpenChange={setSheetOpen} initialAmount={prefillAmount} />
    </div>
  );
}

export { WalletPage };
