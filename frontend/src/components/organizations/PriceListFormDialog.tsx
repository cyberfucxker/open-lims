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
import { useCreatePriceList, useUpdatePriceList } from "@/hooks/queries/usePriceLists";
import { priceListFormSchema, type PriceListFormSchemaType } from "@/schemas/organizationSchema";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { PriceList } from "@/types/priceList";

const DEFAULT_VALUES: PriceListFormSchemaType = {
  name: "",
  description: "",
  active: true,
};

interface PriceListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceList?: PriceList | null;
}

function PriceListFormDialog({ open, onOpenChange, priceList }: PriceListFormDialogProps) {
  const isEdit = !!priceList;
  const createPriceList = useCreatePriceList();
  const updatePriceList = useUpdatePriceList();
  const isPending = createPriceList.isPending || updatePriceList.isPending;

  const form = useForm<PriceListFormSchemaType>({
    resolver: zodResolver(priceListFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        priceList
          ? {
              name: priceList.name,
              description: priceList.description ?? "",
              active: priceList.active,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, priceList, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && priceList) {
        await updatePriceList.mutateAsync({ id: priceList.id, values });
        toast.success(`${values.name} updated successfully`);
      } else {
        await createPriceList.mutateAsync(values);
        toast.success(`${values.name} added to price lists`);
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
          <DialogTitle>{isEdit ? "Edit Price List" : "Add Price List"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price List Name</FormLabel>
                  <FormControl>
                    <Input placeholder="B2B Standard Rates" {...field} />
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
                {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Price List"}
              </RippleButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { PriceListFormDialog };
