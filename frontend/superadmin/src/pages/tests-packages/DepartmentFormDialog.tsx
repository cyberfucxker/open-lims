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
import { useCreateDepartment, useUpdateDepartment } from "@/hooks/queries/useDepartments";
import type { DepartmentDto } from "@/services/api/departmentApi";

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentDto | null;
}

interface FormState {
  name: string;
  code: string;
  description: string;
  active: boolean;
}

const EMPTY_FORM: FormState = { name: "", code: "", description: "", active: true };

function DepartmentFormDialog({ open, onOpenChange, department }: DepartmentFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const isSaving = createDepartment.isPending || updateDepartment.isPending;

  useEffect(() => {
    if (!open) return;
    if (department) {
      setForm({
        name: department.name,
        code: department.code ?? "",
        description: department.description ?? "",
        active: department.active,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, department]);

  const trimmedName = form.name.trim();
  // Mirrors the server's own rule (`department.validation.ts`) so the admin
  // sees it inline rather than as a 400 after saving.
  const nameInvalid = trimmedName.length < 2 || trimmedName.length > 100;
  const codeInvalid = form.code.trim().length > 20;
  const isValid = !nameInvalid && !codeInvalid;

  async function handleSubmit() {
    if (!isValid) {
      toast.error(
        nameInvalid
          ? "Department name must be 2–100 characters."
          : "Code must be 20 characters or fewer.",
      );
      return;
    }

    const values = {
      name: trimmedName,
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      active: form.active,
    };

    try {
      if (department) {
        await updateDepartment.mutateAsync({ id: department.id, values });
      } else {
        await createDepartment.mutateAsync(values);
      }
      toast.success(
        department ? "Department updated successfully." : "Department created successfully.",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{department ? "Edit Department" : "Add Department"}</DialogTitle>
          <DialogDescription>
            {department
              ? "Update this department. Categories filed under it pick up the change."
              : "Create a department to group categories under (e.g. Biochemistry, Pathology)."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name">Name *</Label>
            <Input
              id="dept-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Biochemistry"
              aria-invalid={nameInvalid && form.name.length > 0}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-code">Code</Label>
            <Input
              id="dept-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="BIO"
              aria-invalid={codeInvalid}
            />
            {codeInvalid && <p className="text-xs text-destructive">Max 20 characters.</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-description">Description</Label>
            <Textarea
              id="dept-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Blood chemistry, enzymes, lipid & metabolic panels."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive departments can't be picked for new categories. Existing ones keep working.
              </p>
            </div>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : department ? "Save Changes" : "Create Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DepartmentFormDialog };
