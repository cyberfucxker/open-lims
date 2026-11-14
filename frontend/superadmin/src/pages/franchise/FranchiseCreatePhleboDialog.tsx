import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidePanel } from "@/components/common/SidePanel";
import { useCreateFranchisePhlebo, useFranchiseServiceAreas } from "@/hooks/queries/useFranchise";

interface FranchiseCreatePhleboDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM = { name: "", mobile: "", workingHoursStart: "", workingHoursEnd: "" };

/** Lets a franchise add its own phlebotomist — restricted server-side to
 *  the areas this franchise is itself assigned to cover (see
 *  `phlebotomist.service.ts#createOwnPhlebotomist`'s doc-comment): this
 *  dialog only ever offers those areas to pick from in the first place, so
 *  the restriction is never actually hit as an error here — it's enforced
 *  again on the backend because a form field is advisory, not a boundary. */
function FranchiseCreatePhleboDialog({ open, onOpenChange }: FranchiseCreatePhleboDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const { data: serviceAreas = [] } = useFranchiseServiceAreas();
  const createPhlebo = useCreateFranchisePhlebo();

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setSelectedAreaIds([]);
  }, [open]);

  // A phlebo's areas must all share one city (its own `cityId` is derived
  // from them) — once at least one is picked, the rest of the list is
  // narrowed to the same city so an impossible combination can't be built.
  const lockedCityId = useMemo(() => {
    const first = serviceAreas.find((a) => selectedAreaIds.includes(a.id));
    return first?.cityId ?? null;
  }, [serviceAreas, selectedAreaIds]);

  function toggleArea(areaId: string) {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Enter the phlebotomist's name");
    if (!/^[0-9]{10,15}$/.test(form.mobile.trim()))
      return toast.error("Enter a valid mobile number");
    if (selectedAreaIds.length === 0) return toast.error("Select at least one service area");

    createPhlebo.mutate(
      {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        workingHoursStart: form.workingHoursStart || undefined,
        workingHoursEnd: form.workingHoursEnd || undefined,
        serviceAreaIds: selectedAreaIds,
      },
      {
        onSuccess: (phlebo) => {
          toast.success(`${phlebo.name} added`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to add phlebotomist");
        },
      },
    );
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Add Phlebotomist"
      description="Scoped to your franchise's own assigned service areas."
      widthClassName="sm:max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createPhlebo.isPending}>
            {createPhlebo.isPending ? "Adding…" : "Add Phlebotomist"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
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
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Working hours start</Label>
            <Input
              type="time"
              value={form.workingHoursStart}
              onChange={(e) => setForm((f) => ({ ...f, workingHoursStart: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Working hours end</Label>
            <Input
              type="time"
              value={form.workingHoursEnd}
              onChange={(e) => setForm((f) => ({ ...f, workingHoursEnd: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Service Areas</Label>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {serviceAreas.map((area) => {
              const disabled = lockedCityId !== null && area.cityId !== lockedCityId;
              return (
                <label
                  key={area.id}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                  aria-disabled={disabled}
                >
                  <Checkbox
                    checked={selectedAreaIds.includes(area.id)}
                    disabled={disabled}
                    onCheckedChange={() => toggleArea(area.id)}
                  />
                  <span>
                    {area.name}, {area.cityName}
                  </span>
                </label>
              );
            })}
            {serviceAreas.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No service areas assigned to your franchise yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

export { FranchiseCreatePhleboDialog };
