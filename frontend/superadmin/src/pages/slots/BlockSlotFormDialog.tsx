import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useCitySlotConfig } from "@/hooks/queries/useCitySlotConfig";
import { useCreateSlotBlocksBulk } from "@/hooks/queries/useSlotBlocks";
import type { SlotSystemCityDto } from "@/services/api/citySlotConfigApi";

interface BlockSlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: SlotSystemCityDto[];
  defaultCityId?: string;
  defaultDate?: string;
}

interface FormState {
  cityId: string;
  slotTemplateIds: string[];
  blockDate: string;
  reason: string;
}

function emptyForm(defaultCityId?: string, defaultDate?: string): FormState {
  return {
    cityId: defaultCityId ?? "",
    slotTemplateIds: [],
    blockDate: defaultDate ?? "",
    reason: "",
  };
}

function BlockSlotFormDialog({
  open,
  onOpenChange,
  cities,
  defaultCityId,
  defaultDate,
}: BlockSlotFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultCityId, defaultDate));

  useEffect(() => {
    if (open) setForm(emptyForm(defaultCityId, defaultDate));
  }, [open, defaultCityId, defaultDate]);

  const configQuery = useCitySlotConfig(form.cityId || undefined);
  const templates = (configQuery.data?.templates ?? []).filter((t) => t.active);

  const createBlocksBulk = useCreateSlotBlocksBulk();

  function handleCityChange(cityId: string) {
    setForm((f) => ({ ...f, cityId, slotTemplateIds: [] }));
  }

  function toggleTemplate(id: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      slotTemplateIds: checked
        ? [...f.slotTemplateIds, id]
        : f.slotTemplateIds.filter((t) => t !== id),
    }));
  }

  function toggleAll(checked: boolean) {
    setForm((f) => ({
      ...f,
      slotTemplateIds: checked ? templates.map((t) => t.slotTemplateId) : [],
    }));
  }

  function handleSubmit() {
    if (!form.cityId || form.slotTemplateIds.length === 0 || !form.blockDate) {
      toast.error("City, at least one slot template, and date are required.");
      return;
    }

    createBlocksBulk.mutate(
      {
        cityId: form.cityId,
        slotTemplateIds: form.slotTemplateIds,
        blockDate: form.blockDate,
        reason: form.reason.trim() || null,
      },
      {
        onSuccess: (blocks) => {
          toast.success(blocks.length === 1 ? "Slot blocked." : `${blocks.length} slots blocked.`);
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to block slots.");
        },
      },
    );
  }

  const allSelected = templates.length > 0 && form.slotTemplateIds.length === templates.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Block Slots</DialogTitle>
          <DialogDescription>
            Manually block one or more slot templates for a specific city and date (e.g.
            maintenance, phlebo shortage).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-city">City *</Label>
            <Select value={form.cityId || undefined} onValueChange={handleCityChange}>
              <SelectTrigger id="block-city">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Slot Templates *</Label>
              {templates.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => toggleAll(!allSelected)}
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              )}
            </div>
            {!form.cityId ? (
              <p className="text-xs text-muted-foreground">Select a city first.</p>
            ) : templates.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No slot templates assigned to this city yet.
              </p>
            ) : (
              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
                {templates.map((t) => (
                  <label
                    key={t.slotTemplateId}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-secondary/40"
                  >
                    <Checkbox
                      checked={form.slotTemplateIds.includes(t.slotTemplateId)}
                      onCheckedChange={(checked) =>
                        toggleTemplate(t.slotTemplateId, checked === true)
                      }
                    />
                    <span className="flex-1 text-foreground">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.startTime} - {t.endTime}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-date">Date *</Label>
            <Input
              id="block-date"
              type="date"
              value={form.blockDate}
              onChange={(e) => setForm((f) => ({ ...f, blockDate: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-reason">Reason</Label>
            <Textarea
              id="block-reason"
              placeholder="e.g. Phlebo shortage"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createBlocksBulk.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createBlocksBulk.isPending}>
            {createBlocksBulk.isPending
              ? "Blocking..."
              : form.slotTemplateIds.length > 1
                ? `Block ${form.slotTemplateIds.length} Slots`
                : "Block Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { BlockSlotFormDialog };
