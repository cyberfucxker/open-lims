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
import { useCreateCity, useStates, useUpdateCity } from "@/hooks/queries/useCityMaster";
import type { CityDto } from "@/services/api/cityApi";

interface CityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: CityDto | null;
}

interface FormState {
  name: string;
  stateId: string;
  isActive: boolean;
  isFeatured: boolean;
}

const EMPTY_FORM: FormState = { name: "", stateId: "", isActive: true, isFeatured: false };

function CityFormDialog({ open, onOpenChange, city }: CityFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const statesQuery = useStates();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const isSaving = createCity.isPending || updateCity.isPending;

  useEffect(() => {
    if (!open) return;
    if (city) {
      setForm({
        name: city.name,
        stateId: city.stateId,
        isActive: city.isActive,
        isFeatured: city.isFeatured,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, city]);

  const isValid = form.name.trim().length > 1 && form.stateId.length > 0;

  async function handleSubmit() {
    if (!isValid) {
      toast.error("Enter a city name and select a state before saving.");
      return;
    }

    const values = {
      name: form.name.trim(),
      stateId: form.stateId,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };

    try {
      if (city) {
        await updateCity.mutateAsync({ id: city.id, values });
      } else {
        await createCity.mutateAsync(values);
      }
      toast.success(city ? "City updated successfully." : "City created successfully.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{city ? "Edit City" : "Add City"}</DialogTitle>
          <DialogDescription>
            {city
              ? "Update this city. The patient app's location picker and sitemap pick up the change automatically."
              : "Add a new city the patient app can be browsed/booked in. It appears in the location picker and sitemap once saved."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city-name">Name *</Label>
            <Input
              id="city-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jaipur"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city-state">State *</Label>
            <Select
              value={form.stateId || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, stateId: v }))}
            >
              <SelectTrigger id="city-state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {(statesQuery.data ?? []).map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive cities disappear from the app's location picker and the sitemap — existing
                bookings there keep working.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Featured</p>
              <p className="text-xs text-muted-foreground">
                Shown in the Home page's curated "Book Near You" city links — leave off for most
                cities, this is meant to stay a short list.
              </p>
            </div>
            <Switch
              checked={form.isFeatured}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : city ? "Save Changes" : "Create City"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CityFormDialog };
