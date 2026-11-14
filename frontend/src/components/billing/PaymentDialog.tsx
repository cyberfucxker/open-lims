import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddPayment } from "@/hooks/queries/useBills";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { BillDetails, PaymentModeInput } from "@/types/bill";

const PAYMENT_MODES: PaymentModeInput[] = ["Cash", "Card", "UPI", "Online"];

interface PaymentDialogProps {
  bill: BillDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaymentDialog({ bill, open, onOpenChange }: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentModeInput>("Cash");
  const [transactionId, setTransactionId] = useState("");
  const addPayment = useAddPayment();

  if (!bill) return null;

  const reset = () => {
    setAmount("");
    setMode("Cash");
    setTransactionId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = Number(amount);
    if (!amountValue || amountValue <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await addPayment.mutateAsync({
        id: bill.id,
        input: { amount: amountValue, mode, transactionId: transactionId || undefined },
      });
      toast.success("Payment recorded successfully");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to record payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {bill.billNo} — Due amount ₹{bill.dueAmount.toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Payment Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentModeInput)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode !== "Cash" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payment-txn">Transaction ID (optional)</Label>
              <Input
                id="payment-txn"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. UPI reference number"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPayment.isPending}>
              {addPayment.isPending && <Loader2 className="size-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { PaymentDialog };
