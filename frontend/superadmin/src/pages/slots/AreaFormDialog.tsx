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
import type { SlotSystemCityDto } from "@/services/api/citySlotConfigApi";
import { useCreateArea, useUpdateArea } from "@/hooks/queries/useAreas";
import type { AreaDto, AreaWriteData } from "@/services/api/areaApi";

interface AreaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: SlotSystemCityDto[];
  area: AreaDto | null;
  defaultCityId?: string;
}

interface FormState {
  cityId: string;
  name: string;
  pincodes: string;
  isActive: boolean;
}

function emptyForm(defaultCityId?: string): FormState {
  return { cityId: defaultCityId ?? "", name: "", pincodes: "", isActive: true };
}

function AreaFormDialog({ open, onOpenChange, cities, area, defaultCityId }: AreaFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultCityId));

  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const isSaving = createArea.isPending || updateArea.isPending;

  useEffect(() => {
    if (!open) return;
    if (area) {
      setForm({
        cityId: area.cityId,
        name: area.name,
        pincodes: area.pincodes.join(", "),
        isActive: area.isActive,
      });
    } else {
      setForm(emptyForm(defaultCityId));
    }
  }, [open, area, defaultCityId]);

  const isEdit = Boolean(area);

  function handleSubmit() {
    if (!form.cityId) {
      toast.error("Select a city.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Area name is required.");
      return;
    }

    const values: AreaWriteData = {
      cityId: form.cityId,
      name: form.name.trim(),
      pincodes: form.pincodes
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(isEdit ? "Area updated." : `Area "${values.name}" created.`);
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (area) {
      updateArea.mutate({ id: area.id, values }, onSettled);
    } else {
      createArea.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Area" : "Add Area"}</DialogTitle>
          <DialogDescription>
            Map a serviceable locality to a city — areas drive per-day booking capacity via
            phlebotomist coverage.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area-city">City *</Label>
            <Select
              value={form.cityId || undefined}
              onValueChange={(cityId) => setForm((f) => ({ ...f, cityId }))}
            >
              <SelectTrigger id="area-city">
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
            <Label htmlFor="area-name">Area Name *</Label>
            <Input
              id="area-name"
              placeholder="e.g. HSR Layout"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area-pincodes">Pincodes</Label>
            <Input
              id="area-pincodes"
              placeholder="e.g. 560102, 560103"
              value={form.pincodes}
              onChange={(e) => setForm((f) => ({ ...f, pincodes: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Comma-separated list of pincodes.</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="area-active">Active</Label>
              <span className="text-xs text-muted-foreground">
                Inactive areas can't be assigned to phlebotomists or booked.
              </span>
            </div>
            <Switch
              id="area-active"
              checked={form.isActive}
              onCheckedChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Area"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AreaFormDialog };
