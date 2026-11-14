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
import {
  useCreateCommissionSlab,
  useUpdateCommissionSlab,
} from "@/hooks/queries/useCommissionSlabs";
import {
  commissionSlabFormSchema,
  type CommissionSlabFormSchemaType,
} from "@/schemas/commissionSlabSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { CommissionSlab } from "@/types/commissionSlab";

const DEFAULT_VALUES: CommissionSlabFormSchemaType = {
  fromAmount: 0,
  toAmount: "",
  percentage: 0,
  active: true,
};

interface CommissionSlabFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slab?: CommissionSlab | null;
}

function CommissionSlabFormDialog({ open, onOpenChange, slab }: CommissionSlabFormDialogProps) {
  const isEdit = !!slab;
  const createSlab = useCreateCommissionSlab();
  const updateSlab = useUpdateCommissionSlab();
  const isPending = createSlab.isPending || updateSlab.isPending;

  const form = useForm<CommissionSlabFormSchemaType>({
    resolver: zodResolver(commissionSlabFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        slab
          ? {
              fromAmount: slab.fromAmount,
              toAmount: slab.toAmount === null ? "" : String(slab.toAmount),
              percentage: slab.percentage,
              active: slab.active,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, slab, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const toAmount =
      values.toAmount === undefined || values.toAmount === "" ? null : Number(values.toAmount);
    const payload = {
      fromAmount: values.fromAmount,
      toAmount,
      percentage: values.percentage,
      active: values.active,
    };
    try {
      if (isEdit && slab) {
        await updateSlab.mutateAsync({ id: slab.id, values: payload });
        toast.success("Commission slab updated successfully");
      } else {
        await createSlab.mutateAsync(payload);
        toast.success("Commission slab added successfully");
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
          <DialogTitle>{isEdit ? "Edit Commission Slab" : "Add Commission Slab"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="fromAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Amount (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Leave blank for open-ended"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentage</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0" {...field} />
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
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Slab"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { CommissionSlabFormDialog };
