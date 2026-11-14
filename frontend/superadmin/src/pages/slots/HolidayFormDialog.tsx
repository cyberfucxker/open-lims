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
import { Textarea } from "@/components/ui/textarea";
import { useCreateHoliday } from "@/hooks/queries/useHolidays";
import type { SlotSystemCityDto } from "@/services/api/citySlotConfigApi";

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: SlotSystemCityDto[];
  defaultCityId?: string;
  defaultDate?: string;
}

interface FormState {
  cityId: string;
  holidayDate: string;
  reason: string;
}

function emptyForm(defaultCityId?: string, defaultDate?: string): FormState {
  return { cityId: defaultCityId ?? "", holidayDate: defaultDate ?? "", reason: "" };
}

function HolidayFormDialog({
  open,
  onOpenChange,
  cities,
  defaultCityId,
  defaultDate,
}: HolidayFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultCityId, defaultDate));

  useEffect(() => {
    if (open) setForm(emptyForm(defaultCityId, defaultDate));
  }, [open, defaultCityId, defaultDate]);

  const createHoliday = useCreateHoliday();

  function handleSubmit() {
    if (!form.cityId || !form.holidayDate || !form.reason.trim()) {
      toast.error("City, date and reason are required.");
      return;
    }

    createHoliday.mutate(
      { cityId: form.cityId, holidayDate: form.holidayDate, reason: form.reason.trim() },
      {
        onSuccess: () => {
          toast.success("Holiday added.");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to add holiday.");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Holiday</DialogTitle>
          <DialogDescription>
            Holidays block every slot template for the whole city on that date, overriding area and
            manual slot blocks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="holiday-city">City *</Label>
            <Select
              value={form.cityId || undefined}
              onValueChange={(cityId) => setForm((f) => ({ ...f, cityId }))}
            >
              <SelectTrigger id="holiday-city">
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
            <Label htmlFor="holiday-date">Date *</Label>
            <Input
              id="holiday-date"
              type="date"
              value={form.holidayDate}
              onChange={(e) => setForm((f) => ({ ...f, holidayDate: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="holiday-reason">Reason *</Label>
            <Textarea
              id="holiday-reason"
              placeholder="e.g. Diwali"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createHoliday.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createHoliday.isPending}>
            {createHoliday.isPending ? "Adding..." : "Add Holiday"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { HolidayFormDialog };
