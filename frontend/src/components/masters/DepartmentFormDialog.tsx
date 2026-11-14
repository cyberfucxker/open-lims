import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { RippleButton } from "@/components/common/RippleButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDepartment, useUpdateDepartment } from "@/hooks/queries/useDepartments";
import { departmentFormSchema, type DepartmentFormSchemaType } from "@/schemas/masterSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { Department } from "@/types/master";

const DEFAULT_VALUES: DepartmentFormSchemaType = {
  name: "",
  code: "",
  description: "",
  active: true,
};

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
}

function DepartmentFormDialog({ open, onOpenChange, department }: DepartmentFormDialogProps) {
  const isEdit = !!department;
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const isPending = createDepartment.isPending || updateDepartment.isPending;

  const form = useForm<DepartmentFormSchemaType>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        department
          ? {
              name: department.name,
              code: department.code ?? "",
              description: department.description ?? "",
              active: department.active,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, department, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && department) {
        await updateDepartment.mutateAsync({ id: department.id, values });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createDepartment.mutateAsync(values);
        toast.success(`${values.name} added to departments`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Department" : "Add Department"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Hematology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="HEMA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Short description…" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <RippleButton type="submit" disabled={isPending}>
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Department"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { DepartmentFormDialog };
