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
import { useCreateCenter, useUpdateCenter } from "@/hooks/queries/useCenters";
import { centerFormSchema, type CenterFormSchemaType } from "@/schemas/masterSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { Center } from "@/types/master";

const DEFAULT_VALUES: CenterFormSchemaType = {
  name: "",
  code: "",
  address: "",
  city: "",
  active: true,
};

interface CenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center?: Center | null;
}

function CenterFormDialog({ open, onOpenChange, center }: CenterFormDialogProps) {
  const isEdit = !!center;
  const createCenter = useCreateCenter();
  const updateCenter = useUpdateCenter();
  const isPending = createCenter.isPending || updateCenter.isPending;

  const form = useForm<CenterFormSchemaType>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        center
          ? {
              name: center.name,
              code: center.code ?? "",
              address: center.address ?? "",
              city: center.city ?? "",
              active: center.active,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, center, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && center) {
        await updateCenter.mutateAsync({ id: center.id, values });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createCenter.mutateAsync(values);
        toast.success(`${values.name} added to centers`);
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
          <DialogTitle>{isEdit ? "Edit Center" : "Add Center"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Center Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jaipur Main Branch" {...field} />
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
                    <Input placeholder="JAI-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Jaipur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="MI Road, Jaipur" rows={2} {...field} />
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
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Center"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { CenterFormDialog };
