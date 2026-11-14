import { useState } from "react";
import type { Control } from "react-hook-form";
import { Receipt } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RippleButton } from "@/components/common/RippleButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { PaymentMode } from "@/types/patient";
import type { PatientFormSchema } from "@/schemas/patientSchema";
import { advanceOnEnter } from "@/utils/keyboardNav";
import { cn } from "@/utils/cn";
import {
  COMPACT_BUTTON,
  COMPACT_LABEL,
  COMPACT_TRIGGER,
} from "@/components/patients/registrationCompactStyles";

const PAYMENT_MODES: PaymentMode[] = ["Cash", "Card", "UPI", "Insurance", "Credit"];

interface BillingSummaryPanelProps {
  control: Control<PatientFormSchema>;
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  subtotal: number;
  discount: number;
  total: number;
  submitLabel: string;
  isSubmitting: boolean;
  onReset: () => void;
}

function BillingSummaryPanel({
  control,
  paymentMode,
  onPaymentModeChange,
  subtotal,
  discount,
  total,
  submitLabel,
  isSubmitting,
  onReset,
}: BillingSummaryPanelProps) {
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");

  return (
    <Card className="flex h-full min-h-0 flex-col py-2">
      <CardHeader className="px-3 pb-1">
        <div className="flex items-center gap-2 text-sm font-bold text-navy-950">
          <Receipt className="size-3.5 text-primary" /> Billing Summary
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pt-0.5">
        <div className="flex flex-col gap-1 text-sm font-bold">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <FormField
            control={control}
            name="discountPercent"
            render={({ field }) => {
              const flatAmount =
                subtotal > 0 ? Math.round((subtotal * (field.value || 0)) / 100) : 0;
              return (
                <FormItem className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-1.5">
                    <FormLabel className={cn(COMPACT_LABEL, "text-muted-foreground")}>
                      Discount
                    </FormLabel>
                    <div className="flex rounded-[6px] border border-input p-0.5">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setDiscountMode("percent")}
                        className={cn(
                          "rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                          discountMode === "percent"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setDiscountMode("amount")}
                        className={cn(
                          "rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                          discountMode === "amount"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        ₹
                      </button>
                    </div>
                  </div>
                  <FormControl>
                    {discountMode === "percent" ? (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        tabIndex={-1}
                        className="h-8 w-16 rounded-[6px] px-2 text-right text-sm font-bold"
                        onKeyDown={advanceOnEnter}
                        {...field}
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        max={subtotal}
                        tabIndex={-1}
                        className="h-8 w-20 rounded-[6px] px-2 text-right text-sm font-bold"
                        onKeyDown={advanceOnEnter}
                        value={flatAmount}
                        onChange={(e) => {
                          const amount = Number(e.target.value) || 0;
                          const percent =
                            subtotal > 0
                              ? Math.min(100, Math.max(0, (amount / subtotal) * 100))
                              : 0;
                          field.onChange(percent);
                        }}
                      />
                    )}
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <div className="flex justify-between text-muted-foreground">
            <span>Discount Amount</span>
            <span className={discount > 0 ? "text-emerald-600" : ""}>
              -₹{discount.toLocaleString("en-IN")}
            </span>
          </div>
          <Separator className="my-0.5" />
          <div className="flex items-center justify-between text-base font-bold text-navy-950">
            <span>Net Payable</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-2">
          <p className={cn(COMPACT_LABEL, "shrink-0 text-muted-foreground")}>Paid Via</p>
          <Select value={paymentMode} onValueChange={(v) => onPaymentModeChange(v as PaymentMode)}>
            <SelectTrigger className={cn(COMPACT_TRIGGER, "h-8 w-32")} aria-label="Payment mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField
          control={control}
          name="amountPaid"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={COMPACT_LABEL}>Received Amount</FormLabel>
              <FormControl>
                <Input
                  id="registration-received-amount-input"
                  type="number"
                  min={0}
                  className="h-8 rounded-[6px] px-2.5 text-sm font-bold"
                  onKeyDown={advanceOnEnter}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          <RippleButton
            id="registration-save-finish-button"
            type="submit"
            className={cn(COMPACT_BUTTON, "h-8 w-full")}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : submitLabel}
          </RippleButton>
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="outline"
                tabIndex={-1}
                className={cn(COMPACT_BUTTON, "h-8 w-full")}
              >
                Reset
              </Button>
            }
            title="Reset the form?"
            description="All entered patient details and selected tests will be discarded."
            confirmLabel="Reset"
            destructive
            onConfirm={onReset}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { BillingSummaryPanel };
