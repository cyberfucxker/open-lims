import { useState } from "react";
import toast from "react-hot-toast";

import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePriceLists } from "@/hooks/queries/usePriceLists";
import { useAssignPriceList, useRemovePriceList } from "@/hooks/queries/useReferralSources";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReferralSource } from "@/types/referralSource";

interface AssignPriceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralSource: ReferralSource | null;
}

function AssignPriceListDialog({ open, onOpenChange, referralSource }: AssignPriceListDialogProps) {
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>("");
  const { data: priceListData } = usePriceLists({ active: "true", pageSize: 100 });
  const assignPriceList = useAssignPriceList();
  const removePriceList = useRemovePriceList();

  const priceListOptions = (priceListData?.rows ?? []).map((priceList) => ({
    value: priceList.id,
    label: priceList.name,
  }));

  const handleAssign = async () => {
    if (!referralSource || !selectedPriceListId) return;
    try {
      await assignPriceList.mutateAsync({
        id: referralSource.id,
        priceListId: selectedPriceListId,
      });
      toast.success("Price list assigned");
      setSelectedPriceListId("");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to assign price list");
    }
  };

  const handleRemove = async () => {
    if (!referralSource) return;
    try {
      await removePriceList.mutateAsync(referralSource.id);
      toast.success("Price list assignment removed");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to remove price list");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedPriceListId("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Price List</DialogTitle>
        </DialogHeader>

        {referralSource && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Referral: <span className="font-medium text-foreground">{referralSource.name}</span>
            </p>

            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground">Currently assigned</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {referralSource.assignedPriceListName ?? "None"}
                </p>
                {referralSource.assignedPriceListId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={removePriceList.isPending}
                    onClick={handleRemove}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Assign a new price list</p>
              <SearchableSelect
                options={priceListOptions}
                value={selectedPriceListId || undefined}
                onChange={setSelectedPriceListId}
                placeholder="Select price list"
                searchPlaceholder="Search price lists…"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!selectedPriceListId || assignPriceList.isPending}
            onClick={handleAssign}
          >
            {assignPriceList.isPending ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AssignPriceListDialog };
