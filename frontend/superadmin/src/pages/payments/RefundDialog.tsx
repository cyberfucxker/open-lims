import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
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

interface RefundablePayment {
  orderNumber: string;
  customerName: string;
  amount: number;
}

interface RefundDialogProps {
  payment: RefundablePayment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, reason: string) => void;
}

function RefundDialog({ payment, onOpenChange, onSubmit }: RefundDialogProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (payment) {
      setAmount(String(payment.amount));
      setReason("");
    }
  }, [payment]);

  const numericAmount = Number(amount);
  const isValid =
    payment != null &&
    numericAmount > 0 &&
    numericAmount <= payment.amount &&
    reason.trim().length > 0;

  return (
    <Dialog open={payment != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Refund</DialogTitle>
          <DialogDescription>
            {payment ? `Refund order ${payment.orderNumber} for ${payment.customerName}.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="refund-amount">Refund amount</Label>
            <Input
              id="refund-amount"
              type="number"
              min={1}
              max={payment?.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {payment && (
              <p className="text-xs text-muted-foreground">
                Original payment amount: {formatCurrency(payment.amount)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="refund-reason">Reason for refund</Label>
            <Textarea
              id="refund-reason"
              placeholder="e.g. Sample not collected, duplicate charge, customer cancellation..."
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
            className={cn("bg-destructive text-white hover:bg-destructive/90")}
            disabled={!isValid}
            onClick={() => isValid && onSubmit(numericAmount, reason.trim())}
          >
            Process Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RefundDialog };
