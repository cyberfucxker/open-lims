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
import { useCreateSlotTemplate, useUpdateSlotTemplate } from "@/hooks/queries/useSlotTemplates";
import type { SlotTemplateDto, SlotTemplateWriteData } from "@/services/api/slotTemplateApi";

interface SlotTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: SlotTemplateDto | null;
}

interface FormState {
  title: string;
  startTime: string;
  endTime: string;
  defaultCapacity: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  startTime: "",
  endTime: "",
  defaultCapacity: "",
  active: true,
};

function SlotTemplateFormDialog({ open, onOpenChange, template }: SlotTemplateFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createTemplate = useCreateSlotTemplate();
  const updateTemplate = useUpdateSlotTemplate();
  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  useEffect(() => {
    if (!open) return;
    if (template) {
      setForm({
        title: template.title,
        startTime: template.startTime,
        endTime: template.endTime,
        defaultCapacity: String(template.defaultCapacity),
        active: template.active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, template]);

  const isEdit = Boolean(template);

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error("Start and end time are required.");
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error("Start time must be before end time.");
      return;
    }

    const values: SlotTemplateWriteData = {
      title: form.title.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      defaultCapacity: form.defaultCapacity ? Number(form.defaultCapacity) : undefined,
      active: form.active,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(
          isEdit ? "Slot template updated." : `Slot template "${values.title}" created.`,
        );
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      },
    };

    if (template) {
      updateTemplate.mutate({ id: template.id, values }, onSettled);
    } else {
      createTemplate.mutate(values, onSettled);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Slot Template" : "Add Slot Template"}</DialogTitle>
          <DialogDescription>
            A reusable time window (e.g. "08:00 - 10:00") that can be assigned to cities.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-title">Title *</Label>
            <Input
              id="template-title"
              placeholder="e.g. Morning Slot"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-start">Start Time *</Label>
              <Input
                id="template-start"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-end">End Time *</Label>
              <Input
                id="template-end"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-capacity">Default Capacity</Label>
            <Input
              id="template-capacity"
              type="number"
              min={0}
              placeholder="e.g. 10"
              value={form.defaultCapacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, defaultCapacity: e.target.value.replace(/[^0-9]/g, "") }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Informational only — actual booking capacity is derived from active phlebotomist
              coverage per area, not this number.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="template-active">Active</Label>
              <span className="text-xs text-muted-foreground">
                Inactive templates can't be assigned to new cities.
              </span>
            </div>
            <Switch
              id="template-active"
              checked={form.active}
              onCheckedChange={(active) => setForm((f) => ({ ...f, active }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { SlotTemplateFormDialog };
