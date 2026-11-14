import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { useCreateCoupon, useUpdateCoupon } from "@/hooks/queries/useCoupons";
import type {
  Coupon,
  CouponApplicableOn,
  CouponDiscountType,
  CouponFormValues,
  CouponPlatformRestriction,
} from "@/services/api/couponApi";
import { cn } from "@/utils/cn";

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
}

interface FormState {
  code: string;
  title: string;
  discountType: CouponDiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minSubtotal: string;
  applicableOn: CouponApplicableOn;
  platformRestriction: CouponPlatformRestriction;
  validFrom: string;
  validTo: string;
  usageLimitPerUser: string;
  totalUsageLimit: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  title: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscountAmount: "",
  minSubtotal: "",
  applicableOn: "ALL",
  platformRestriction: "ALL",
  validFrom: "",
  validTo: "",
  usageLimitPerUser: "",
  totalUsageLimit: "",
  isActive: true,
};

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function CouponFormDialog({ open, onOpenChange, coupon }: CouponFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const isSaving = createCoupon.isPending || updateCoupon.isPending;

  useEffect(() => {
    if (!open) return;
    if (coupon) {
      setForm({
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: String(coupon.discountValue),
        maxDiscountAmount: coupon.maxDiscountAmount != null ? String(coupon.maxDiscountAmount) : "",
        minSubtotal: coupon.minSubtotal != null ? String(coupon.minSubtotal) : "",
        applicableOn: coupon.applicableOn,
        platformRestriction: coupon.platformRestriction,
        validFrom: toDateInputValue(coupon.validFrom),
        validTo: toDateInputValue(coupon.validTo),
        usageLimitPerUser: coupon.usageLimitPerUser != null ? String(coupon.usageLimitPerUser) : "",
        totalUsageLimit: coupon.totalUsageLimit != null ? String(coupon.totalUsageLimit) : "",
        isActive: coupon.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, coupon]);

  function handleSubmit() {
    if (!form.code.trim()) {
      toast.error("Coupon code is required.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Coupon title is required.");
      return;
    }
    const value = Number(form.discountValue);
    if (!value || value <= 0) {
      toast.error("Enter a valid discount value.");
      return;
    }
    if (form.discountType === "PERCENTAGE" && value > 100) {
      toast.error("Percentage discount cannot exceed 100.");
      return;
    }
    if (form.validFrom && form.validTo && new Date(form.validTo) < new Date(form.validFrom)) {
      toast.error("Valid To date must be on or after Valid From.");
      return;
    }

    const values: CouponFormValues = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      discountType: form.discountType,
      discountValue: value,
      maxDiscountAmount: form.maxDiscountAmount.trim() ? Number(form.maxDiscountAmount) : null,
      minSubtotal: form.minSubtotal.trim() ? Number(form.minSubtotal) : null,
      applicableOn: form.applicableOn,
      platformRestriction: form.platformRestriction,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      usageLimitPerUser: form.usageLimitPerUser.trim() ? Number(form.usageLimitPerUser) : null,
      totalUsageLimit: form.totalUsageLimit.trim() ? Number(form.totalUsageLimit) : null,
      isActive: form.isActive,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(coupon ? "Coupon updated." : `Coupon "${values.code}" created.`);
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (coupon) {
      updateCoupon.mutate({ id: coupon.id, values }, onSettled);
    } else {
      createCoupon.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          <DialogDescription>
            Create a promotional discount coupon for the Example Lab patient app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-code">Coupon Code *</Label>
            <Input
              id="coupon-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. WELCOME20"
              className="font-mono tracking-wide uppercase"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-title">Title *</Label>
            <Input
              id="coupon-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Off on tests"
            />
            <span className="text-xs text-muted-foreground">
              Shown as the tile label on the Home screen's Popular Coupons section.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Applicable On</Label>
            <Select
              value={form.applicableOn}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, applicableOn: v as CouponApplicableOn }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All (tests & packages)</SelectItem>
                <SelectItem value="TESTS">Tests only</SelectItem>
                <SelectItem value="PACKAGES">Packages only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Platform</Label>
            <Select
              value={form.platformRestriction}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, platformRestriction: v as CouponPlatformRestriction }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All — web and app</SelectItem>
                <SelectItem value="APP_ONLY">App only</SelectItem>
                <SelectItem value="WEB_ONLY">Website only</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              Enforced when applied, not just displayed — a patient on the website can't redeem an
              "App only" code, and the other way round.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Discount Type</Label>
            <div
              role="radiogroup"
              className="flex items-center gap-1 rounded-xl border border-border bg-secondary/40 p-1"
            >
              {(["PERCENTAGE", "FLAT"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={form.discountType === type}
                  onClick={() => setForm((f) => ({ ...f, discountType: type }))}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    form.discountType === type
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {type === "PERCENTAGE" ? "Percent (%)" : "Flat (₹)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon-value">
                Discount Value {form.discountType === "PERCENTAGE" ? "(%)" : "(₹)"} *
              </Label>
              <Input
                id="coupon-value"
                type="number"
                min={0}
                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 100"}
              />
            </div>
            {form.discountType === "PERCENTAGE" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="coupon-max-discount">Max Discount (₹)</Label>
                <Input
                  id="coupon-max-discount"
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                  placeholder="Optional cap"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-min-subtotal">Minimum Cart Value (₹)</Label>
            <Input
              id="coupon-min-subtotal"
              type="number"
              min={0}
              value={form.minSubtotal}
              onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))}
              placeholder="Optional minimum subtotal to apply"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon-valid-from">Valid From</Label>
              <Input
                id="coupon-valid-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon-valid-to">Valid To</Label>
              <Input
                id="coupon-valid-to"
                type="date"
                value={form.validTo}
                onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon-usage-per-user">Usage Limit / User</Label>
              <Input
                id="coupon-usage-per-user"
                type="number"
                min={1}
                value={form.usageLimitPerUser}
                onChange={(e) => setForm((f) => ({ ...f, usageLimitPerUser: e.target.value }))}
                placeholder="Optional, e.g. 1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon-usage-total">Total Usage Limit</Label>
              <Input
                id="coupon-usage-total"
                type="number"
                min={1}
                value={form.totalUsageLimit}
                onChange={(e) => setForm((f) => ({ ...f, totalUsageLimit: e.target.value }))}
                placeholder="Optional, e.g. 1000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Active</span>
              <span className="text-xs text-muted-foreground">
                Coupon can be redeemed immediately
              </span>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : coupon ? "Save Changes" : "Add Coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CouponFormDialog };
