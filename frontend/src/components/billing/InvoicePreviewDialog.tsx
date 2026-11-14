import { useEffect, useState } from "react";
import { Download, Loader2, Pencil, Printer, Send } from "lucide-react";
import toast from "react-hot-toast";

import { Logo } from "@/components/brand/Logo";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PaymentDialog } from "@/components/billing/PaymentDialog";
import { SendInvoiceDialog } from "@/components/billing/SendInvoiceDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useBillDetails,
  useMarkPrinted,
  useUpdateAdditionalCharges,
} from "@/hooks/queries/useBills";
import { downloadBlob, fetchInvoicePdfBlob } from "@/services/api/billApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { getBillViewStatus } from "@/utils/billViewStatus";

interface InvoicePreviewDialogProps {
  billId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function currency(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InvoicePreviewDialog({ billId, open, onOpenChange }: InvoicePreviewDialogProps) {
  const { data: bill, isLoading } = useBillDetails(open ? billId : null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [editingCharges, setEditingCharges] = useState(false);
  const [additionalCharges, setAdditionalCharges] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const markPrinted = useMarkPrinted();
  const updateCharges = useUpdateAdditionalCharges();

  useEffect(() => {
    if (!open || !billId) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setIsPdfLoading(true);
    fetchInvoicePdfBlob(billId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load invoice preview");
      })
      .finally(() => {
        if (!cancelled) setIsPdfLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPdfUrl(null);
    };
  }, [open, billId]);

  const handleDownload = async () => {
    if (!bill) return;
    try {
      const blob = await fetchInvoicePdfBlob(bill.id);
      downloadBlob(blob, `${bill.billNo}.pdf`);
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const handlePrint = () => {
    if (!pdfUrl || !bill) return;
    const printWindow = window.open(pdfUrl, "_blank");
    printWindow?.addEventListener("load", () => printWindow.print());
    markPrinted.mutate(bill.id);
  };

  const handleMarkPrinted = () => {
    if (!bill) return;
    markPrinted.mutate(bill.id, {
      onSuccess: () => toast.success("Marked as printed"),
      onError: (error) =>
        toast.error(error instanceof ApiRequestError ? error.message : "Failed to mark as printed"),
    });
  };

  const startEditingCharges = () => {
    if (!bill) return;
    setAdditionalCharges(String(bill.additionalCharges));
    setEditingCharges(true);
  };

  const saveCharges = async () => {
    if (!bill) return;
    const value = Number(additionalCharges);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await updateCharges.mutateAsync({ id: bill.id, input: value });
      toast.success("Additional charges updated");
      setEditingCharges(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to update charges");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-5xl flex-col gap-4 sm:max-w-5xl">
          <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <div className="flex items-center gap-3">
              <Logo className="h-7" />
              <div>
                <DialogTitle>{bill ? bill.billNo : "Invoice Preview"}</DialogTitle>
                {bill && <p className="text-xs text-muted-foreground">{bill.patient.fullName}</p>}
              </div>
            </div>
            {bill && <StatusBadge status={getBillViewStatus(bill)} />}
          </DialogHeader>

          {isLoading || !bill ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_320px]">
              <div className="min-h-[420px] overflow-hidden rounded-xl border border-border bg-secondary/30">
                {isPdfLoading || !pdfUrl ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <iframe src={pdfUrl} title={`Invoice ${bill.billNo}`} className="h-full w-full" />
                )}
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                <div>
                  <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Billing Summary
                  </p>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{currency(bill.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Discount</span>
                      <span>- {currency(bill.discountAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Additional Charges
                        <button
                          type="button"
                          onClick={startEditingCharges}
                          className="text-primary"
                        >
                          <Pencil className="size-3" />
                        </button>
                      </span>
                      {editingCharges ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={additionalCharges}
                            onChange={(e) => setAdditionalCharges(e.target.value)}
                            className="h-7 w-20 text-right"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2"
                            onClick={saveCharges}
                            disabled={updateCharges.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <span>{currency(bill.additionalCharges)}</span>
                      )}
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between text-base font-bold text-navy-950">
                      <span>Net Amount</span>
                      <span>{currency(bill.netAmount)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Paid</span>
                      <span>{currency(bill.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Due</span>
                      <span>{currency(bill.dueAmount)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Payment History
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => setPaymentOpen(true)}
                    >
                      Add
                    </Button>
                  </div>
                  {bill.payments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {bill.payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-xs"
                        >
                          <div>
                            <p className="font-medium text-foreground">{p.mode}</p>
                            <p className="text-muted-foreground">
                              {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                              {p.transactionId ? ` · ${p.transactionId}` : ""}
                            </p>
                          </div>
                          <span className="font-medium">{currency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                  Printed {bill.printCount} time{bill.printCount === 1 ? "" : "s"}
                  {bill.lastPrintedAt
                    ? ` · Last: ${new Date(bill.lastPrintedAt).toLocaleString("en-IN")}`
                    : ""}
                </div>
              </div>
            </div>
          )}

          {bill && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={startEditingCharges}>
                <Pencil className="size-4" /> Edit
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="size-4" /> Download PDF
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={!pdfUrl}>
                <Printer className="size-4" /> Print
              </Button>
              <Button variant="outline" onClick={() => setSendOpen(true)}>
                <Send className="size-4" /> Send
              </Button>
              <Button onClick={handleMarkPrinted} disabled={markPrinted.isPending}>
                {markPrinted.isPending && <Loader2 className="size-4 animate-spin" />}
                Mark As Print
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentDialog bill={bill ?? null} open={paymentOpen} onOpenChange={setPaymentOpen} />
      <SendInvoiceDialog bill={bill ?? null} open={sendOpen} onOpenChange={setSendOpen} />
    </>
  );
}

export { InvoicePreviewDialog };
