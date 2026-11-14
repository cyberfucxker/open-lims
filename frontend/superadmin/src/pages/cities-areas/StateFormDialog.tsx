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
import { useCreateState, useUpdateState } from "@/hooks/queries/useCityMaster";
import type { StateDto } from "@/services/api/cityApi";

interface StateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: StateDto | null;
}

interface FormState {
  name: string;
  code: string;
}

const EMPTY_FORM: FormState = { name: "", code: "" };

function StateFormDialog({ open, onOpenChange, state }: StateFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createState = useCreateState();
  const updateState = useUpdateState();
  const isSaving = createState.isPending || updateState.isPending;

  useEffect(() => {
    if (!open) return;
    setForm(state ? { name: state.name, code: state.code ?? "" } : EMPTY_FORM);
  }, [open, state]);

  const isValid = form.name.trim().length > 1;

  async function handleSubmit() {
    if (!isValid) {
      toast.error("Enter a state name before saving.");
      return;
    }

    const values = { name: form.name.trim(), code: form.code.trim() || null };

    try {
      if (state) {
        await updateState.mutateAsync({ id: state.id, values });
      } else {
        await createState.mutateAsync(values);
      }
      toast.success(state ? "State updated successfully." : "State created successfully.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{state ? "Edit state" : "Add state"}</DialogTitle>
          <DialogDescription>
            {state
              ? `Renaming this updates the State shown against all ${state.cityCount} of its cities.`
              : "A city can only be added under a state that is on this list."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="state-name">State name</Label>
            <Input
              id="state-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Rajasthan"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="state-code">Short code (optional)</Label>
            <Input
              id="state-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. RJ"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              The usual two-letter abbreviation. Leave it blank if you are not sure.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSaving}>
            {isSaving ? "Saving..." : state ? "Save changes" : "Add state"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { StateFormDialog };
