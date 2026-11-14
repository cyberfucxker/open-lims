import { CalendarRange, Receipt, User } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReferralSettlementDetails } from "@/types/referralSettlement";

const STATUS_LABEL: Record<ReferralSettlementDetails["settlementStatus"], string> = {
  PENDING: "Pending",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

interface ReferralSettlementDetailSheetProps {
  settlement: ReferralSettlementDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReferralSettlementDetailSheet({
  settlement,
  open,
  onOpenChange,
}: ReferralSettlementDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg">
        {settlement && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <SheetTitle>{settlement.referralSourceName}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(settlement.fromDate)} – {formatDate(settlement.toDate)}
                  </p>
                </div>
                <StatusBadge
                  status={STATUS_LABEL[settlement.settlementStatus]}
                  className="ml-auto"
                />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <CalendarRange className="size-3.5" /> Settlement Summary
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Patients</p>
                    <p className="font-medium text-foreground">{settlement.totalPatients}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Revenue</p>
                    <p className="font-medium text-foreground">
                      {formatCurrency(settlement.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commission %</p>
                    <p className="font-medium text-foreground">
                      {settlement.commissionPercentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commission Amount</p>
                    <p className="font-medium text-foreground">
                      {formatCurrency(settlement.commissionAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Adjustment</p>
                    <p className="font-medium text-foreground">
                      {formatCurrency(settlement.adjustment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Final Amount</p>
                    <p className="text-base font-semibold text-foreground">
                      {formatCurrency(settlement.finalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Date</p>
                    <p className="font-medium text-foreground">
                      {formatDate(settlement.paymentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground">
                      {formatDate(settlement.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {settlement.remarks && (
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Remarks
                  </p>
                  <p className="text-sm text-muted-foreground">{settlement.remarks}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <User className="size-3.5" /> Incentive Line Items
                </p>
                {settlement.incentives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No incentive line items.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Bill No</TableHead>
                          <TableHead className="text-right">Bill Amount</TableHead>
                          <TableHead className="text-right">Incentive</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlement.incentives.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell className="text-sm">{line.patientName}</TableCell>
                            <TableCell className="font-mono text-xs">{line.billNo}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(line.billAmount)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(line.incentiveAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { ReferralSettlementDetailSheet };
