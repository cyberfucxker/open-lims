import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { AppUserListRow } from "@/services/api/appUserApi";
import { cn } from "@/utils/cn";

interface WalletAdjustDialogProps {
  customer: AppUserListRow | null;
  mode: "credit" | "debit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, reason: string) => void;
}

const CREDIT_REASONS = [
  "Goodwill credit",
  "Referral bonus",
  "Recharge correction",
  "Support resolution",
];
const DEBIT_REASONS = [
  "Order payment correction",
  "Wallet abuse reversal",
  "Duplicate credit reversal",
  "Expired promo credit",
];

function WalletAdjustDialog({ customer, mode, onOpenChange, onSubmit }: WalletAdjustDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (customer) {
      setAmount("");
      setReason("");
    }
  }, [customer, mode]);

  const numericAmount = Number(amount);
  const isValid =
    customer != null &&
    numericAmount > 0 &&
    reason.trim().length > 0 &&
    (mode === "credit" || numericAmount <= customer.walletBalance);

  const isCredit = mode === "credit";

  return (
    <Dialog open={customer != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCredit ? "Credit Wallet" : "Debit Wallet"}</DialogTitle>
          <DialogDescription>
            {customer
              ? `${isCredit ? "Add" : "Deduct"} funds ${isCredit ? "to" : "from"} ${customer.name ?? customer.mobile}'s wallet. Current balance: ${formatCurrency(customer.walletBalance)}.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-amount">Amount</Label>
            <Input
              id="adjust-amount"
              type="number"
              min={1}
              max={isCredit ? undefined : customer?.walletBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
            {!isCredit && customer && numericAmount > customer.walletBalance && (
              <p className="text-xs text-destructive">Amount exceeds current wallet balance.</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-reason">Reason</Label>
            <Textarea
              id="adjust-reason"
              placeholder={`e.g. ${(isCredit ? CREDIT_REASONS : DEBIT_REASONS)[0]}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className={cn(!isCredit && "bg-destructive text-white hover:bg-destructive/90")}
            disabled={!isValid}
            onClick={() => isValid && onSubmit(numericAmount, reason.trim())}
          >
            {isCredit ? "Add Credit" : "Debit Wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { WalletAdjustDialog };
