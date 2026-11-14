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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePriceList, useUpdatePriceList } from "@/hooks/queries/usePriceLists";
import type { PriceList } from "@/services/api/priceListApi";

interface PriceListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; null/undefined = create mode. */
  priceList?: PriceList | null;
}

function PriceListFormDialog({ open, onOpenChange, priceList }: PriceListFormDialogProps) {
  const isEdit = !!priceList;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const createMutation = useCreatePriceList();
  const updateMutation = useUpdatePriceList();
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(priceList?.name ?? "");
    setDescription(priceList?.description ?? "");
    setActive(priceList?.active ?? true);
  }, [open, priceList]);

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Enter a price list name (at least 2 characters).");
      return;
    }

    const values = {
      name: trimmedName,
      description: description.trim() || null,
      active,
    };

    try {
      if (isEdit && priceList) {
        await updateMutation.mutateAsync({ id: priceList.id, values });
        toast.success(`${trimmedName} updated`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`${trimmedName} created`);
      }
      onOpenChange(false);
    } catch {
      // httpClient surfaces the API error toast; keep the dialog open to retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Price List" : "Add Price List"}</DialogTitle>
          <DialogDescription>
            Custom test pricing that can be assigned to B2B organizations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pl-name">Name</Label>
            <Input
              id="pl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Corporate Rate Card"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pl-description">Description</Label>
            <Textarea
              id="pl-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note about who this price list is for"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div className="flex flex-col">
              <Label htmlFor="pl-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive lists stay saved but can't be assigned to new organizations.
              </p>
            </div>
            <Switch id="pl-active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Price List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PriceListFormDialog };
