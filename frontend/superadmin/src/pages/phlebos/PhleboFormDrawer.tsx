import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SidePanel } from "@/components/common/SidePanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCities } from "@/hooks/queries/useCitySlotConfig";
import { useCreatePhlebotomist, useUpdatePhlebotomist } from "@/hooks/queries/usePhlebotomists";
import { useAreas } from "@/hooks/queries/useAreas";
import type { PhlebotomistDto, PhlebotomistFormValues } from "@/services/api/phlebotomistApi";

interface PhleboFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phlebotomist: PhlebotomistDto | null;
}

interface FormState {
  name: string;
  mobile: string;
  photoUrl: string;
  isActive: boolean;
  cityId: string;
  serviceAreaIds: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  mobile: "",
  photoUrl: "",
  isActive: true,
  cityId: "",
  serviceAreaIds: [],
  workingHoursStart: "",
  workingHoursEnd: "",
};

function PhleboFormDrawer({ open, onOpenChange, phlebotomist }: PhleboFormDrawerProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createPhlebotomist = useCreatePhlebotomist();
  const updatePhlebotomist = useUpdatePhlebotomist();
  const isSaving = createPhlebotomist.isPending || updatePhlebotomist.isPending;

  const citiesQuery = useCities();
  const cities = citiesQuery.data ?? [];

  const areasQuery = useAreas({ cityId: form.cityId || undefined, isActive: true, pageSize: 200 });
  const areas = useMemo(() => areasQuery.data?.rows ?? [], [areasQuery.data]);

  useEffect(() => {
    if (!open) return;
    if (phlebotomist) {
      setForm({
        name: phlebotomist.name,
        mobile: phlebotomist.mobile,
        photoUrl: phlebotomist.photoUrl ?? "",
        isActive: phlebotomist.isActive,
        cityId: phlebotomist.cityId ?? "",
        serviceAreaIds: phlebotomist.serviceAreas.map((a) => a.id),
        workingHoursStart: phlebotomist.workingHoursStart ?? "",
        workingHoursEnd: phlebotomist.workingHoursEnd ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, phlebotomist]);

  function handleCityChange(cityId: string) {
    setForm((f) => (f.cityId === cityId ? f : { ...f, cityId, serviceAreaIds: [] }));
  }

  function toggleArea(areaId: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      serviceAreaIds: checked
        ? [...f.serviceAreaIds, areaId]
        : f.serviceAreaIds.filter((id) => id !== areaId),
    }));
  }

  const isEdit = Boolean(phlebotomist);

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!/^[0-9]{10,15}$/.test(form.mobile.trim())) {
      toast.error("Enter a valid mobile number.");
      return;
    }

    const values: PhlebotomistFormValues = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      photoUrl: form.photoUrl.trim() || null,
      isActive: form.isActive,
      cityId: form.cityId || null,
      workingHoursStart: form.workingHoursStart || null,
      workingHoursEnd: form.workingHoursEnd || null,
      serviceAreaIds: form.serviceAreaIds,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(isEdit ? "Phlebotomist updated." : `${values.name} added as a phlebotomist.`);
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (phlebotomist) {
      updatePhlebotomist.mutate({ id: phlebotomist.id, values }, onSettled);
    } else {
      createPhlebotomist.mutate(values, onSettled);
    }
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Phlebotomist" : "Add Phlebotomist"}
      description={
        isEdit
          ? "Update this phlebotomist's details."
          : "Onboard a new field phlebotomist for order assignment."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Phlebotomist"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phlebo-name">Full Name *</Label>
          <Input
            id="phlebo-name"
            placeholder="e.g. Rakesh Kumar"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phlebo-mobile">Mobile Number *</Label>
          <Input
            id="phlebo-mobile"
            placeholder="98XXXXXXXX"
            value={form.mobile}
            onChange={(e) =>
              setForm((f) => ({ ...f, mobile: e.target.value.replace(/[^0-9]/g, "") }))
            }
            maxLength={15}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phlebo-photo">Photo URL</Label>
          <Input
            id="phlebo-photo"
            placeholder="https://..."
            value={form.photoUrl}
            onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phlebo-city">City</Label>
          <Select value={form.cityId || undefined} onValueChange={handleCityChange}>
            <SelectTrigger id="phlebo-city">
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
          <Label>Service Areas</Label>
          {!form.cityId ? (
            <p className="text-xs text-muted-foreground">Select a city to choose service areas.</p>
          ) : areas.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active areas found for this city.</p>
          ) : (
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-xl border border-border p-3">
              {areas.map((area) => (
                <label key={area.id} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={form.serviceAreaIds.includes(area.id)}
                    onCheckedChange={(checked) => toggleArea(area.id, checked === true)}
                  />
                  {area.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phlebo-hours-start">Working Hours Start</Label>
            <Input
              id="phlebo-hours-start"
              type="time"
              value={form.workingHoursStart}
              onChange={(e) => setForm((f) => ({ ...f, workingHoursStart: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phlebo-hours-end">Working Hours End</Label>
            <Input
              id="phlebo-hours-end"
              type="time"
              value={form.workingHoursEnd}
              onChange={(e) => setForm((f) => ({ ...f, workingHoursEnd: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="phlebo-active">Active</Label>
            <span className="text-xs text-muted-foreground">
              Inactive phlebotomists can't be assigned to new orders.
            </span>
          </div>
          <Switch
            id="phlebo-active"
            checked={form.isActive}
            onCheckedChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
          />
        </div>
      </div>
    </SidePanel>
  );
}

export { PhleboFormDrawer };
