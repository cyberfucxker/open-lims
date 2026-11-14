import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/common/SidePanel";
import { useAddFranchiseHomeVisitItems } from "@/hooks/queries/useFranchise";
import { formatCurrency } from "@/lib/format";
import type { AppOrderDetail } from "@/services/api/appOrderApi";

import { FranchiseCatalogPicker, type FranchiseCatalogItem } from "./FranchiseCatalogPicker";

interface FranchiseAddHomeVisitItemsDialogProps {
  order: AppOrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The franchise portal's mirror of the Superadmin's `AddHomeVisitItemsDialog`
 *  — same underlying action (`addHomeVisitItems`, scoped to this franchise's
 *  own visible orders on the backend), same "callable any number of times"
 *  behaviour, just picking from this franchise's own price list instead of
 *  the admin-only catalog search (see `FranchiseCatalogPicker`'s doc-comment). */
function FranchiseAddHomeVisitItemsDialog({
  order,
  open,
  onOpenChange,
}: FranchiseAddHomeVisitItemsDialogProps) {
  const [selectedItems, setSelectedItems] = useState<FranchiseCatalogItem[]>([]);
  const addItems = useAddFranchiseHomeVisitItems();

  useEffect(() => {
    if (!open) return;
    setSelectedItems([]);
  }, [open]);

  const amount = selectedItems.reduce((s, i) => s + i.price, 0);

  function toggleItem(item: FranchiseCatalogItem) {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item],
    );
  }

  function handleSubmit() {
    if (selectedItems.length === 0) {
      toast.error("Select at least one test or package");
      return;
    }
    addItems.mutate(
      {
        orderId: order.id,
        body: {
          testIds: selectedItems.filter((i) => i.type === "test").map((i) => i.id),
          packageIds: selectedItems.filter((i) => i.type === "package").map((i) => i.id),
        },
      },
      {
        onSuccess: () => {
          toast.success(`Tests added to ${order.orderNumber}`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add tests");
        },
      },
    );
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Add Tests"
      description={`This visit was booked with a symptom, not a test list — pick what ${order.homeVisitFamilyMember?.name ?? "the patient"} should be tested for.`}
      widthClassName="sm:max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addItems.isPending}>
            {addItems.isPending ? "Adding…" : "Add Tests"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {order.symptomNotes && (
          <section className="rounded-xl border border-border bg-secondary/30 p-3">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Patient described
            </h3>
            <p className="text-sm text-foreground">{order.symptomNotes}</p>
          </section>
        )}

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

        <section className="flex flex-col gap-1.5 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Test amount ({selectedItems.length} items)</span>
            <span className="tabular-nums">{formatCurrency(amount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Plus the {formatCurrency(order.phlebotomyCharges)} phlebotomy charge already fixed at
            booking — both are collected COD at the doorstep.
          </p>
        </section>
      </div>
    </SidePanel>
  );
}

export { FranchiseAddHomeVisitItemsDialog };
