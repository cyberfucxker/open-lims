import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidePanel } from "@/components/common/SidePanel";
import { useCreateFranchiseOrder, useFranchiseServiceAreas } from "@/hooks/queries/useFranchise";
import { formatCurrency } from "@/lib/format";

import { FranchiseCatalogPicker, type FranchiseCatalogItem } from "./FranchiseCatalogPicker";

interface FranchiseCreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM = {
  name: "",
  mobile: "",
  gender: "Male" as "Male" | "Female" | "Other",
  age: "",
  address: "",
  pincode: "",
  areaId: "",
  paymentMode: "CASH" as "CASH" | "ONLINE",
};

/** The franchise portal's "Create Order" action — always for a walk-in
 *  patient with no app account yet (see `CreateFranchiseOrderBody`'s
 *  doc-comment): the `AppUser` + a `SELF` family member + one address are
 *  created alongside the order itself, server-side, in one transaction.
 *  Unlike the Superadmin's own Create Order (which only ever picks an
 *  EXISTING app customer), there's deliberately no "search existing
 *  customer" tab here yet — that would need a new, broader customer-search
 *  endpoint the franchise doesn't have, and searching across every app
 *  customer platform-wide is its own separate access question worth a
 *  dedicated ask rather than folding into this. */
function FranchiseCreateOrderDialog({ open, onOpenChange }: FranchiseCreateOrderDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedItems, setSelectedItems] = useState<FranchiseCatalogItem[]>([]);
  const { data: serviceAreas = [] } = useFranchiseServiceAreas();
  const createOrder = useCreateFranchiseOrder();

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setSelectedItems([]);
  }, [open]);

  const selectedArea = serviceAreas.find((a) => a.id === form.areaId);
  const amount = selectedItems.reduce((s, i) => s + i.price, 0);

  function toggleItem(item: FranchiseCatalogItem) {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item],
    );
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Enter the patient's name");
    if (!/^[0-9]{10,15}$/.test(form.mobile.trim()))
      return toast.error("Enter a valid mobile number");
    if (!form.age || Number(form.age) <= 0) return toast.error("Enter the patient's age");
    if (!form.address.trim()) return toast.error("Enter the address");
    if (!selectedArea) return toast.error("Select the service area");
    if (!/^[0-9]{6}$/.test(form.pincode.trim()))
      return toast.error("Enter a valid 6-digit pincode");
    if (selectedItems.length === 0) return toast.error("Select at least one test or package");

    createOrder.mutate(
      {
        newCustomer: {
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          gender: form.gender,
          age: Number(form.age),
          address: {
            address: form.address.trim(),
            city: selectedArea.cityName,
            state: selectedArea.stateName,
            pincode: form.pincode.trim(),
            areaId: form.areaId,
          },
        },
        orderDate: new Date().toISOString().slice(0, 10),
        testIds: selectedItems.filter((i) => i.type === "test").map((i) => i.id),
        packageIds: selectedItems.filter((i) => i.type === "package").map((i) => i.id),
        paymentMode: form.paymentMode,
      },
      {
        onSuccess: (order) => {
          toast.success(`${order.orderNumber} created`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to create order");
        },
      },
    );
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Create Order"
      description="For a walk-in patient — creates their account, address and this booking together."
      widthClassName="sm:max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending ? "Creating…" : "Create Order"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Patient
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Mobile</Label>
              <Input
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="10-digit mobile"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Age</Label>
              <Input
                type="number"
                min={0}
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                placeholder="Years"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v as typeof f.gender }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Collection Address
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Area</Label>
              <Select
                value={form.areaId}
                onValueChange={(v) => setForm((f) => ({ ...f, areaId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your service area" />
                </SelectTrigger>
                <SelectContent>
                  {serviceAreas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}, {a.cityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {serviceAreas.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No service areas assigned to your franchise yet.
                </p>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="House/street/landmark"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Pincode</Label>
              <Input
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                placeholder="6-digit pincode"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Tests &amp; Packages
          </h3>
          <FranchiseCatalogPicker selectedItems={selectedItems} onToggle={toggleItem} />
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedItems.map((item) => (
                <Badge
                  key={`${item.type}-${item.id}`}
                  variant={item.type === "package" ? "gradient" : "default"}
                >
                  {item.name}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Payment
          </h3>
          <Select
            value={form.paymentMode}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, paymentMode: v as typeof f.paymentMode }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash (collected on visit)</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section className="flex flex-col gap-1.5 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Total ({selectedItems.length} items)</span>
            <span className="tabular-nums">{formatCurrency(amount)}</span>
          </div>
        </section>
      </div>
    </SidePanel>
  );
}

export { FranchiseCreateOrderDialog };
