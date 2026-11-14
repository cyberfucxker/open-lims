import { useState } from "react";
import { Loader2, Mail, MessageCircle, Smartphone } from "lucide-react";
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
import { useSendInvoice } from "@/hooks/queries/useBills";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { BillDetails, SendChannel } from "@/types/bill";

const CHANNELS: { value: SendChannel; label: string; icon: typeof Mail }[] = [
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "SMS", label: "SMS", icon: Smartphone },
];

interface SendInvoiceDialogProps {
  bill: BillDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SendInvoiceDialog({ bill, open, onOpenChange }: SendInvoiceDialogProps) {
  const [channel, setChannel] = useState<SendChannel>("WHATSAPP");
  const [recipient, setRecipient] = useState("");
  const sendInvoice = useSendInvoice();

  if (!bill) return null;

  const defaultRecipient = channel === "EMAIL" ? (bill.patient.email ?? "") : bill.patient.mobile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendInvoice.mutateAsync({
        id: bill.id,
        input: { channel, recipient: recipient || defaultRecipient || undefined },
      });
      toast.success(
        `Invoice sent via ${channel === "WHATSAPP" ? "WhatsApp" : channel.toLowerCase()}`,
      );
      setRecipient("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to send invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            {bill.billNo} — {bill.patient.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Send Via</Label>
            <div className="flex gap-2">
              {CHANNELS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannel(value)}
                  className={
                    channel === value
                      ? "flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-xs font-medium text-primary-foreground shadow-sm"
                      : "flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent"
                  }
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="send-recipient">
              {channel === "EMAIL" ? "Email address" : "Mobile number"}
            </Label>
            <Input
              id="send-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={defaultRecipient || "Enter recipient"}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendInvoice.isPending}>
              {sendInvoice.isPending && <Loader2 className="size-4 animate-spin" />}
              Send Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { SendInvoiceDialog };
